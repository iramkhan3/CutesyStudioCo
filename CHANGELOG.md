# Changelog

## 2026-10-17 — Bug sweep: coupons, stale carts, custom request labels

No database changes.

### Added

- **Coupon codes on custom request payments** (`/pay/<token>`): the customer
  can type a code; it's re-validated server-side (minimum purchase, shipping
  override). Auto-apply offers such as LAUNCH50 never apply to a quote.
- **Cart refresh** (`POST /api/cart`, `useCartSync`): the cart and checkout
  pages update the saved browser cart on load — current prices, names,
  images and categories; quantities capped to stock; sold-out, hidden or
  deleted items removed — and tell the shopper what changed.

### Fixed

- **Launch banner flashing then disappearing**: the page showed built-in
  coupon defaults until the live list loaded. Coupons are now rendered with
  the page (`getDisplayCoupons`, refreshed instantly when a coupon is saved).
- **Switching every coupon off re-enabled LAUNCH50 (50% off)**: an empty
  coupon table fell back to the built-in defaults. It now falls back only
  when the table can't be read.
- **Custom request form asked for a phone model for any category**: it no
  longer preselects Phone Cases; the extra field only appears where a model
  or size matters.
- Cart/confirmation showed "undefined · Theme" for custom non-phone items;
  confirmation labelled paid custom requests "Surprise Me"; admin orders
  labelled a request's size "Phone model".
- Checkout could demand a phone model with no field to enter it (stale cart
  category) — fixed by the cart refresh.

## 2026-10-16 — Made to Order, payment hardening, review alerts, earlier cart recovery

### ⚠️ After deploying

Re-run [supabase/schema.sql](supabase/schema.sql) (safe, additive): adds
`custom_requests.estimated_days`, the `checkout_leads` table, and the
`admin_new_review` email template.

### Added

- **Made to Order**: categories with no products are never hidden or empty.
  Shop filters get a "✨ Made to Order (N)" tab listing them; opening any empty
  category shows the custom request form pre-selected for it; the main shop
  page ends with a "We also make these, just for you" strip.
- **Time required on custom quotes**: approving a request now also needs
  "days to make it"; shown in the approval email (`{{estimated_time_row}}` —
  added to the live template, which had never been edited), on the payment
  page, and in the admin.
- **Email alert for new reviews** (`admin_new_review`, editable in Admin →
  Emails) sent to the contact email when a customer submits a review.
- **Earlier abandoned-checkout capture**: once a valid email is typed at
  checkout, it's saved with the cart (`checkout_leads`, rebuilt server-side
  from the products table). The daily reminder job now also reaches people
  who never clicked Pay — still one reminder per person, skipped if they've
  bought; saved emails are deleted after 30 days. Checkout shows a one-line
  note about it.

### Fixed (security)

- `/api/verify-payment` checked the Razorpay signature but not that the
  Razorpay order belonged to the order being marked paid — a cheap paid
  order's signature could be replayed onto a pricier one. Now required.
- A request with a made-up signature no longer marks the order failed (it
  could cancel a real customer's in-progress checkout).
- `/api/paypal/capture-order` now only captures the PayPal order created for
  that order (previously any PayPal order id was accepted, and a failed
  capture would cancel the target order).

## 2026-10-16 — Admin portal: everything configurable

### ⚠️ After deploying

Re-run [supabase/schema.sql](supabase/schema.sql) (safe, additive): adds
`site_settings`, `reviews`, and `category_order.name/tagline/description`.
Until then the site keeps working on built-in defaults, but saving Settings,
Homepage, category text, and reviews fails with a "run schema.sql" message.

### Added

- **Admin → Settings**: contact email/WhatsApp/Instagram, announcement bar,
  custom-order note, all shipping rates and thresholds, per-country
  international rates (= checkout country list), $/₹ rate.
- **Admin → Homepage**: all homepage text, photo carousel manager, About
  paragraphs, Meet-the-Maker text and photo, launch-banner wording.
- **Admin → Categories**: create, rename, edit tagline/description, delete
  unused custom categories (built-ins can be renamed/disabled, not deleted).
- **Reviews**: public `/review` form (linked from the delivered email, homepage,
  footer) → Admin → Reviews to approve/hide/edit/delete or add your own with a
  photo → homepage shows approved reviews with average rating.
- **Admin → Subscribers**: list, search, remove, CSV export.
- **Dashboard** "Needs your attention" panel; regrouped admin menu + "View site".

### Changed

- Shipping, currency, contact details, timeline note, category names, and
  homepage content are read from settings everywhere (storefront, checkout,
  order APIs, emails) instead of constants. Defaults are unchanged.

## 2026-10-16 — Custom requests for every category

### ⚠️ After deploying

Re-run [supabase/schema.sql](supabase/schema.sql) (safe, additive). It adds
the `custom_requests` table, `category_order.custom_from_inr`, and four email
templates. Then set "Custom from ₹" prices in **Admin → Categories** (optional —
blank shows "price on request").

### Added

- **Request a custom piece** (`/custom-request`) for any enabled category:
  notes, quantity, model/size, contact + country. No payment upfront.
- **Admin → Requests**: approve with a quoted ₹/$ total (pre-filled from the
  category's starting price × quantity) and optional note, or decline politely.
- **Emails**: request received (customer), new request (admin), approved with
  payment link, polite decline — all editable in Admin → Emails.
- **Private payment page** `/pay/<token>`: address + shipping + Razorpay/PayPal,
  priced server-side from the quote; reuses the existing payment verification
  and marks the request paid.
- "Custom from ₹" per category in Admin → Categories.
- Links: navbar "Custom Request", footer, homepage custom section, shop page.
- The existing pay-now custom builder (5 types) is unchanged.

### Verified (2026-10-15, live)

- PayPal end-to-end up to payment approval on production: live order creation,
  FREE4UCUTIE = $1.00 international, stock reservation + second-buyer block,
  no-coupon US total $31.31 ($7.23 + $24.08 shipping). Razorpay tested manually
  by the owner.

## 2026-10-15

### ⚠️ After deploying

1. **Re-run [supabase/schema.sql](supabase/schema.sql)** in the Supabase SQL
   Editor. It's additive and safe to re-run (it never overwrites admin edits).
   It adds: `coupons.shipping_override_inr` / `shipping_override_usd`,
   `category_order.enabled`, `orders.stock_reserved` /
   `abandoned_reminder_sent_at`, the stock-reservation functions, and the
   `abandoned_cart` email template. Until it's run, the new features fall back
   gracefully, but saving coupons and switching categories fail.
2. Set up FREE4UCUTIE's shipping (or do it in Admin → Coupons):
   `update coupons set shipping_override_inr = 10, shipping_override_usd = 1 where code = 'FREE4UCUTIE';`
3. Vercel env vars: `CRON_SECRET` (required for abandoned-checkout emails).
   `INSTAGRAM_FEED_URL` stays unset — the Instagram feed is on hold.
4. Make sure Vercel has the **live** Razorpay keys (`.env.local` has test keys).

### Fixed — money & stock

- **Checkout could charge outdated prices.** If Supabase errored mid-checkout,
  product lookups fell back to the seed catalog (`lib/data/products.ts`), which
  shares IDs with 29 live products but has old prices (e.g. ₹3,699 vs ₹999)
  and old active flags. Checkout now returns 503 "please try again"; storefront
  pages throw so ISR keeps serving the last good page.
- **One-of-one pieces could be sold twice.** Stock was checked at checkout
  start but decremented only after payment. Stock is now reserved atomically
  when the order is created (`reserve_order_stock()`), released on failed
  payment or after 30 minutes of abandonment. Verified against Postgres:
  concurrent last-item buyers, idempotency, all-or-nothing multi-item orders,
  paid orders never released, functions not callable with the public anon key.
- **Coupon minimums were broken on PayPal.** The ₹ minimum was compared
  against the USD subtotal (₹500 minimum ⇒ needed a $500 order). Now compared
  against the USD subtotal's INR equivalent.
- **Re-running schema.sql would have wiped admin edits.** The product seed used
  `on conflict (id) do update`, resetting prices/photos/active flags of 29 live
  products. Now `do nothing`; all seeds follow that rule (see README →
  "Database changes & data safety").

### Added

- **Coupon shipping overrides** (Admin → Coupons): per coupon, a ₹ amount for
  orders shipping within India and a $ amount for international orders
  (blank = normal rates, 0 = free, else flat). 0%-off shipping-only coupons
  are allowed.
- **Free international shipping over $75** (`FREE_SHIPPING_THRESHOLD_USD_INTERNATIONAL`).
- **Category enable/disable** (Admin → Categories): hides the category and its
  products from the storefront and checkout without touching the products.
  Shop filter tabs now only show enabled categories that have products.
- **New categories:** Small Plushies, Bag Charms, Water Bottles, Accessories,
  Combos, Mystery Box, Earbuds Cases, Hair Clips, Claw Clips, Stationery, Gift
  Hampers, Photo Frames, Laptop & Kindle Sleeves, Bulk Gifting. "Posters"
  renamed to "Custom Posters & Postcards".
- **Review request** in the "Order delivered" email (`{{review_button}}`).
- **Abandoned-checkout reminder email**, sent daily at 10:00 IST by Vercel Cron
  (`vercel.json` → `/api/cron/abandoned-carts`, needs `CRON_SECRET`). One per
  customer; skips buyers who paid later and sold-out items.
- **WhatsApp chat** (+91 91678 29289): floating button on customer pages
  (pre-fills the product link on product pages), homepage contact card, and a
  link in the reminder email.
- **Back buttons** on product, shop, cart, and checkout pages (return to the
  previous in-site page, else a sensible fallback).
- **Homepage "View All Existing Designs"** made prominent: button under the
  section heading plus a full-width banner under the grid.
- **Launch-offer banners** now say the offer is for India (₹) orders — PayPal
  orders never got it.
- **Instagram feed (on hold):** `lib/instagram.ts` + homepage grid via a
  Behold.so feed; dormant until `INSTAGRAM_FEED_URL` is set.

### Content changes made directly in Supabase (already live)

- New product **Fairy Garden Kitty Clear Case** (ready-to-ship, ₹599 / MRP
  ₹1199 / $7.23, stock 1); photo uploaded to the `product-images` bucket.
- Video added to **Vanilla Carousel Case**'s gallery.
- `category_order` rows added for the new categories.
- "Order delivered" template: `{{review_button}}` inserted (it had never been
  edited, so no customization was lost).
