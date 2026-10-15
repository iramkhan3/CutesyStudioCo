# Changelog

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
