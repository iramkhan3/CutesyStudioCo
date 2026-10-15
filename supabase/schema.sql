-- ============================================================================
-- CutesyStudioCo — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor (or `supabase db push`).
-- All app access to these tables goes through the service role key on the
-- server (see lib/supabase/admin.ts), so Row Level Security is enabled with
-- NO public policies — the service role bypasses RLS by design, and the
-- anon/public key (if you ever use it client-side) will see nothing.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  description text not null,
  -- MRP (strikethrough "full price") and price_inr (actual selling price)
  -- are independent columns — edit either directly in the dashboard for a
  -- per-product clearance, price bump, etc. Any sitewide coupon still
  -- applies on top of price_inr at checkout.
  mrp_inr numeric(10, 2) not null default 0,
  price_inr numeric(10, 2) not null,
  -- Fixed USD price for PayPal orders (see lib/paypal.ts) — independent of
  -- price_inr, not a live conversion. Edit directly if needed.
  price_usd numeric(10, 2) not null default 0,
  images text[] not null default '{}',
  stock_quantity integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Running this file again on an existing database (e.g. after adding a new
-- pricing column) picks up the new column without dropping your data.
alter table products add column if not exists mrp_inr numeric(10, 2) not null default 0;
alter table products add column if not exists price_usd numeric(10, 2) not null default 0;
-- Manual display order for the storefront (admin drag-to-reorder). Lower
-- sorts first; ties break by created_at. Default 0 means "unordered" — new
-- products land at the end until explicitly placed.
alter table products add column if not exists sort_order integer not null default 0;
create index if not exists products_sort_order_idx on products (sort_order, created_at);

alter table products enable row level security;

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  email text not null,
  phone text,
  shipping_address jsonb not null,
  items jsonb not null,
  subtotal numeric(10, 2) not null,
  coupon_code text,
  discount_amount numeric(10, 2) not null default 0,
  shipping_amount numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null,
  -- subtotal/discount_amount/shipping_amount/total_amount are all in this
  -- currency — INR for Razorpay orders (price_inr-based), USD for PayPal
  -- orders (price_usd-based, computed independently, not converted).
  currency text not null default 'INR',
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed')),
  payment_provider text not null default 'razorpay'
    check (payment_provider in ('razorpay', 'paypal')),
  razorpay_order_id text,
  razorpay_payment_id text,
  paypal_order_id text,
  paypal_capture_id text,
  created_at timestamptz not null default now()
);

-- Running this file again on an existing database (e.g. after adding the
-- PayPal payment path) picks up the new columns without dropping your data.
alter table orders add column if not exists payment_provider text not null default 'razorpay';
alter table orders drop constraint if exists orders_payment_provider_check;
alter table orders add constraint orders_payment_provider_check
  check (payment_provider in ('razorpay', 'paypal'));
alter table orders add column if not exists paypal_order_id text;
alter table orders add column if not exists paypal_capture_id text;

-- Fulfillment tracking (admin dashboard) — separate from payment_status.
-- payment_status tracks money; fulfillment_status tracks the physical
-- shipment, and only becomes meaningful once payment_status = 'paid'.
alter table orders add column if not exists fulfillment_status text not null default 'unfulfilled';
alter table orders drop constraint if exists orders_fulfillment_status_check;
alter table orders add constraint orders_fulfillment_status_check
  check (fulfillment_status in ('unfulfilled', 'shipped', 'delivered', 'cancelled'));
alter table orders add column if not exists tracking_number text;
alter table orders add column if not exists courier text;
alter table orders add column if not exists admin_notes text;

-- Stock reservation (prevents selling a one-of-one piece twice). Checkout
-- reserves stock atomically the moment an order is created; a second buyer
-- for the same last item is told it's sold out *before* paying. Reservations
-- are returned if payment fails or the checkout is abandoned (> 30 min, see
-- lib/orders.ts). Paid orders keep their reservation — that IS the decrement.
alter table orders add column if not exists stock_reserved boolean not null default false;

-- When the one-time "you left something behind" email went out for this
-- unpaid checkout (lib/abandoned-carts.ts, run daily by Vercel Cron).
alter table orders add column if not exists abandoned_reminder_sent_at timestamptz;

-- All-or-nothing: either every product item in the order is in stock and
-- decremented, or nothing changes and it returns false.
create or replace function reserve_order_stock(p_order_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  item jsonb;
begin
  for item in
    select * from jsonb_array_elements(
      coalesce((select items from orders where id = p_order_id and payment_status = 'pending' and not stock_reserved), '[]'::jsonb)
    )
  loop
    if item->>'kind' = 'product' then
      update products set stock_quantity = stock_quantity - (item->>'quantity')::int
        where id = (item->>'productId')::uuid and stock_quantity >= (item->>'quantity')::int;
      if not found then
        raise exception 'out_of_stock';
      end if;
    end if;
  end loop;
  update orders set stock_reserved = true where id = p_order_id and payment_status = 'pending';
  return true;
exception when raise_exception then
  -- Rolls back every decrement made above in this call.
  return false;
end;
$$;

-- Returns an unpaid order's reserved stock. Safe to call more than once and
-- never touches a paid order (the paid check happens in the same row update).
create or replace function release_order_stock(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  item jsonb;
  v_items jsonb;
begin
  update orders set stock_reserved = false
    where id = p_order_id and stock_reserved and payment_status <> 'paid'
    returning items into v_items;
  if v_items is null then
    return;
  end if;
  for item in select * from jsonb_array_elements(v_items) loop
    if item->>'kind' = 'product' then
      update products set stock_quantity = stock_quantity + (item->>'quantity')::int
        where id = (item->>'productId')::uuid;
    end if;
  end loop;
end;
$$;

-- Releases reservations held by checkouts abandoned for longer than
-- p_minutes. The order stays "pending" so a very late payment is still
-- recorded as paid (it then falls back to a plain stock decrement).
create or replace function release_stale_reservations(p_minutes integer) returns void
language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  for r in
    select id from orders
    where stock_reserved and payment_status <> 'paid' and created_at < now() - make_interval(mins => p_minutes)
  loop
    perform release_order_stock(r.id);
  end loop;
end;
$$;

-- Server-only: the public anon key must never be able to change stock.
revoke execute on function reserve_order_stock(uuid) from public, anon, authenticated;
revoke execute on function release_order_stock(uuid) from public, anon, authenticated;
revoke execute on function release_stale_reservations(integer) from public, anon, authenticated;
grant execute on function reserve_order_stock(uuid) to service_role;
grant execute on function release_order_stock(uuid) to service_role;
grant execute on function release_stale_reservations(integer) to service_role;

alter table orders enable row level security;

create index if not exists orders_razorpay_order_id_idx on orders (razorpay_order_id);
create index if not exists orders_paypal_order_id_idx on orders (paypal_order_id);
create index if not exists orders_email_idx on orders (email);
create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_fulfillment_status_idx on orders (fulfillment_status);

-- ---------------------------------------------------------------------------
-- custom_product_types — pricing/config for the "Build Your Own" / "Surprise
-- Me" custom builder (lib/constants.ts CUSTOM_PRODUCT_TYPES is the fallback
-- when this table is empty/missing, so the builder never breaks). Structural
-- fields (which types exist, requires_phone_model) stay admin-editable per
-- row, but adding a brand-new type still needs a code change (the builder's
-- UI options are keyed to known slugs).
-- ---------------------------------------------------------------------------
create table if not exists custom_product_types (
  slug text primary key,
  name text not null,
  requires_phone_model boolean not null default false,
  image text not null,
  build_mrp_inr numeric(10, 2) not null,
  build_price_inr numeric(10, 2) not null,
  build_price_usd numeric(10, 2) not null,
  surprise_mrp_inr numeric(10, 2) not null,
  surprise_price_inr numeric(10, 2) not null,
  surprise_price_usd numeric(10, 2) not null,
  sort_order integer not null default 0
);

alter table custom_product_types enable row level security;

insert into custom_product_types
  (slug, name, requires_phone_model, image, build_mrp_inr, build_price_inr, build_price_usd, surprise_mrp_inr, surprise_price_inr, surprise_price_usd, sort_order)
values
  ('phone-case', 'Phone Case', true, '/products/real/pink-hello-kitty-case.jpg', 1999, 1000, 12.05, 1799, 900, 10.84, 1),
  ('hairbrush', 'Hairbrush', false, '/products/real/sugar-bow-comb.jpg', 1199, 600, 7.23, 1099, 550, 6.63, 2),
  ('hand-mirror', 'Hand Mirror', false, '/products/real/bubblegum-bow-mirror-1.jpg', 699, 350, 4.22, 649, 325, 3.92, 3),
  ('table-mirror', 'Table Mirror', false, '/products/real/bow-heart-mirror.jpg', 699, 350, 4.22, 649, 325, 3.92, 4),
  ('keychain', 'Keychain', false, '/products/real/sweetheart-keychain-duo.jpg', 599, 300, 3.61, 549, 275, 3.31, 5)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- coupons — admin-editable. `active: false` disables a code entirely (manual
-- entry and auto-apply both stop working); `auto_apply: true` means it's
-- applied automatically with no code needed (at most one such row should be
-- active at a time — lib/coupons.ts picks the first match if more than one
-- somehow is). This replaces the old separate LAUNCH_OFFER_ACTIVE /
-- AUTO_APPLY_COUPON_CODE constants with per-row flags.
-- ---------------------------------------------------------------------------
create table if not exists coupons (
  code text primary key,
  percent_off numeric(5, 2) not null,
  min_purchase_inr numeric(10, 2) not null default 0,
  active boolean not null default true,
  auto_apply boolean not null default false
);

-- Per-coupon shipping override, by destination: _inr for orders shipping
-- within India, _usd for international orders (converted at USD_INR_RATE if
-- the order is charged in the other currency). null = normal shipping rules
-- (lib/shipping.ts), 0 = free shipping, any other amount = flat charge.
alter table coupons add column if not exists shipping_override_inr numeric(10, 2);
alter table coupons add column if not exists shipping_override_usd numeric(10, 2);

alter table coupons enable row level security;

insert into coupons (code, percent_off, min_purchase_inr, active, auto_apply)
values
  ('CUTEJOY30', 30, 500, true, false),
  ('LAUNCH50', 50, 0, true, true)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- email_templates — admin-editable transactional emails (lib/email.ts sends
-- through these; DEFAULT_EMAIL_TEMPLATES in lib/email-templates.ts is the
-- fallback if this table is missing/empty, or if an individual key's row is
-- missing). `active: false` turns that one email off entirely.
-- ---------------------------------------------------------------------------
create table if not exists email_templates (
  key text primary key,
  name text not null,
  subject text not null,
  html text not null,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table email_templates enable row level security;

insert into email_templates (key, name, subject, html, active) values
(
  'order_confirmation',
  'Order confirmation',
  $subj$Your {{site_name}} order is confirmed 🎀$subj$,
  $html$<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #5B4B4F;">
  <h1 style="color:#D291BC;">Thank you for your order! 🎀</h1>
  <p>Hi {{customer_name}}, your order has been received and is being lovingly prepared.</p>
  <p><strong>Order #{{order_id}}</strong> &middot; {{order_date}}</p>
  <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
    {{items_table}}
    {{discount_row}}
    {{shipping_row}}
    <tr>
      <td style="padding-top:12px; font-weight:bold;">Total</td>
      <td style="padding-top:12px; font-weight:bold; text-align:right;">{{total}}</td>
    </tr>
  </table>
  <p><strong>Shipping to:</strong><br/>{{shipping_address}}</p>
  <p>We'll email you again once your order ships. If you have any questions, just reply to this email or reach us at {{site_email}}.</p>
  <p style="margin-top:24px;">With love,<br/>{{site_name}}</p>
</div>$html$,
  true
),
(
  'order_shipped',
  'Order shipped',
  $subj$Your {{site_name}} order has shipped! 📦$subj$,
  $html$<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #5B4B4F;">
  <h1 style="color:#D291BC;">Your order is on its way! 📦</h1>
  <p>Hi {{customer_name}}, your order <strong>#{{order_id}}</strong> has shipped and is headed your way.</p>
  {{tracking_row}}
  <p><strong>Shipping to:</strong><br/>{{shipping_address}}</p>
  <p>We'll let you know once it's delivered too. Questions? Just reply to this email or reach us at {{site_email}}.</p>
  <p style="margin-top:24px;">With love,<br/>{{site_name}}</p>
</div>$html$,
  true
),
(
  'order_delivered',
  'Order delivered',
  $subj$Your {{site_name}} order has arrived! 🎀$subj$,
  $html$<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #5B4B4F;">
  <h1 style="color:#D291BC;">Your order has arrived! 🎀</h1>
  <p>Hi {{customer_name}}, order <strong>#{{order_id}}</strong> has been marked delivered — we hope it made your day a little cuter!</p>
  {{review_button}}
  <p>If anything about your order isn't right, just reply to this email or reach us at {{site_email}} and we'll sort it out.</p>
  <p style="margin-top:24px;">With love,<br/>{{site_name}}</p>
</div>$html$,
  true
),
(
  'order_cancelled',
  'Order cancelled',
  $subj$Your {{site_name}} order was cancelled$subj$,
  $html$<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #5B4B4F;">
  <h1 style="color:#D291BC;">Your order was cancelled</h1>
  <p>Hi {{customer_name}}, order <strong>#{{order_id}}</strong> has been cancelled.</p>
  <p>If you didn't expect this or have any questions, just reply to this email or reach us at {{site_email}}.</p>
  <p style="margin-top:24px;">With love,<br/>{{site_name}}</p>
</div>$html$,
  true
),
(
  'admin_new_order',
  'Admin: new order notification',
  $subj$🎀 New order from {{customer_name}} — {{total}}$subj$,
  $html$<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #5B4B4F;">
  <h1 style="color:#D291BC;">New order! 🎀</h1>
  <p><strong>{{customer_name}}</strong> just placed order #{{order_id}} for <strong>{{total}}</strong>.</p>
  <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
    {{items_table}}
    {{discount_row}}
    {{shipping_row}}
    <tr>
      <td style="padding-top:12px; font-weight:bold;">Total</td>
      <td style="padding-top:12px; font-weight:bold; text-align:right;">{{total}}</td>
    </tr>
  </table>
  <p><strong>Ship to:</strong><br/>{{shipping_address}}</p>
  <p><a href="{{admin_order_link}}" style="color:#D291BC;">View in admin dashboard &rarr;</a></p>
</div>$html$,
  true
),
(
  'newsletter_welcome',
  'Newsletter: welcome',
  $subj$Welcome to {{site_name}}! 🎀$subj$,
  $html$<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #5B4B4F;">
  <h1 style="color:#D291BC;">You're on the list! 🎀</h1>
  <p>Hi there, thanks for joining the {{site_name}} newsletter — you'll be first to hear about new drops, restocks, and sneak peeks before anyone else.</p>
  {{discount_row}}
  <p><a href="{{shop_link}}" style="color:#D291BC;">Browse the shop &rarr;</a></p>
  <p>Questions any time? Just reply to this email or reach us at {{site_email}}.</p>
  <p style="margin-top:24px;">With love,<br/>{{site_name}}</p>
</div>$html$,
  true
),
(
  'abandoned_cart',
  'Abandoned checkout reminder',
  $subj$You left something cute behind 🎀$subj$,
  $html$<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #5B4B4F;">
  <h1 style="color:#D291BC;">Still thinking it over? 🎀</h1>
  <p>Hi {{customer_name}}, you started checking out at {{site_name}} but didn't finish — your picks are still waiting for you:</p>
  <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
    {{items_table}}
  </table>
  <p>Most of our pieces are one-of-a-kind, so once they're gone, they're gone!</p>
  <p style="text-align:center; margin:24px 0;"><a href="{{resume_link}}" style="display:inline-block; padding:12px 24px; background:#D291BC; color:#ffffff; border-radius:999px; text-decoration:none; font-weight:bold;">Finish my order</a></p>
  <p>Had trouble paying, or have a question? <a href="{{whatsapp_link}}" style="color:#D291BC;">Message us on WhatsApp</a> or just reply to this email.</p>
  <p style="margin-top:24px;">With love,<br/>{{site_name}}</p>
</div>$html$,
  true
),
(
  'custom_request_received',
  'Custom request: received (to customer)',
  $subj$We got your custom request 🎀 (#{{request_id}})$subj$,
  $html$<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #5B4B4F;">
  <h1 style="color:#D291BC;">Thank you for your request! 🎀</h1>
  <p>Hi {{customer_name}}, we've received your custom request <strong>#{{request_id}}</strong> and will review it personally.</p>
  {{request_details}}
  <p>We'll email you within 1-2 days with a price, or with any questions. Nothing is charged until you approve the price and pay.</p>
  <p>Have reference photos? <a href="{{whatsapp_link}}" style="color:#D291BC;">Send them on WhatsApp</a> with your request number.</p>
  <p style="margin-top:24px;">With love,<br/>{{site_name}}</p>
</div>$html$,
  true
),
(
  'custom_request_approved',
  'Custom request: approved (to customer)',
  $subj$Your custom request is approved! 🎀 (#{{request_id}})$subj$,
  $html$<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #5B4B4F;">
  <h1 style="color:#D291BC;">Good news — we can make it! 🎀</h1>
  <p>Hi {{customer_name}}, your custom request <strong>#{{request_id}}</strong> has been approved.</p>
  {{admin_message_block}}
  {{request_details}}
  <p style="font-size:18px;"><strong>Price: {{quoted_price}}</strong> <span style="color:#9B8589;">(+ shipping, calculated at payment)</span></p>
  <p style="text-align:center; margin:24px 0;"><a href="{{payment_link}}" style="display:inline-block; padding:12px 24px; background:#D291BC; color:#ffffff; border-radius:999px; text-decoration:none; font-weight:bold;">Pay &amp; confirm my order</a></p>
  <p>We start making your piece as soon as payment is confirmed. Questions? Just reply to this email or <a href="{{whatsapp_link}}" style="color:#D291BC;">message us on WhatsApp</a>.</p>
  <p style="margin-top:24px;">With love,<br/>{{site_name}}</p>
</div>$html$,
  true
),
(
  'custom_request_rejected',
  'Custom request: not possible (to customer)',
  $subj$About your custom request (#{{request_id}})$subj$,
  $html$<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #5B4B4F;">
  <h1 style="color:#D291BC;">Thank you for thinking of us 💕</h1>
  <p>Hi {{customer_name}}, thank you so much for your custom request <strong>#{{request_id}}</strong>. After looking at it carefully, we're sorry to say we aren't able to take it on this time.</p>
  {{admin_message_block}}
  <p>We'd still love to make something for you — have a look at our <a href="{{shop_link}}" style="color:#D291BC;">ready-made designs</a>, or reply to this email if you'd like to adjust your request.</p>
  <p style="margin-top:24px;">With love,<br/>{{site_name}}</p>
</div>$html$,
  true
),
(
  'admin_custom_request',
  'Admin: new custom request',
  $subj$🎀 New custom request from {{customer_name}} — {{category_name}}$subj$,
  $html$<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #5B4B4F;">
  <h1 style="color:#D291BC;">New custom request 🎀</h1>
  <p><strong>{{customer_name}}</strong> ({{customer_email}}, {{customer_phone}}, {{customer_country}}) requested a custom <strong>{{category_name}}</strong>.</p>
  {{request_details}}
  <p><a href="{{admin_request_link}}" style="color:#D291BC;">Review &amp; approve or reject in the admin dashboard &rarr;</a></p>
  <p style="margin-top:24px;">With love,<br/>{{site_name}}</p>
</div>$html$,
  true
)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- category_order — admin-configurable category display priority (which
-- category shows first on the Shop page and in the homepage highlight).
-- CATEGORIES' declared array order in lib/constants.ts (phone-cases first)
-- is the fallback if this table is missing/empty — see
-- lib/category-order-data.ts. Within a category, products.sort_order (the
-- existing drag-reorder feature) still controls which pieces show first.
-- ---------------------------------------------------------------------------
create table if not exists category_order (
  slug text primary key,
  rank integer not null
);

-- Admin on/off switch per category (Admin → Categories). Disabled categories
-- are hidden from the storefront along with all their products, and those
-- products can't be checked out. Products themselves are left untouched.
alter table category_order add column if not exists enabled boolean not null default true;
-- "Starting from" price shown on the custom request form for this category,
-- and pre-filled as the quote when approving a request. null = "price on
-- request". Edited in Admin → Categories.
alter table category_order add column if not exists custom_from_inr numeric(10, 2);

alter table category_order enable row level security;

insert into category_order (slug, rank) values
  ('phone-cases', 0),
  ('tablet-cases', 1),
  ('tablet-holders', 2),
  ('jewelry-boxes', 3),
  ('makeup-boxes', 4),
  ('combs', 5),
  ('mirrors', 6),
  ('keychains', 7),
  ('posters', 8),
  ('ready-to-ship', 9),
  ('small-plushies', 10),
  ('bag-charms', 11),
  ('water-bottles', 12),
  ('accessories', 13),
  ('combos', 14),
  ('mystery-box', 15),
  ('earbuds-cases', 16),
  ('hair-clips', 17),
  ('claw-clips', 18),
  ('stationery', 19),
  ('gift-hampers', 20),
  ('photo-frames', 21),
  ('laptop-kindle-sleeves', 22),
  ('bulk-gifting', 23)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- custom_requests — "request a custom piece" for any category. Flow:
-- customer submits (pending) → admin approves with a quoted total price, or
-- rejects with a polite message → on approval the customer pays via the
-- private /pay/<token> link, which creates a normal order (order_id) and the
-- request becomes paid. See lib/custom-requests.ts.
-- ---------------------------------------------------------------------------
create table if not exists custom_requests (
  id uuid primary key default gen_random_uuid(),
  -- Unguessable secret in the customer's payment link (/pay/<token>).
  token text unique not null,
  category text not null,
  quantity integer not null default 1 check (quantity between 1 and 500),
  device_model text,
  notes text not null,
  customer_name text not null,
  email text not null,
  phone text not null,
  country text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'paid')),
  -- Total for the whole request (all units), excluding shipping.
  quoted_price_inr numeric(10, 2),
  quoted_price_usd numeric(10, 2),
  -- Optional note from the maker, included in the approval/rejection email.
  admin_message text,
  decided_at timestamptz,
  -- The order created when the customer goes to pay (latest attempt).
  order_id uuid references orders(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists custom_requests_status_idx on custom_requests (status, created_at desc);
create index if not exists custom_requests_order_id_idx on custom_requests (order_id);

alter table custom_requests enable row level security;

-- ---------------------------------------------------------------------------
-- subscribers (homepage email signup)
-- ---------------------------------------------------------------------------
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

alter table subscribers enable row level security;

-- ============================================================================
-- Seed data — mirrors lib/data/products.ts. TODO: replace with your real
-- catalog (real names, prices, stock, and photo URLs) once you're ready.
-- ============================================================================
insert into products (id, slug, name, category, description, mrp_inr, price_inr, price_usd, images, stock_quantity, active)
values
  ('10000000-0000-0000-0000-000000000001', 'strawberry-milk-phone-case', 'Strawberry Milk Phone Case', 'phone-cases', 'A dreamy magenta-pink case piled high with Hello Kitty charms, swirls of piped cream, and a satin bow. Each charm is placed and sealed by hand, so the exact arrangement on yours will be one of a kind.', 1199, 600, 7.23, '{/products/real/pink-hello-kitty-case.jpg}', 12, true),
  ('10000000-0000-0000-0000-000000000002', 'sweetheart-charm-phone-case', 'Sweetheart Charm Phone Case', 'phone-cases', 'Moody purple and black cream stripes with a cluster of ghost-cute charms and tiny hearts tucked throughout. Soft on the edges, tough where it counts, and unapologetically extra.', 1199, 600, 7.23, '{/products/real/purple-ghost-case.jpg}', 9, true),
  ('10000000-0000-0000-0000-000000000003', 'cloud-nine-tablet-case', 'Cloud Nine Tablet Case', 'tablet-cases', 'A baby-blue padded case with a whole sky of pastel clouds, tiny stars, and a trim of sweet little charms. Roomy enough for daily use, cute enough for your whole feed.', 6998, 3499, 42.16, '{/products/tablet-cases.svg}', 7, true),
  ('10000000-0000-0000-0000-000000000004', 'bow-garden-tablet-stand', 'Bow Garden Tablet Stand', 'tablet-holders', 'An adjustable stand wrapped in a garden of pastel bows and piped cream swirls. Sturdy enough for movie nights, cute enough to leave out on your desk.', 6398, 3199, 38.54, '{/products/tablet-holders.svg}', 10, true),
  ('10000000-0000-0000-0000-000000000005', 'charm-garden-jewelry-box', 'Charm Garden Jewelry Box', 'jewelry-boxes', 'A lavender-and-white jewelry box piped edge-to-edge with butterflies, bows, hearts, and a sweet bear charm tucked in the corner. The kind of thing that makes getting ready feel special.', 899, 450, 5.42, '{/products/real/charm-garden-jewelry-box.jpg}', 6, true),
  ('10000000-0000-0000-0000-000000000006', 'cotton-candy-makeup-box', 'Cotton Candy Makeup Box', 'makeup-boxes', 'Two-tone pastel makeup storage with a dreamy cream-swirled lid and a cluster of charms at the clasp. Enough room for your everyday routine, cute enough to never hide away.', 7798, 3899, 46.98, '{/products/makeup-boxes.svg}', 8, true),
  ('10000000-0000-0000-0000-000000000007', 'sugar-bow-comb', 'Sugar Bow Comb', 'combs', 'A wide-tooth wooden comb with a lollipop centerpiece and a border of cream swirls in purple, pink, and yellow, dotted with bear, bunny, and Hello Kitty charms. Smooth on hair, soft on the eyes.', 699, 350, 4.22, '{/products/real/sugar-bow-comb.jpg}', 15, true),
  ('10000000-0000-0000-0000-000000000008', 'bubblegum-bow-mirror', 'Bubblegum Bow Mirror', 'mirrors', 'A round hand mirror in a pastel rainbow piped border, dotted with a bear, a bunny, a donut, Hello Kitty, and tiny candy charms. Cute enough for a desk, sturdy enough for daily touch-ups.', 399, 200, 2.41, '{/products/real/bubblegum-bow-mirror-1.jpg,/products/real/bubblegum-bow-mirror-2.jpg}', 11, true),
  ('10000000-0000-0000-0000-000000000009', 'sweetheart-keychain-duo', 'Sweetheart Keychain Duo', 'keychains', 'A clear resin charm piped with a ring of hearts and a pastel flower center, finished with a sturdy keyring clasp. Sweet enough for keys, cute enough for a bag.', 349, 175, 2.11, '{/products/real/sweetheart-keychain-duo.jpg}', 20, true),
  ('10000000-0000-0000-0000-000000000010', 'sunshine-bear-keychain', 'Sunshine Bear Keychain', 'keychains', 'A golden-yellow charm topped with a sleepy bear face, a sunflower, and a shimmering butterfly. Small, sturdy, and impossible to leave off your bag.', 349, 175, 2.11, '{/products/real/sunshine-bear-keychain.jpg}', 18, true),
  ('10000000-0000-0000-0000-000000000011', 'dreamy-sky-decoden-poster', 'Dreamy Sky Decoden Poster', 'posters', 'A soft pastel print inspired by our decoden pieces — clouds, tiny stars, and a sprinkle of sparkle. Ships flat, ready for your favorite frame.', 3798, 1899, 22.88, '{/products/posters.svg}', 25, true),
  ('10000000-0000-0000-0000-000000000012', 'lavender-dream-tablet-case', 'Lavender Dream Tablet Case', 'tablet-cases', 'A lavender-and-white tablet case loaded with My Melody and Hello Kitty charms, hearts, flowers, and a sweet bear, with "LOVE" and "HAPPY" spelled out in tiny letter beads. Protective corners, pillowy-soft feel, full decoden charm coverage.', 7398, 3699, 44.57, '{/products/real/lavender-dream-tablet-case.jpg}', 5, true),
  ('10000000-0000-0000-0000-000000000013', 'ready-to-ship-rainbow-hello-kitty-case', 'Ready-to-Ship Rainbow Hello Kitty Case', 'ready-to-ship', 'Already made and waiting to ship — pastel rainbow cream stripes loaded with Hello Kitty charms and a little "LOVE" charm at the base. One-of-one, ships in 1-2 days.', 1199, 600, 7.23, '{/products/real/rainbow-hello-kitty-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000014', 'ready-to-ship-cookies-cream-case', 'Ready-to-Ship Cookies & Cream Case', 'ready-to-ship', 'A warm caramel-toned case piled with cookie, biscuit, and pastry charms and a "SWEET" charm tucked in. Cut for an Android-style vertical triple-camera layout. One-of-one, ships in 1-2 days.', 1199, 600, 7.23, '{/products/real/cookies-cream-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000015', 'ready-to-ship-carousel-dreams-case', 'Ready-to-Ship Carousel Dreams Case', 'ready-to-ship', 'Soft pink, blue, yellow, and lilac cream bands with sweet dog-eared charms and a tiny ferris wheel charm at the center. One-of-one, ships in 1-2 days.', 1199, 600, 7.23, '{/products/real/carousel-dreams-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000016', 'ready-to-ship-midnight-rose-case', 'Ready-to-Ship Midnight Rose Case', 'ready-to-ship', 'A deep maroon case laced with a black bow and scattered red heart charms — moody, romantic, and a little dramatic. Cut for an iPhone 12-14 Pro style camera layout. One-of-one, ships in 1-2 days.', 1199, 600, 7.23, '{/products/real/midnight-rose-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000017', 'ready-to-ship-lilac-garden-case', 'Ready-to-Ship Lilac Garden Case', 'ready-to-ship', 'A translucent lilac case hand-set with dozens of tiny purple and white beads — bows, flowers, butterflies, and stars. One-of-one, ships in 1-2 days.', 1199, 600, 7.23, '{/products/real/lilac-garden-case-1.jpg,/products/real/lilac-garden-case-2.jpg,/products/real/lilac-garden-case-3.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000018', 'ready-to-ship-vanilla-carousel-case', 'Ready-to-Ship Vanilla Carousel Case', 'ready-to-ship', 'A creamy white case with a mirrored ferris-wheel charm, a bear, a bunny, and a "LOVE" charm tucked into swirls of piped cream. One-of-one, ships in 1-2 days.', 1199, 600, 7.23, '{/products/real/vanilla-carousel-case-1.jpg,/products/real/vanilla-carousel-case-2.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000019', 'ready-to-ship-cinnamoroll-sky-case', 'Ready-to-Ship Cinnamoroll Sky Case', 'ready-to-ship', 'Baby-blue and white cream waves dotted with Cinnamoroll charms, bows, and butterflies, finished with a tiny "cute" charm. Cut for an Android-style quad-camera (2x2) layout. One-of-one, ships in 1-2 days.', 1199, 600, 7.23, '{/products/real/cinnamoroll-sky-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000020', 'ready-to-ship-rainbow-noir-case', 'Ready-to-Ship Rainbow Noir Case', 'ready-to-ship', 'Black cream borders framing a bold pastel rainbow stripe, dotted with butterflies and a Kuromi-style charm — sweet with an edge. One-of-one, ships in 1-2 days.', 1199, 600, 7.23, '{/products/real/rainbow-noir-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000021', 'ready-to-ship-christmas-sparkle-case', 'Ready-to-Ship Christmas Sparkle Case', 'ready-to-ship', 'Purple cream borders around a pastel rainbow stripe loaded with Santa, snowman, gingerbread, and reindeer charms. One-of-one, ships in 1-2 days.', 1199, 600, 7.23, '{/products/real/christmas-sparkle-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000022', 'ready-to-ship-rose-garden-sanrio-case', 'Ready-to-Ship Rose Garden Sanrio Case', 'ready-to-ship', 'Pink, white, and lavender cream stripes with Hello Kitty, My Melody, and Cinnamoroll charms nestled among piped roses and bows. One-of-one, ships in 1-2 days.', 1199, 600, 7.23, '{/products/real/rose-garden-sanrio-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000023', 'ready-to-ship-merry-berry-case', 'Ready-to-Ship Merry Berry Case', 'ready-to-ship', 'A rich red and white striped case with Santa, snowman, gingerbread, and holly charms tucked into piped cream — a mirror-backed holiday favorite. One-of-one, ships in 1-2 days.', 1199, 600, 7.23, '{/products/real/merry-berry-case-1.jpg,/products/real/merry-berry-case-2.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000024', 'ready-to-ship-bear-charm-hairbrush', 'Ready-to-Ship Bear Charm Hairbrush', 'combs', 'A wide-tooth hairbrush with a purple charm garden handle — three sweet bear charms nestled in swirls of cream. One-of-one, ships in 1-2 days.', 699, 350, 4.22, '{/products/real/bear-charm-hairbrush.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000025', 'ready-to-ship-bow-heart-mirror', 'Ready-to-Ship Bow & Heart Mirror', 'mirrors', 'A rectangular vanity mirror framed in lilac and pink cream, dotted with hearts, bows, and butterflies. One-of-one, ships in 1-2 days.', 399, 200, 2.41, '{/products/real/bow-heart-mirror.jpg,/products/real/bow-heart-mirror-2.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000026', 'ready-to-ship-pearl-garden-mirror', 'Ready-to-Ship Pearl Garden Mirror', 'mirrors', 'A round hand mirror in blush pink, edged in black cream and studded with pearl shells, roses, bows, and butterflies. One-of-one, ships in 1-2 days.', 399, 200, 2.41, '{/products/real/pearl-garden-mirror-1.jpg,/products/real/pearl-garden-mirror-2.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000027', 'ready-to-ship-merry-mirror', 'Ready-to-Ship Merry Mirror', 'mirrors', 'A round hand mirror wreathed in holiday cream — Santa, snowman, gingerbread, and reindeer charms tucked among holly and "MERRY" lettering. One-of-one, ships in 1-2 days.', 399, 200, 2.41, '{/products/real/merry-mirror.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000028', 'ready-to-ship-merry-trinket-box', 'Ready-to-Ship Merry Trinket Box', 'jewelry-boxes', 'A holiday trinket box piped in red and green cream, loaded with Santa, snowman, gingerbread, reindeer, and gift-box charms and a "MERRY" charm on the lid. One-of-one, ships in 1-2 days.', 899, 450, 5.42, '{/products/real/merry-trinket-box-1.jpg,/products/real/merry-trinket-box-2.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000029', 'ready-to-ship-hello-kitty-bag-charm', 'Ready-to-Ship Hello Kitty Bag Charm', 'keychains', 'A Hello Kitty bag charm dressed in pink cream swirls, bows, and a little "LOVE" charm — the easiest way to decoden-ify your bag or keys. One-of-one, ships in 1-2 days.', 349, 175, 2.11, '{/products/real/hello-kitty-bag-charm.jpg}', 1, true)
-- `do nothing`, NOT `do update`: these rows are only a first-run seed. Once
-- the live catalog has been edited from the admin dashboard (prices, photos,
-- active on/off), re-running this file must never reset those edits.
on conflict (id) do nothing;
