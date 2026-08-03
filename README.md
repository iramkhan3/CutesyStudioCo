# CutesyStudioCo

Handmade decoden storefront — Next.js 14 (App Router) + TypeScript + Tailwind CSS,
with a real cart/checkout backed by Supabase (Postgres) and Razorpay. Cream-swirled
decoden and cute charms, made to bring a little joy to the world, one cute thing
at a time.

## Stack

- **Framework:** Next.js 14 App Router, TypeScript, Tailwind CSS
- **Database:** Supabase (Postgres) — products, orders, newsletter subscribers
- **Payments:** Razorpay Standard Checkout (Orders API + signature verification)
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
"not configured yet" message until you connect Supabase + Razorpay (below).

## 2. Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy your **Project URL**, **anon public
   key**, and **service_role key**.
3. In **SQL Editor**, paste and run the contents of
   [supabase/schema.sql](supabase/schema.sql) — this creates the `products`,
   `orders`, and `subscribers` tables, enables Row Level Security, and seeds
   the product catalog (same data as the local fallback).
4. Add the keys to your environment (see step 4 below). The app only ever
   uses the **service role key**, and only **server-side** (API routes /
   Server Components) — it's never sent to the browser.

## 3. Razorpay setup

1. Create a free account at [razorpay.com](https://razorpay.com).
2. In **Settings → API Keys**, generate a **Key ID** and **Key Secret**
   (test mode is fine for development).
3. Add both to your environment (below). The secret is used **only**
   server-side to create orders and verify payment signatures — never
   exposed to the client.
4. **Currency note:** this checkout charges in **INR** using each product's
   `price_inr` value (USD prices shown on the site are for buyer reference
   only). Razorpay's Standard Checkout supports international cards, but
   whether your specific account can accept them depends on your Razorpay
   KYC/account settings — check your dashboard, or reach out to Razorpay
   support if international cards are declined.
5. ⚠️ If you've ever pasted a Razorpay key into a chat tool, doc, or ticket,
   treat it as compromised and rotate it from the dashboard before going live.

## 4. Environment variables

Copy `.env.example` to `.env.local` and fill in the values from steps 2–3:

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
| `RESEND_API_KEY` | Sends order confirmation emails (optional) | **No — server only** |
| `RESEND_FROM_EMAIL` | "From" address for confirmation emails | No |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO/OG tags & sitemap | Yes |

`.env` / `.env.local` are already git-ignored — never commit real secrets.

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. In [vercel.com](https://vercel.com), **Add New Project** → import the repo.
   Vercel auto-detects Next.js — no config changes needed.
3. In **Project Settings → Environment Variables**, add every variable from
   the table above (use your **live** Razorpay keys for production, test
   keys for Preview deployments if you want).
4. Deploy. Then in **Project Settings → Domains**, add `cutesystudioco.com`
   and follow Vercel's instructions to repoint your DNS from Hostinger
   (usually an A record + CNAME, or delegating nameservers).
5. Update `NEXT_PUBLIC_SITE_URL` to `https://cutesystudioco.com` once the
   domain is live, and redeploy.

## Order flow (how the checkout works)

1. **Cart** (`/cart`) — Zustand store, persisted in `localStorage`.
2. **Checkout** (`/checkout`) — customer fills shipping details →
   `POST /api/create-order`.
3. **`/api/create-order`** re-prices the cart from the database (never
   trusts client-sent prices), creates a `pending` row in `orders`, creates
   a matching Razorpay order, and returns the Razorpay order ID + public key.
4. The browser opens the Razorpay checkout modal (loaded via
   `checkout.js`). On success, Razorpay returns a payment ID, order ID, and
   signature.
5. **`/api/verify-payment`** recomputes the HMAC-SHA256 signature
   server-side with the secret key and compares it (constant-time) against
   what the client sent. Only on a match does it mark the order `paid`,
   decrement stock, and (optionally) send a confirmation email.
6. Customer is redirected to `/order-confirmation?orderId=...`.

If Supabase or Razorpay aren't configured, `/api/create-order` returns a
friendly 503 instead of crashing, and the checkout page surfaces that error
with a note to contact us directly.

## Custom phone case builder (`/custom`)

Two ways to order a one-of-a-kind case, both added to the cart as a `custom`
line item (no product row required):

- **Build Your Own — ₹1500 flat.** Customer picks phone model (dropdown,
  [lib/constants.ts](lib/constants.ts) `PHONE_MODELS`, with a "type your own"
  fallback), theme, style, weight, colour, and an optional note.
- **Surprise Me — ₹2000 flat.** Customer just writes a detailed note
  describing their dream case.

Pricing is never trusted from the client — `/api/create-order` re-derives it
from `CUSTOM_CASE_PRICE_INR` / `SURPRISE_ME_PRICE_INR` based on `mode`, and
validates that all required customization fields are present before creating
the order. The full selection (or the surprise note) is stored per-order in
`orders.items` as JSON so you can see exactly what was requested.

## Ready-to-ship inventory (`Ready to Ship` category)

A normal product category (see [lib/constants.ts](lib/constants.ts)
`CATEGORIES`) for pieces already made and sitting in the studio — flat-priced
at ₹1000 regardless of design. Seeded with 3 placeholder items in
[lib/data/products.ts](lib/data/products.ts) / [supabase/schema.sql](supabase/schema.sql);
replace with your actual current stock.

## Coupons

A flat coupon system lives in [lib/coupons.ts](lib/coupons.ts) +
`COUPONS` in [lib/constants.ts](lib/constants.ts). Currently one code:
**`CUTE30`** — 30% off, minimum ₹500 purchase. The cart page lets customers
apply/remove a code and previews the discount; `/api/create-order`
recomputes the discount server-side from the authoritative subtotal before
creating the Razorpay order, so the client-side preview is never trusted for
the actual charge. Add more codes directly in the `COUPONS` object — move
this to a database table if you need expiry dates or per-customer codes later.

## TODO: replace with real content before launch

- [ ] **Real product photos** — every product image currently points to a
      placeholder SVG in `/public/products/*.svg`. Swap the `images` field
      in your Supabase `products` table (or [lib/data/products.ts](lib/data/products.ts)
      for local fallback data) with real photo URLs, and update `next.config.mjs`
      `images.remotePatterns` if hosting them off-Vercel (e.g. Supabase Storage).
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
- [ ] **Rotate Razorpay test keys** — the test key/secret used during
      development should be rotated before going live, and definitely if
      they were ever shared outside a secrets manager.
- [x] **Shipping cost logic** — flat ₹99 domestic shipping, free above ₹999
      subtotal. See `lib/shipping.ts` / `SHIPPING_FLAT_RATE_INR` and
      `FREE_SHIPPING_THRESHOLD_INR` in `lib/constants.ts` — adjust the
      numbers there, or replace with carrier-calculated rates or
      international shipping if you need it later.
- [ ] **Live USD↔INR reference rate** — `USD_TO_INR_REFERENCE_RATE` in
      `lib/constants.ts` is a static approximation used only for display;
      actual charges always use each product's stored `price_inr`.

## Project structure

```
app/                    Routes (App Router)
  api/                   create-order, verify-payment, newsletter route handlers
  shop/[slug]/           Product detail pages
  custom/                Custom phone case builder ("Build Your Own" / "Surprise Me")
  cart/, checkout/, order-confirmation/
components/             Shared UI (Navbar, Footer, ProductCard, CustomCaseBuilder, icons, etc.)
lib/
  data/products.ts       Local seed/fallback catalog
  supabase/admin.ts       Server-only Supabase client
  products.ts, orders.ts  Data access layer (Supabase w/ seed fallback)
  coupons.ts              Coupon/discount calculation (shared by cart preview + order API)
  razorpay.ts, email.ts   Payment + email clients
  store/cart.ts           Zustand cart store (product + custom line items, coupon code)
supabase/schema.sql      Full SQL schema + seed data for Supabase
public/products/*.svg    Placeholder product images (swap for real photos)
```
