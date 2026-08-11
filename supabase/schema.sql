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
insert into products (id, slug, name, category, description, price_inr, images, stock_quantity, active)
values
  ('10000000-0000-0000-0000-000000000001', 'strawberry-milk-phone-case', 'Strawberry Milk Phone Case', 'phone-cases', 'A dreamy magenta-pink case piled high with Hello Kitty charms, swirls of piped cream, and a satin bow. Each charm is placed and sealed by hand, so the exact arrangement on yours will be one of a kind.', 2799, '{/products/real/pink-hello-kitty-case.jpg}', 12, true),
  ('10000000-0000-0000-0000-000000000002', 'sweetheart-charm-phone-case', 'Sweetheart Charm Phone Case', 'phone-cases', 'Moody purple and black cream stripes with a cluster of ghost-cute charms and tiny hearts tucked throughout. Soft on the edges, tough where it counts, and unapologetically extra.', 2999, '{/products/real/purple-ghost-case.jpg}', 9, true),
  ('10000000-0000-0000-0000-000000000003', 'cloud-nine-tablet-case', 'Cloud Nine Tablet Case', 'tablet-cases', 'A baby-blue padded case with a whole sky of pastel clouds, tiny stars, and a trim of sweet little charms. Roomy enough for daily use, cute enough for your whole feed.', 3499, '{/products/tablet-cases.svg}', 7, true),
  ('10000000-0000-0000-0000-000000000004', 'bow-garden-tablet-stand', 'Bow Garden Tablet Stand', 'tablet-holders', 'An adjustable stand wrapped in a garden of pastel bows and piped cream swirls. Sturdy enough for movie nights, cute enough to leave out on your desk.', 3199, '{/products/tablet-holders.svg}', 10, true),
  ('10000000-0000-0000-0000-000000000005', 'charm-garden-jewelry-box', 'Charm Garden Jewelry Box', 'jewelry-boxes', 'A lavender-and-white jewelry box piped edge-to-edge with butterflies, bows, hearts, and a sweet bear charm tucked in the corner. The kind of thing that makes getting ready feel special.', 4799, '{/products/real/charm-garden-jewelry-box.jpg}', 6, true),
  ('10000000-0000-0000-0000-000000000006', 'cotton-candy-makeup-box', 'Cotton Candy Makeup Box', 'makeup-boxes', 'Two-tone pastel makeup storage with a dreamy cream-swirled lid and a cluster of charms at the clasp. Enough room for your everyday routine, cute enough to never hide away.', 3899, '{/products/makeup-boxes.svg}', 8, true),
  ('10000000-0000-0000-0000-000000000007', 'sugar-bow-comb', 'Sugar Bow Comb', 'combs', 'A wide-tooth wooden comb with a lollipop centerpiece and a border of cream swirls in purple, pink, and yellow, dotted with bear, bunny, and Hello Kitty charms. Smooth on hair, soft on the eyes.', 1499, '{/products/real/sugar-bow-comb.jpg}', 15, true),
  ('10000000-0000-0000-0000-000000000008', 'bubblegum-bow-mirror', 'Bubblegum Bow Mirror', 'mirrors', 'A round hand mirror in a pastel rainbow piped border, dotted with a bear, a bunny, a donut, Hello Kitty, and tiny candy charms. Cute enough for a desk, sturdy enough for daily touch-ups.', 2399, '{/products/real/bubblegum-bow-mirror-1.jpg,/products/real/bubblegum-bow-mirror-2.jpg}', 11, true),
  ('10000000-0000-0000-0000-000000000009', 'sweetheart-keychain-duo', 'Sweetheart Keychain Duo', 'keychains', 'A clear resin charm piped with a ring of hearts and a pastel flower center, finished with a sturdy keyring clasp. Sweet enough for keys, cute enough for a bag.', 1349, '{/products/real/sweetheart-keychain-duo.jpg}', 20, true),
  ('10000000-0000-0000-0000-000000000010', 'sunshine-bear-keychain', 'Sunshine Bear Keychain', 'keychains', 'A golden-yellow charm topped with a sleepy bear face, a sunflower, and a shimmering butterfly. Small, sturdy, and impossible to leave off your bag.', 1249, '{/products/real/sunshine-bear-keychain.jpg}', 18, true),
  ('10000000-0000-0000-0000-000000000011', 'dreamy-sky-decoden-poster', 'Dreamy Sky Decoden Poster', 'posters', 'A soft pastel print inspired by our decoden pieces — clouds, tiny stars, and a sprinkle of sparkle. Ships flat, ready for your favorite frame.', 1899, '{/products/posters.svg}', 25, true),
  ('10000000-0000-0000-0000-000000000012', 'lavender-dream-tablet-case', 'Lavender Dream Tablet Case', 'tablet-cases', 'A lavender-and-white tablet case loaded with My Melody and Hello Kitty charms, hearts, flowers, and a sweet bear, with "LOVE" and "HAPPY" spelled out in tiny letter beads. Protective corners, pillowy-soft feel, full decoden charm coverage.', 3699, '{/products/real/lavender-dream-tablet-case.jpg}', 5, true),
  ('10000000-0000-0000-0000-000000000013', 'ready-to-ship-rainbow-hello-kitty-case', 'Ready-to-Ship Rainbow Hello Kitty Case', 'ready-to-ship', 'Already made and waiting to ship — pastel rainbow cream stripes loaded with Hello Kitty charms and a little "LOVE" charm at the base. One-of-one, ships in 1-2 days.', 1000, '{/products/real/rainbow-hello-kitty-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000014', 'ready-to-ship-cookies-cream-case', 'Ready-to-Ship Cookies & Cream Case', 'ready-to-ship', 'A warm caramel-toned case piled with cookie, biscuit, and pastry charms and a "SWEET" charm tucked in. Cut for an Android-style vertical triple-camera layout. One-of-one, ships in 1-2 days.', 1000, '{/products/real/cookies-cream-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000015', 'ready-to-ship-carousel-dreams-case', 'Ready-to-Ship Carousel Dreams Case', 'ready-to-ship', 'Soft pink, blue, yellow, and lilac cream bands with sweet dog-eared charms and a tiny ferris wheel charm at the center. One-of-one, ships in 1-2 days.', 1000, '{/products/real/carousel-dreams-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000016', 'ready-to-ship-midnight-rose-case', 'Ready-to-Ship Midnight Rose Case', 'ready-to-ship', 'A deep maroon case laced with a black bow and scattered red heart charms — moody, romantic, and a little dramatic. Cut for an iPhone 12-14 Pro style camera layout. One-of-one, ships in 1-2 days.', 1000, '{/products/real/midnight-rose-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000017', 'ready-to-ship-lilac-garden-case', 'Ready-to-Ship Lilac Garden Case', 'ready-to-ship', 'A translucent lilac case hand-set with dozens of tiny purple and white beads — bows, flowers, butterflies, and stars. One-of-one, ships in 1-2 days.', 1000, '{/products/real/lilac-garden-case-1.jpg,/products/real/lilac-garden-case-2.jpg,/products/real/lilac-garden-case-3.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000018', 'ready-to-ship-vanilla-carousel-case', 'Ready-to-Ship Vanilla Carousel Case', 'ready-to-ship', 'A creamy white case with a mirrored ferris-wheel charm, a bear, a bunny, and a "LOVE" charm tucked into swirls of piped cream. One-of-one, ships in 1-2 days.', 1000, '{/products/real/vanilla-carousel-case-1.jpg,/products/real/vanilla-carousel-case-2.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000019', 'ready-to-ship-cinnamoroll-sky-case', 'Ready-to-Ship Cinnamoroll Sky Case', 'ready-to-ship', 'Baby-blue and white cream waves dotted with Cinnamoroll charms, bows, and butterflies, finished with a tiny "cute" charm. Cut for an Android-style quad-camera (2x2) layout. One-of-one, ships in 1-2 days.', 1000, '{/products/real/cinnamoroll-sky-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000020', 'ready-to-ship-rainbow-noir-case', 'Ready-to-Ship Rainbow Noir Case', 'ready-to-ship', 'Black cream borders framing a bold pastel rainbow stripe, dotted with butterflies and a Kuromi-style charm — sweet with an edge. One-of-one, ships in 1-2 days.', 1000, '{/products/real/rainbow-noir-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000021', 'ready-to-ship-christmas-sparkle-case', 'Ready-to-Ship Christmas Sparkle Case', 'ready-to-ship', 'Purple cream borders around a pastel rainbow stripe loaded with Santa, snowman, gingerbread, and reindeer charms. One-of-one, ships in 1-2 days.', 1000, '{/products/real/christmas-sparkle-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000022', 'ready-to-ship-rose-garden-sanrio-case', 'Ready-to-Ship Rose Garden Sanrio Case', 'ready-to-ship', 'Pink, white, and lavender cream stripes with Hello Kitty, My Melody, and Cinnamoroll charms nestled among piped roses and bows. One-of-one, ships in 1-2 days.', 1000, '{/products/real/rose-garden-sanrio-case.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000023', 'ready-to-ship-merry-berry-case', 'Ready-to-Ship Merry Berry Case', 'ready-to-ship', 'A rich red and white striped case with Santa, snowman, gingerbread, and holly charms tucked into piped cream — a mirror-backed holiday favorite. One-of-one, ships in 1-2 days.', 1000, '{/products/real/merry-berry-case-1.jpg,/products/real/merry-berry-case-2.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000024', 'ready-to-ship-bear-charm-hairbrush', 'Ready-to-Ship Bear Charm Hairbrush', 'combs', 'A wide-tooth hairbrush with a purple charm garden handle — three sweet bear charms nestled in swirls of cream. One-of-one, ships in 1-2 days.', 1000, '{/products/real/bear-charm-hairbrush.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000025', 'ready-to-ship-bow-heart-mirror', 'Ready-to-Ship Bow & Heart Mirror', 'mirrors', 'A rectangular vanity mirror framed in lilac and pink cream, dotted with hearts, bows, and butterflies. One-of-one, ships in 1-2 days.', 1000, '{/products/real/bow-heart-mirror.jpg,/products/real/bow-heart-mirror-2.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000026', 'ready-to-ship-pearl-garden-mirror', 'Ready-to-Ship Pearl Garden Mirror', 'mirrors', 'A round hand mirror in blush pink, edged in black cream and studded with pearl shells, roses, bows, and butterflies. One-of-one, ships in 1-2 days.', 1000, '{/products/real/pearl-garden-mirror-1.jpg,/products/real/pearl-garden-mirror-2.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000027', 'ready-to-ship-merry-mirror', 'Ready-to-Ship Merry Mirror', 'mirrors', 'A round hand mirror wreathed in holiday cream — Santa, snowman, gingerbread, and reindeer charms tucked among holly and "MERRY" lettering. One-of-one, ships in 1-2 days.', 1000, '{/products/real/merry-mirror.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000028', 'ready-to-ship-merry-trinket-box', 'Ready-to-Ship Merry Trinket Box', 'jewelry-boxes', 'A holiday trinket box piped in red and green cream, loaded with Santa, snowman, gingerbread, reindeer, and gift-box charms and a "MERRY" charm on the lid. One-of-one, ships in 1-2 days.', 1000, '{/products/real/merry-trinket-box-1.jpg,/products/real/merry-trinket-box-2.jpg}', 1, true),
  ('10000000-0000-0000-0000-000000000029', 'ready-to-ship-hello-kitty-bag-charm', 'Ready-to-Ship Hello Kitty Bag Charm', 'keychains', 'A Hello Kitty bag charm dressed in pink cream swirls, bows, and a little "LOVE" charm — the easiest way to decoden-ify your bag or keys. One-of-one, ships in 1-2 days.', 1000, '{/products/real/hello-kitty-bag-charm.jpg}', 1, true)
on conflict (id) do nothing;
