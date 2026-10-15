# CutesyStudioCo

Handmade decoden storefront — Next.js 14 (App Router) + TypeScript + Tailwind CSS,
with a real cart/checkout backed by Supabase (Postgres), Razorpay, and PayPal.
Cream-swirled decoden and cute charms, made to bring a little joy to the world,
one cute thing at a time.

## Stack

- **Framework:** Next.js 14 App Router, TypeScript, Tailwind CSS
- **Database:** Supabase (Postgres) — products, orders, newsletter subscribers
- **Payments:** Razorpay Standard Checkout (Orders API + signature verification,
  INR — Indian buyers) and PayPal Orders v2 (JS SDK + server-side capture,
  USD — international buyers). Customer picks one at checkout.
- **Cart state:** Zustand, persisted to `localStorage` until checkout completes
- **Email:** Resend (optional — order confirmation emails; safely no-ops if unset)
- **Deploy target:** Vercel (free tier)

## Prerequisites

- **Node.js >= 18.17.0** (Next.js 14 hard-requires this — it won't even start
  on Node 16). Check with `node -v`; install the latest LTS from
  [nodejs.org](https://nodejs.org) if needed. This does **not** affect Vercel
  deploys — Vercel's build image already uses a modern Node version
  regardless of what's installed on your machine.

## 1. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Out of the box, with no setup:** the site is fully browsable — Home, Shop,
product pages, and the cart all work using a local seed catalog
([lib/data/products.ts](lib/data/products.ts)) as a fallback when Supabase
isn't configured yet. Checkout and the newsletter signup will show a friendly
"not configured yet" message until you connect Supabase + Razorpay/PayPal
(below). If PayPal specifically isn't configured, its checkout option shows a
"coming soon" state rather than crashing — Razorpay works independently.

## 2. Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy your **Project URL**, **anon public
   key**, and **service_role key**.
3. In **SQL Editor**, paste and run the contents of
   [supabase/schema.sql](supabase/schema.sql) — this creates every table,
   enables Row Level Security, creates the stock-reservation functions, and
   seeds starter data. **Re-run the whole file after every deploy that changes
   it** — it's safe to re-run: it only adds missing columns/rows/functions and
   never overwrites anything edited from the admin dashboard (see
   [Database changes & data safety](#database-changes--data-safety)).
4. Add the keys to your environment (see step 4 below). The app only ever
   uses the **service role key**, and only **server-side** (API routes /
   Server Components) — it's never sent to the browser.

## 3. Razorpay setup (Indian buyers — Card / UPI / Netbanking)

1. Create a free account at [razorpay.com](https://razorpay.com).
2. In **Settings → API Keys**, generate a **Key ID** and **Key Secret**
   (test mode is fine for development).
3. Add both to your environment (below). The secret is used **only**
   server-side to create orders and verify payment signatures — never
   exposed to the client.
4. **Currency note:** this checkout charges in **INR** using each product's
   `price_inr` value. Razorpay's Standard Checkout supports international
   cards, but whether your specific account can accept them depends on your
   Razorpay KYC/account settings — check your dashboard, or reach out to
   Razorpay support if international cards are declined. For buyers who'd
   rather pay in USD, point them at the PayPal option instead (below).
5. ⚠️ If you've ever pasted a Razorpay key into a chat tool, doc, or ticket,
   treat it as compromised and rotate it from the dashboard before going live.

## 4. PayPal setup (international buyers — USD)

1. Create a free account at [developer.paypal.com](https://developer.paypal.com)
   (your regular PayPal account works — this just unlocks the developer
   dashboard).
2. Under **Apps & Credentials**, you'll see two tabs: **Sandbox** and
   **Live**. Start with **Sandbox** — click your default app (or create one)
   and copy the **Client ID** and **Secret**.
3. Add both to your environment as `NEXT_PUBLIC_PAYPAL_CLIENT_ID` /
   `PAYPAL_CLIENT_SECRET`, and leave `PAYPAL_ENVIRONMENT=sandbox` (the
   default — see step 4 below).
4. To test a full checkout without real money, use a **Sandbox test buyer
   account** (Developer Dashboard → **Sandbox → Accounts** — PayPal
   auto-creates a test personal account you can log into on the PayPal
   checkout popup).
5. **Going live:** switch to the **Live** tab in Apps & Credentials, copy
   those Client ID/Secret into the same env var names (in Vercel, for the
   Production environment), and set `PAYPAL_ENVIRONMENT=live`. Until you
   explicitly set that to `"live"`, the app always talks to PayPal's sandbox
   API — a typo or unset var fails safe into sandbox, never silently into
   live.
6. **Currency note:** PayPal orders charge in **USD** using each product's
   `price_usd` value (a fixed, editable field — not a live conversion from
   `price_inr`; see [lib/data/products.ts](lib/data/products.ts)).

## 5. Environment variables

Copy `.env.example` to `.env.local` and fill in the values from steps 2–4:

```bash
cp .env.example .env.local
```

| Variable | Where it's used | Public? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client init | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Reserved for future client-side reads | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | All DB reads/writes (server-only) | **No — server only** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Opens the Razorpay checkout modal | Yes |
| `RAZORPAY_KEY_SECRET` | Creates orders + verifies payment signatures | **No — server only** |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Loads the PayPal JS SDK / renders the button | Yes |
| `PAYPAL_CLIENT_SECRET` | Orders v2 API auth (create + capture) | **No — server only** |
| `PAYPAL_ENVIRONMENT` | `sandbox` (default) or `live` | Yes |
| `RESEND_API_KEY` | Sends order confirmation emails (optional) | **No — server only** |
| `RESEND_FROM_EMAIL` | "From" address for confirmation emails | No |
| `ADMIN_PASSWORD` | Password for `/admin` (order management) | **No — server only** |
| `ADMIN_SESSION_SECRET` | Signs the `/admin` session cookie | **No — server only** |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO/OG tags & sitemap | Yes |
| `CRON_SECRET` | Authorizes Vercel Cron to run the daily abandoned-checkout email job (`/api/cron/abandoned-carts`). Any long random string; Vercel sends it automatically. Without it the job refuses to run. | **No — server only** |
| `INSTAGRAM_FEED_URL` | *(On hold — leave unset.)* Behold.so JSON feed URL for the homepage Instagram grid. Unset = the static promo image shows. | No |

`.env` / `.env.local` are already git-ignored — never commit real secrets.

## 6. Deploy to Vercel

1. Push this repo to GitHub.
2. In [vercel.com](https://vercel.com), **Add New Project** → import the repo.
   Vercel auto-detects Next.js — no config changes needed.
3. In **Project Settings → Environment Variables**, add every variable from
   the table above (use your **live** Razorpay/PayPal keys for production,
   test/sandbox keys for Preview deployments if you want).
4. Deploy. Then in **Project Settings → Domains**, add `cutesystudioco.com`
   and follow Vercel's instructions to repoint your DNS from Hostinger
   (usually an A record + CNAME, or delegating nameservers).
5. Update `NEXT_PUBLIC_SITE_URL` to `https://cutesystudioco.com` once the
   domain is live, and redeploy.

## Order flow (how the checkout works)

1. **Cart** (`/cart`) — Zustand store, persisted in `localStorage`.
2. **Checkout** (`/checkout`) — customer fills shipping details, then picks a
   **Payment Method**: Card/UPI/Netbanking via Razorpay, or PayPal. Both
   paths share the same shipping-details form and validation; only the
   payment step differs.

**Razorpay path (INR):**

3. Submitting the form calls `POST /api/create-order`, which re-prices the
   cart from the database using `price_inr` (never trusts client-sent
   prices), creates a `pending` row in `orders` (`payment_provider:
   'razorpay'`), creates a matching Razorpay order, and returns the Razorpay
   order ID + public key.
4. The browser opens the Razorpay checkout modal (loaded via
   `checkout.js`). On success, Razorpay returns a payment ID, order ID, and
   signature.
5. **`/api/verify-payment`** recomputes the HMAC-SHA256 signature
   server-side with the secret key and compares it (constant-time) against
   what the client sent. Only on a match does it mark the order `paid`,
   decrement stock, and (optionally) send a confirmation email.

**PayPal path (USD):**

3. Clicking the PayPal button calls `POST /api/paypal/create-order`, which
   re-prices the cart from the database using `price_usd`, creates a
   `pending` row in `orders` (`payment_provider: 'paypal'`, `currency:
   'USD'`), creates a matching order via PayPal's Orders v2 API, and returns
   the PayPal order ID for the JS SDK button to use.
4. The buyer approves the payment in PayPal's popup/redirect flow (handled
   entirely by `@paypal/react-paypal-js`'s `PayPalButtons`).
5. On approval, **`/api/paypal/capture-order`** captures the payment
   server-side via PayPal's API, then re-verifies the captured amount and
   currency against the order total already computed in step 3 — same
   never-trust-the-client principle as the Razorpay signature check, just
   comparing an amount instead of a signature. Only on a match does it mark
   the order `paid`, decrement stock, and (optionally) send a confirmation
   email.

6. Either path redirects to `/order-confirmation?orderId=...`.

**Stock reservation (both paths) — prevents selling a one-of-one twice.**
Right after the `pending` order row is created, the create-order route
calls the `reserve_order_stock()` Postgres function, which decrements stock
for every product in the order **atomically, all-or-nothing** (`stock >=
quantity` is checked in the same `UPDATE`). If two people check out the
last piece at the same moment, only one reservation succeeds; the other gets
a 409 "someone just bought one of the pieces in your cart" **before paying**.

- Paid orders keep their reservation — that *is* the stock decrement, so
  verify-payment / the Razorpay webhook / PayPal capture skip the old
  post-payment decrement when `orders.stock_reserved` is true.
- A failed payment (`markOrderFailed`) returns the stock immediately.
- An abandoned checkout returns its stock after **30 minutes**
  (`release_stale_reservations()`, run before product reads). The order stays
  `pending`, so a very late payment is still recorded as paid and falls back
  to a plain decrement.
- The three functions are `security definer` with `execute` revoked from
  `anon`/`authenticated` — only the server's service-role key can call them.
- Until `schema.sql` has been re-run (functions missing), checkout keeps
  working the old way (decrement after payment).

**Never guesses prices.** If the database can't be reached during checkout,
the create-order routes return 503 "please try again" — they never fall back
to the local seed catalog (`lib/data/products.ts`), whose rows share IDs with
live products but have outdated prices/photos/active flags. Storefront pages
likewise throw on a DB error, so Vercel's ISR keeps serving the last good
cached page instead. The seed catalog is only used when Supabase isn't
configured at all (local dev).

If Supabase, Razorpay, or PayPal aren't configured, the relevant
`create-order` route returns a friendly 503 instead of crashing, and the
checkout page surfaces that error (or, for PayPal specifically, shows a
"coming soon" state instead of the button) with a note to contact us
directly.

## Custom builder (`/custom`) — the site's main focus

The homepage and nav lead with this: customers pick a **product type**
(Phone Case, Hairbrush, Hand Mirror, Table Mirror, or Keychain — see
`CUSTOM_PRODUCT_TYPES` in [lib/constants.ts](lib/constants.ts)), then one of
two modes, added to the cart as a `custom` line item (no product row
required):

- **Build Your Own.** Customer picks theme, style, weight, and colour (Phone
  Case also asks for a phone model — dropdown from `PHONE_MODELS`, with a
  "type your own" fallback), plus an optional note.
- **Surprise Me.** Customer just writes a detailed note (20-500 characters)
  describing their dream piece.

Every product type has its own MRP + price for each mode — edit them
directly in `CUSTOM_PRODUCT_TYPES`. Pricing is never trusted from the client —
`/api/create-order` looks up the price server-side from `productType` +
`mode`, and validates that all required customization fields are present
(including that `productType` is a real type) before creating the order. The
full selection (or the surprise note) is stored per-order in `orders.items`
as JSON so you can see exactly what was requested.

## Custom requests (`/custom-request`) — any category, quote before payment

Separate from the pay-now builder above (which stays as-is for its 5 types).
Customers can request a custom piece in **any enabled category** (except
"Existing Designs"), and nothing is charged until the maker approves a price:

1. **Request** — `/custom-request` (linked from the navbar, footer, homepage
   custom section, and the shop page, pre-selecting the active category).
   Category, quantity (1–500), model/size (required for phone cases), notes
   (20–2000 chars), name, email, phone/WhatsApp, country. A hidden honeypot
   field drops bot submissions; one email can have at most 5 requests awaiting
   review. Saved to `custom_requests` as `pending`.
   Emails: **custom_request_received** → customer, **admin_custom_request** → shop.
2. **Review** — **Admin → Requests** lists them (filter: needs review /
   approved / paid / rejected / all). On a request:
   - **Approve**: enter the **total** price for all pieces, excluding shipping,
     in ₹ and $ ($ is used if they pay with PayPal), plus an optional note.
     Pre-filled from the category's **"Custom from ₹"** price (Admin →
     Categories) × quantity, and a suggested $ at `USD_INR_RATE`. Sends
     **custom_request_approved** with the price and a private payment link
     (`/pay/<token>`). While unpaid you can change the quote and re-send.
   - **Decline**: sends **custom_request_rejected** — a warm, pre-written
     "we can't take this on" email; the note box comes pre-filled with a
     polite reason you can edit or clear.
3. **Pay** — `/pay/<token>` (unguessable token, `noindex`) shows the request
   and quote, collects the shipping address, adds shipping by the normal rules,
   and pays via Razorpay (₹) or PayPal ($). `/api/custom-requests/<token>/pay`
   builds the order **server-side from the quote** (one `custom` line item,
   `mode: "request"`), then the existing `/api/verify-payment`,
   Razorpay webhook, and `/api/paypal/capture-order` finish it and mark the
   request `paid` (`markCustomRequestPaidForOrder`). The paid order appears in
   Admin → Orders with the usual confirmation + new-order emails. Coupons don't
   apply to quotes.

**Made to Order:** any enabled category with no products shows up under a
"✨ Made to Order" shop filter tab, and opening it shows this request form
pre-selected — so no category is ever an empty dead end. When approving you
also enter **days to make it**, shown to the customer in the approval email and
on the payment page.

All four emails are editable in **Admin → Emails** (preview/test-send use a
sample request). Code: [lib/custom-requests.ts](lib/custom-requests.ts),
[components/CustomRequestForm.tsx](components/CustomRequestForm.tsx),
[components/PayForRequest.tsx](components/PayForRequest.tsx).

## Ready-to-ship inventory (secondary — `/shop`)

The everything-else section: pieces already made and sitting in the studio,
plus the standard (non-custom) catalog designs. Priced per physical product
type — see the pricing model below. Seeded in
[lib/data/products.ts](lib/data/products.ts) / [supabase/schema.sql](supabase/schema.sql);
keep both in sync as you add/remove stock.

## Pricing model — MRP vs. selling price

Every product has three independent, directly-editable price fields:

- **`mrp_inr`** — the strikethrough "full price" shown on product cards and
  detail pages.
- **`price_inr`** — the actual INR selling price (what Razorpay customers
  pay before any coupon), also shown on the card.
- **`price_usd`** — the fixed USD price PayPal customers pay. Seeded as a
  reference-rate conversion of `price_inr` (`USD_INR_RATE` in
  [lib/constants.ts](lib/constants.ts)) at the time each product was added,
  **not** computed live at checkout — edit it directly if you want USD
  pricing that doesn't track the INR price exactly.

They're set per-product with no shared formula — edit any of them directly in
[lib/data/products.ts](lib/data/products.ts) (and Supabase) for a clearance,
a price bump, whatever the reason. The sitewide `LAUNCH50` coupon (see
Coupons below) applies **on top of** `price_inr` / `price_usd` at checkout,
same as it always has — the MRP display doesn't change that math.

⚠️ **One-time migration needed:** the `mrp_inr` column, and — for the
PayPal integration — `price_usd` on `products` plus `payment_provider` /
`paypal_order_id` / `paypal_capture_id` on `orders`, were all added to
`supabase/schema.sql` after your Supabase project was already created.
Re-run the updated [supabase/schema.sql](supabase/schema.sql) in the
Supabase SQL Editor (it's idempotent — safe to re-run) to add the columns and
sync the new prices. Until you do, the site falls back gracefully (no MRP
shown, `price_inr` still correct, PayPal orders simply can't be created)
rather than breaking.

## Admin dashboard (`/admin`) — order management

A password-protected area for running the shop day to day, separate from the
Supabase dashboard:

- **`/admin/login`** — single shared password (`ADMIN_PASSWORD`). On success,
  a signed, `httpOnly` session cookie is set (`ADMIN_SESSION_SECRET` signs
  it, 7-day expiry). `middleware.ts` gates every other `/admin/*` page and
  every `/api/admin/*` route behind a valid cookie — if either env var is
  unset, login is disabled entirely (fails closed, never open).
- **`/admin`** — dashboard: orders placed today, orders still awaiting
  payment, paid orders not yet shipped, and 30-day revenue (INR and USD
  tracked separately — never summed together, since they're different
  currencies), plus the 8 most recent orders.
- **`/admin/orders`** — every order, searchable (name/email/order ID),
  filterable by payment status, payment provider, and fulfillment status,
  paginated 25 at a time.
- **`/admin/orders/[id]`** — full order detail: line items (including the
  full custom-builder selection for `custom` items — theme, style, phone
  model, note, etc.), pricing breakdown, payment provider/IDs, customer
  contact info, shipping address, and a form to set **fulfillment status**
  (unfulfilled / shipped / delivered / cancelled), **courier + tracking
  number**, and **internal notes** (never shown to the customer).

This is entirely separate from `payment_status` (which only Razorpay
signature verification / PayPal capture verification can change — the admin
dashboard never touches money state, only shipping state) — see `orders`
table changes in [supabase/schema.sql](supabase/schema.sql)
(`fulfillment_status`, `tracking_number`, `courier`, `admin_notes`).

⚠️ **Change the password.** `ADMIN_PASSWORD` was set to a randomly generated
value during setup — change it any time by editing the env var (locally and
in Vercel) and redeploying; no code change needed. `/admin` is also excluded
from search indexing (`app/robots.ts` + page-level `robots: noindex`), but
that's not a substitute for a strong password — it's a public URL, not a
secret one.

## Coupons

Managed in **Admin → Coupons** (`coupons` table; `COUPONS` in
[lib/constants.ts](lib/constants.ts) is only the fallback if the table is
missing). Each coupon has:

- **% off** (0–100) and a **minimum purchase in ₹**.
- **Active** — off = the code stops working entirely, including auto-apply.
- **Auto-apply** — applied to every order with no code needed. Auto-apply
  coupons are a domestic launch incentive: they're excluded from PayPal (USD)
  orders, and the homepage/navbar banner says "in India".
- **Shipping override, by destination** — one amount in **₹ for orders
  shipping within India**, one in **$ for international orders**. Blank =
  normal shipping rules, `0` = free shipping, any other amount = flat charge.
  If an order is charged in the other currency (e.g. an international buyer
  paying in ₹ via Razorpay), the amount is converted at `USD_INR_RATE`.
  A coupon may be **0% off** if it only changes shipping (e.g. a FREESHIP code).
  Example: `FREE4UCUTIE` = 100% off, ₹10 shipping in India, $1 shipping
  internationally.

Discount math lives in [lib/coupons.ts](lib/coupons.ts) and shipping in
[lib/shipping.ts](lib/shipping.ts); both are shared by the cart/checkout
preview and the create-order routes, which recompute everything server-side —
the client preview is never trusted for the actual charge. For PayPal orders
the ₹ minimum purchase is compared against the USD subtotal's INR equivalent.

## Shipping

[lib/shipping.ts](lib/shipping.ts) + constants in [lib/constants.ts](lib/constants.ts):

| Destination | Rule |
|---|---|
| India | ₹`SHIPPING_FLAT_RATE_INR` (99), free at or above ₹`FREE_SHIPPING_THRESHOLD_INR` (900) |
| International | zone flat rate (`INTERNATIONAL_SHIPPING_ZONES`), free at or above $`FREE_SHIPPING_THRESHOLD_USD_INTERNATIONAL` (75) |

Thresholds are checked against what the customer pays for items (after the
coupon discount). A coupon's shipping override (above) replaces these rules.

## Categories

Category names/descriptions live in `CATEGORIES` in
[lib/constants.ts](lib/constants.ts) (adding a new one is a code change).
**Admin → Categories** controls the rest, saved in the `category_order` table:

- **Enable/disable switch** — saves instantly. A disabled category, and every
  product in it, disappears from the homepage, shop, and product pages, and
  those products can't be checked out. The products themselves are not
  modified, so re-enabling restores everything.
- **Drag to reorder** — which category shows first on the shop page and in
  the homepage highlight.
- Shop filter tabs only show categories that are enabled **and** have at
  least one active product, so customers never land on an empty tab.

## Customer emails

All templates are editable in **Admin → Emails** (`email_templates` table;
defaults in [lib/email-templates.ts](lib/email-templates.ts)).

- **Order delivered** includes `{{review_button}}` — a "Tell us what you
  think" button that opens an email to you pre-filled with the order number,
  plus a nudge to tag the shop on Instagram.
- **Abandoned checkout reminder** (`abandoned_cart`) — sent once per customer
  by a daily Vercel Cron job (see [vercel.json](vercel.json); 04:30 UTC =
  10:00 IST) via `/api/cron/abandoned-carts` →
  [lib/abandoned-carts.ts](lib/abandoned-carts.ts). It targets checkouts where
  the customer clicked Pay (so an order row exists) but never paid, 1 hour to
  3 days old. Skipped if the customer has since paid for an order, was already
  reminded in that window, or every item has sold out/been hidden (sold-out
  items are dropped from the email). Each order is marked
  (`abandoned_reminder_sent_at`) before sending, so it can't double-send.
  Requires `CRON_SECRET`. Turn it off any time with the template's Active
  switch. Also covers shoppers who typed their email at checkout but never
  clicked Pay: checkout saves the email + cart in the background
  (`/api/checkout-leads` → `checkout_leads`, cart rebuilt from the products
  table so it can't be spoofed); saved emails are deleted after 30 days.
- **New review alert** (`admin_new_review`) — emailed to the contact email
  whenever a customer submits a review at `/review`.

## WhatsApp & Instagram

- **WhatsApp** — number in `SITE.whatsappNumber` ([lib/constants.ts](lib/constants.ts),
  digits only with country code). A floating "Chat with us" button shows on
  every customer page (hidden in `/admin`); on a product page it pre-fills a
  message with the product link. Also a card in the homepage contact section,
  and a link in the abandoned-checkout email.
- **Instagram feed — on hold.** [lib/instagram.ts](lib/instagram.ts) can show
  the latest 8 posts on the homepage via a free [Behold.so](https://behold.so)
  JSON feed, but it's dormant until `INSTAGRAM_FEED_URL` is set. To turn it
  on later: sign up at behold.so with the shop's Instagram, create a feed,
  copy its JSON feed URL into `INSTAGRAM_FEED_URL` on Vercel, and redeploy.

## Admin portal — what's configurable

Everything below is edited in `/admin` and goes live immediately (cached
config is invalidated on save via `revalidateConfig()` in
[lib/settings.ts](lib/settings.ts); the dashboard's "Refresh storefront cache"
also clears it).

| Page | What you can change |
|---|---|
| **Dashboard** | Order stats + "Needs your attention": orders to ship, custom requests to review, reviews to approve |
| **Orders** | Fulfillment status, courier, tracking, notes; shipped/delivered emails |
| **Requests** | Approve (quote ₹/$) or decline custom requests |
| **Reviews** | Approve/hide/edit/delete customer reviews (submitted at `/review`), or add ones you received elsewhere, with photo + stars. Only approved reviews show on the homepage, with the average rating. |
| **Products** | Products, prices, photos/videos, stock, active, order |
| **Categories** | Create / rename / describe / delete (custom ones with no products) / enable-disable / reorder / custom-request "from ₹" price |
| **Custom Pricing** | Pay-now custom builder prices |
| **Coupons** | % off, minimum, active, auto-apply, ₹/$ shipping override |
| **Homepage** | Hero, section headings & text, photo carousel (upload, describe, reorder), launch-banner text, About paragraphs, Meet-the-Maker text + photo |
| **Emails** | Every customer/admin email template |
| **Subscribers** | Newsletter list, search, remove, CSV export |
| **Settings** | Contact email (also where admin notifications go), WhatsApp, Instagram, announcement bar, custom-order note, India flat rate + free threshold, international free threshold ($), per-country international rates (also the checkout country list), default international rate, $/₹ rate |

How it's wired: `site_settings` holds two JSON documents (`store`,
`homepage`) merged over the defaults in
[lib/settings-defaults.ts](lib/settings-defaults.ts) (the values the site
shipped with), so nothing changes until you edit it and a malformed value can
never break a page. The root layout passes store settings to client components
through [components/StoreProvider.tsx](components/StoreProvider.tsx)
(`useStore()`); order routes always re-read them server-side. Categories are
`CATEGORIES` in [lib/constants.ts](lib/constants.ts) (built-in defaults) +
`category_order` rows (edits and admin-created categories), read via
`getCategories()`.

## Database changes & data safety

The live catalog, coupons, categories, and email templates are edited from
the admin dashboard, and **those edits must never be lost**. Rules for
[supabase/schema.sql](supabase/schema.sql):

- Seed `insert`s always use `on conflict ... do nothing` (never `do update`)
  — they only fill in rows that don't exist yet. (Before 2026-10-15 the
  product seed used `do update` and would have reset 29 live products'
  prices, photos, and active flags if re-run. Fixed.)
- Schema changes are additive only: `add column if not exists` with safe
  defaults, `create or replace function`. No `update`/`delete`/`truncate`/
  `drop table` on admin-managed tables.
- Admin save functions only write the fields their form edits.
- Every new feature degrades gracefully if `schema.sql` hasn't been re-run
  yet (e.g. checkout falls back to post-payment stock decrement; coupon
  shipping fields are ignored), but some admin saves (coupon edits, category
  switches) fail until it is — **re-run it after each deploy that changes it.**

## TODO: replace with real content before launch

- [x] **Real product photos** — most of the catalog now uses real photos in
      `/public/products/real/`. Four items still point at a placeholder SVG
      because no matching photo was available yet: `cloud-nine-tablet-case`,
      `bow-garden-tablet-stand`, `cotton-candy-makeup-box`, and
      `dreamy-sky-decoden-poster`. Swap those in
      [lib/data/products.ts](lib/data/products.ts) (and mirror in
      [supabase/schema.sql](supabase/schema.sql)) once you have photos for
      those categories.
- [ ] **Real logo / favicon** — `app/icon.tsx`, `app/apple-icon.tsx`, and
      `app/opengraph-image.tsx` currently generate placeholder graphics.
      Replace with real logo-based assets once your brand mark is final.
- [ ] **Real product catalog & prices** — the 12 seeded products are
      placeholder names/descriptions/prices. Edit them directly in Supabase
      (recommended) once it's connected.
- [ ] **Instagram feed embed** — the homepage Instagram section is a static
      placeholder grid linking out to your profile. To show real posts,
      wire up a service like [Behold.so](https://behold.so) or
      [SnapWidget](https://snapwidget.com) (needs their embed code/API key)
      — see `app/page.tsx`, "Instagram teaser" section.
- [ ] **Resend confirmation emails** — set `RESEND_API_KEY` +
      `RESEND_FROM_EMAIL` (with a verified sending domain) to activate order
      confirmation emails. Until then, they're silently skipped.
- [x] **Rotate Razorpay test keys** — production now uses a genuine
      `rzp_live_...` key pair generated from the Razorpay dashboard's Live
      Mode (verified against the live Orders API, not just pasted in). Note
      for future rotations: Razorpay's key *prefix* is the only reliable
      signal — `rzp_test_...` is always Test Mode regardless of KYC status or
      which dashboard screen it was copied from; only `rzp_live_...` is real.
- [x] **Switch `PAYPAL_ENVIRONMENT` to `"live"` and add live credentials** —
      done; `PAYPAL_ENVIRONMENT=live` with real Client ID/Secret is deployed.
      ⚠️ Checkout still can't complete a PayPal payment yet — PayPal
      currently rejects order creation with `PAYEE_ACCOUNT_RESTRICTED` (a
      restriction on the PayPal Business account itself, not a code/config
      issue). Resolve via PayPal's Resolution Center / merchant support
      before relying on the PayPal payment path; Razorpay is unaffected and
      fully live.
- [x] **Shipping cost logic** — flat ₹99 domestic (India) shipping, free
      above ₹900 of what the customer is actually paying (subtotal minus
      any coupon/launch discount — not the raw pre-discount subtotal, so a
      heavily-discounted small order doesn't get free shipping it wouldn't
      otherwise qualify for). International orders use a zone-based flat rate
      keyed on the country selected at checkout (`INTERNATIONAL_SHIPPING_ZONES`
      in `lib/constants.ts` — ₹799 neighboring countries, ₹1299 Asia-Pacific/
      Middle East, ₹1999 US/Europe/Oceania, ₹2499 default for anything else).
      This is a deterministic stand-in, not a live carrier rate — there's no
      shipping-API account connected. To get real-time international rates
      (based on exact weight/postal code), sign up with a shipping aggregator
      (Shiprocket is the common choice for India-based sellers; EasyPost/
      Shippo are alternatives) and replace the body of `calculateShipping()`
      in `lib/shipping.ts` with an API call. All the numbers live in
      `lib/constants.ts` — adjust freely.

## Project structure

```
app/                    Routes (App Router)
  api/                   create-order, verify-payment, newsletter route handlers
  api/paypal/            create-order, capture-order route handlers (PayPal)
  api/admin/             login, logout, orders (list/detail/update), stats — admin-only
  admin/                 Password-protected order management (see "Admin dashboard" below)
  shop/[slug]/           Product detail pages
  custom/                Custom builder ("Build Your Own" / "Surprise Me")
  cart/, checkout/, order-confirmation/
components/             Shared UI (Navbar, Footer, ProductCard, CustomCaseBuilder, icons, etc.)
  admin/                 AdminShell (nav/logout), OrderStatusBadges
lib/
  data/products.ts       Local seed/fallback catalog
  supabase/admin.ts       Server-only Supabase client
  products.ts, orders.ts  Data access layer (Supabase w/ seed fallback)
  coupons.ts              Coupon/discount calculation (shared by cart preview + order API)
  razorpay.ts, paypal.ts  Payment provider clients
  admin-auth.ts           Admin session tokens (HMAC-signed cookie, Edge + Node compatible)
  admin-format.ts         Client-safe money/date formatting for the admin UI
  email.ts                Confirmation email (Resend)
  store/cart.ts           Zustand cart store (product + custom line items, coupon code)
middleware.ts            Gates /admin/* and /api/admin/* behind a valid admin session
supabase/schema.sql      Full SQL schema + seed data for Supabase
public/products/*.svg    Placeholder product images (swap for real photos)
```
