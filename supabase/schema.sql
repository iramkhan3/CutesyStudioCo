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
  price_usd numeric(10, 2) not null,
  price_inr numeric(10, 2) not null,
  images text[] not null default '{}',
  stock_quantity integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

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
  currency text not null default 'INR',
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed')),
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz not null default now()
);

alter table orders enable row level security;

create index if not exists orders_razorpay_order_id_idx on orders (razorpay_order_id);
create index if not exists orders_email_idx on orders (email);

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
insert into products (id, slug, name, category, description, price_usd, price_inr, images, stock_quantity, active)
values
  ('10000000-0000-0000-0000-000000000001', 'strawberry-milk-phone-case', 'Strawberry Milk Phone Case', 'phone-cases', 'A dreamy blush-pink case piled high with tiny strawberry charms, a swirl of piped cream, and a satin bow. Each charm is placed and sealed by hand, so the exact arrangement on yours will be one of a kind.', 34, 2799, '{/products/phone-cases.svg}', 12, true),
  ('10000000-0000-0000-0000-000000000002', 'sweetheart-charm-phone-case', 'Sweetheart Charm Phone Case', 'phone-cases', 'Lavender cream swirls trail across the shell with a cluster of tiny heart charms at the corner. Soft on the edges, tough where it counts, and unapologetically extra.', 36, 2999, '{/products/phone-cases.svg}', 9, true),
  ('10000000-0000-0000-0000-000000000003', 'cloud-nine-tablet-case', 'Cloud Nine Tablet Case', 'tablet-cases', 'A baby-blue padded case with a whole sky of pastel clouds, tiny stars, and a trim of sweet little charms. Roomy enough for daily use, cute enough for your whole feed.', 42, 3499, '{/products/tablet-cases.svg}', 7, true),
  ('10000000-0000-0000-0000-000000000004', 'bow-garden-tablet-stand', 'Bow Garden Tablet Stand', 'tablet-holders', 'An adjustable stand wrapped in a garden of pastel bows and piped cream swirls. Sturdy enough for movie nights, cute enough to leave out on your desk.', 38, 3199, '{/products/tablet-holders.svg}', 10, true),
  ('10000000-0000-0000-0000-000000000005', 'charm-garden-jewelry-box', 'Charm Garden Jewelry Box', 'jewelry-boxes', 'A mirrored jewelry box with a soft velvet interior and a lid piled high with bows and tiny charm blooms. The kind of thing that makes getting ready feel special.', 58, 4799, '{/products/jewelry-boxes.svg}', 6, true),
  ('10000000-0000-0000-0000-000000000006', 'cotton-candy-makeup-box', 'Cotton Candy Makeup Box', 'makeup-boxes', 'Two-tone pastel makeup storage with a dreamy cream-swirled lid and a cluster of charms at the clasp. Enough room for your everyday routine, cute enough to never hide away.', 46, 3899, '{/products/makeup-boxes.svg}', 8, true),
  ('10000000-0000-0000-0000-000000000007', 'sugar-bow-comb', 'Sugar Bow Comb', 'combs', 'A gentle, wide-tooth comb with a handle transformed into a tiny charm garden — a bow, a swirl of cream, and a sprinkle of sparkle. Smooth on hair, soft on the eyes.', 18, 1499, '{/products/combs.svg}', 15, true),
  ('10000000-0000-0000-0000-000000000008', 'bubblegum-bow-mirror', 'Bubblegum Bow Mirror', 'mirrors', 'A compact double-sided mirror dressed in bubblegum-pink cream swirls and a statement bow. Pops open for a touch-up, looks adorable left out on a desk.', 28, 2399, '{/products/mirrors.svg}', 11, true),
  ('10000000-0000-0000-0000-000000000009', 'sweetheart-keychain-duo', 'Sweetheart Keychain Duo', 'keychains', 'A matching pair of heart-shaped charm clusters on a sturdy clasp — one for your keys, one for a friend. Cream swirls, a sprinkle of sparkle, and a tiny bow finish each one.', 16, 1349, '{/products/keychains.svg}', 20, true),
  ('10000000-0000-0000-0000-000000000010', 'milky-star-keychain', 'Milky Star Keychain', 'keychains', 'A star-shaped charm swirled with pastel milk-white cream tones and topped with a tiny pearl accent. Small, sturdy, and impossible to leave off your bag.', 15, 1249, '{/products/keychains.svg}', 18, true),
  ('10000000-0000-0000-0000-000000000011', 'dreamy-sky-decoden-poster', 'Dreamy Sky Decoden Poster', 'posters', 'A soft pastel print inspired by our decoden pieces — clouds, tiny stars, and a sprinkle of sparkle. Ships flat, ready for your favorite frame.', 22, 1899, '{/products/posters.svg}', 25, true),
  ('10000000-0000-0000-0000-000000000012', 'lavender-dream-tablet-case', 'Lavender Dream Tablet Case', 'tablet-cases', 'A lilac padded case dusted in cream swirls with a trail of tiny charms along the spine. Protective corners, pillowy-soft feel, and full decoden charm coverage.', 44, 3699, '{/products/tablet-cases.svg}', 5, true),
  ('10000000-0000-0000-0000-000000000013', 'ready-to-ship-blush-charm-case', 'Ready-to-Ship Blush Charm Case', 'ready-to-ship', 'Already made and waiting to ship — a blush-pink case with a scatter of charms and bows. Ships in 1-2 days, no made-to-order wait.', 12, 1000, '{/products/phone-cases.svg}', 3, true),
  ('10000000-0000-0000-0000-000000000014', 'ready-to-ship-star-keychain', 'Ready-to-Ship Star Keychain', 'ready-to-ship', 'One-of-one, made and ready now — a star charm keychain in pastel tones. Ships in 1-2 days, no made-to-order wait.', 12, 1000, '{/products/keychains.svg}', 4, true),
  ('10000000-0000-0000-0000-000000000015', 'ready-to-ship-bow-mirror', 'Ready-to-Ship Bow Mirror', 'ready-to-ship', 'A compact mirror finished in bows and charms, already made and ready to go. Ships in 1-2 days, no made-to-order wait.', 12, 1000, '{/products/mirrors.svg}', 2, true)
on conflict (id) do nothing;
