import type { CategorySlug } from "@/lib/constants";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  description: string;
  // MRP (strikethrough "full price") and price_inr (actual selling price)
  // are both set independently per product — edit either one directly
  // (per-product clearance, a price bump, whatever) rather than deriving
  // one from the other. Any sitewide coupon (see lib/constants.ts COUPONS /
  // LAUNCH_OFFER_ACTIVE) applies on top of price_inr at checkout, same as
  // it always has — MRP display here doesn't change that math at all.
  mrp_inr: number;
  price_inr: number;
  images: string[];
  stock_quantity: number;
  active: boolean;
};

/**
 * Local seed/fallback catalog. This is used two ways:
 *  1. As the source for the Supabase seed SQL (see supabase/schema.sql).
 *  2. As an automatic fallback when Supabase env vars aren't configured yet,
 *     so `npm run dev` shows a working catalog immediately with zero setup.
 * Keep this in sync with your real Supabase `products` table once you're
 * managing inventory there — this file stops being read for anything other
 * than local fallback once Supabase is connected.
 */
export const SEED_PRODUCTS: Product[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    slug: "strawberry-milk-phone-case",
    name: "Strawberry Milk Phone Case",
    category: "phone-cases",
    description:
      "A dreamy magenta-pink case piled high with Hello Kitty charms, swirls of piped cream, and a satin bow. Each charm is placed and sealed by hand, so the exact arrangement on yours will be one of a kind.",
    mrp_inr: 1199,
    price_inr: 600,
    images: ["/products/real/pink-hello-kitty-case.jpg"],
    stock_quantity: 12,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    slug: "sweetheart-charm-phone-case",
    name: "Sweetheart Charm Phone Case",
    category: "phone-cases",
    description:
      "Moody purple and black cream stripes with a cluster of ghost-cute charms and tiny hearts tucked throughout. Soft on the edges, tough where it counts, and unapologetically extra.",
    mrp_inr: 1199,
    price_inr: 600,
    images: ["/products/real/purple-ghost-case.jpg"],
    stock_quantity: 9,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    slug: "cloud-nine-tablet-case",
    name: "Cloud Nine Tablet Case",
    category: "tablet-cases",
    description:
      "A baby-blue padded case with a whole sky of pastel clouds, tiny stars, and a trim of sweet little charms. Roomy enough for daily use, cute enough for your whole feed.",
    mrp_inr: 6998,
    price_inr: 3499,
    images: ["/products/tablet-cases.svg"],
    stock_quantity: 7,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    slug: "bow-garden-tablet-stand",
    name: "Bow Garden Tablet Stand",
    category: "tablet-holders",
    description:
      "An adjustable stand wrapped in a garden of pastel bows and piped cream swirls. Sturdy enough for movie nights, cute enough to leave out on your desk.",
    mrp_inr: 6398,
    price_inr: 3199,
    images: ["/products/tablet-holders.svg"],
    stock_quantity: 10,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    slug: "charm-garden-jewelry-box",
    name: "Charm Garden Jewelry Box",
    category: "jewelry-boxes",
    description:
      "A lavender-and-white jewelry box piped edge-to-edge with butterflies, bows, hearts, and a sweet bear charm tucked in the corner. The kind of thing that makes getting ready feel special.",
    mrp_inr: 899,
    price_inr: 450,
    images: ["/products/real/charm-garden-jewelry-box.jpg"],
    stock_quantity: 6,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000006",
    slug: "cotton-candy-makeup-box",
    name: "Cotton Candy Makeup Box",
    category: "makeup-boxes",
    description:
      "Two-tone pastel makeup storage with a dreamy cream-swirled lid and a cluster of charms at the clasp. Enough room for your everyday routine, cute enough to never hide away.",
    mrp_inr: 7798,
    price_inr: 3899,
    images: ["/products/makeup-boxes.svg"],
    stock_quantity: 8,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000007",
    slug: "sugar-bow-comb",
    name: "Sugar Bow Comb",
    category: "combs",
    description:
      "A wide-tooth wooden comb with a lollipop centerpiece and a border of cream swirls in purple, pink, and yellow, dotted with bear, bunny, and Hello Kitty charms. Smooth on hair, soft on the eyes.",
    mrp_inr: 699,
    price_inr: 350,
    images: ["/products/real/sugar-bow-comb.jpg"],
    stock_quantity: 15,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000008",
    slug: "bubblegum-bow-mirror",
    name: "Bubblegum Bow Mirror",
    category: "mirrors",
    description:
      "A round hand mirror in a pastel rainbow piped border, dotted with a bear, a bunny, a donut, Hello Kitty, and tiny candy charms. Cute enough for a desk, sturdy enough for daily touch-ups.",
    mrp_inr: 399,
    price_inr: 200,
    images: [
      "/products/real/bubblegum-bow-mirror-1.jpg",
      "/products/real/bubblegum-bow-mirror-2.jpg",
    ],
    stock_quantity: 11,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000009",
    slug: "sweetheart-keychain-duo",
    name: "Sweetheart Keychain Duo",
    category: "keychains",
    description:
      "A clear resin charm piped with a ring of hearts and a pastel flower center, finished with a sturdy keyring clasp. Sweet enough for keys, cute enough for a bag.",
    mrp_inr: 349,
    price_inr: 175,
    images: ["/products/real/sweetheart-keychain-duo.jpg"],
    stock_quantity: 20,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000010",
    slug: "sunshine-bear-keychain",
    name: "Sunshine Bear Keychain",
    category: "keychains",
    description:
      "A golden-yellow charm topped with a sleepy bear face, a sunflower, and a shimmering butterfly. Small, sturdy, and impossible to leave off your bag.",
    mrp_inr: 349,
    price_inr: 175,
    images: ["/products/real/sunshine-bear-keychain.jpg"],
    stock_quantity: 18,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000011",
    slug: "dreamy-sky-decoden-poster",
    name: "Dreamy Sky Decoden Poster",
    category: "posters",
    description:
      "A soft pastel print inspired by our decoden pieces — clouds, tiny stars, and a sprinkle of sparkle. Ships flat, ready for your favorite frame.",
    mrp_inr: 3798,
    price_inr: 1899,
    images: ["/products/posters.svg"],
    stock_quantity: 25,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000012",
    slug: "lavender-dream-tablet-case",
    name: "Lavender Dream Tablet Case",
    category: "tablet-cases",
    description:
      "A lavender-and-white tablet case loaded with My Melody and Hello Kitty charms, hearts, flowers, and a sweet bear, with \"LOVE\" and \"HAPPY\" spelled out in tiny letter beads. Protective corners, pillowy-soft feel, full decoden charm coverage.",
    mrp_inr: 7398,
    price_inr: 3699,
    images: ["/products/real/lavender-dream-tablet-case.jpg"],
    stock_quantity: 5,
    active: true,
  },
  // Ready-to-ship: real, already-finished one-of-a-kind pieces sitting in the
  // studio right now. Priced by physical product type (same MRP/price as the
  // matching catalog category above) rather than one flat rate. Each is
  // genuinely unique, so stock_quantity is 1: once it sells, that exact piece
  // is gone.
  {
    id: "10000000-0000-0000-0000-000000000013",
    slug: "ready-to-ship-rainbow-hello-kitty-case",
    name: "Ready-to-Ship Rainbow Hello Kitty Case",
    category: "ready-to-ship",
    description:
      "Already made and waiting to ship — pastel rainbow cream stripes loaded with Hello Kitty charms and a little \"LOVE\" charm at the base. One-of-one, ships in 1-2 days.",
    mrp_inr: 1199,
    price_inr: 600,
    images: ["/products/real/rainbow-hello-kitty-case.jpg"],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000014",
    slug: "ready-to-ship-cookies-cream-case",
    name: "Ready-to-Ship Cookies & Cream Case",
    category: "ready-to-ship",
    description:
      "A warm caramel-toned case piled with cookie, biscuit, and pastry charms and a \"SWEET\" charm tucked in. Cut for an Android-style vertical triple-camera layout. One-of-one, ships in 1-2 days.",
    mrp_inr: 1199,
    price_inr: 600,
    images: ["/products/real/cookies-cream-case.jpg"],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000015",
    slug: "ready-to-ship-carousel-dreams-case",
    name: "Ready-to-Ship Carousel Dreams Case",
    category: "ready-to-ship",
    description:
      "Soft pink, blue, yellow, and lilac cream bands with sweet dog-eared charms and a tiny ferris wheel charm at the center. One-of-one, ships in 1-2 days.",
    mrp_inr: 1199,
    price_inr: 600,
    images: ["/products/real/carousel-dreams-case.jpg"],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000016",
    slug: "ready-to-ship-midnight-rose-case",
    name: "Ready-to-Ship Midnight Rose Case",
    category: "ready-to-ship",
    description:
      "A deep maroon case laced with a black bow and scattered red heart charms — moody, romantic, and a little dramatic. Cut for an iPhone 12-14 Pro style camera layout. One-of-one, ships in 1-2 days.",
    mrp_inr: 1199,
    price_inr: 600,
    images: ["/products/real/midnight-rose-case.jpg"],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000017",
    slug: "ready-to-ship-lilac-garden-case",
    name: "Ready-to-Ship Lilac Garden Case",
    category: "ready-to-ship",
    description:
      "A translucent lilac case hand-set with dozens of tiny purple and white beads — bows, flowers, butterflies, and stars. One-of-one, ships in 1-2 days.",
    mrp_inr: 1199,
    price_inr: 600,
    images: [
      "/products/real/lilac-garden-case-1.jpg",
      "/products/real/lilac-garden-case-2.jpg",
      "/products/real/lilac-garden-case-3.jpg",
    ],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000018",
    slug: "ready-to-ship-vanilla-carousel-case",
    name: "Ready-to-Ship Vanilla Carousel Case",
    category: "ready-to-ship",
    description:
      "A creamy white case with a mirrored ferris-wheel charm, a bear, a bunny, and a \"LOVE\" charm tucked into swirls of piped cream. One-of-one, ships in 1-2 days.",
    mrp_inr: 1199,
    price_inr: 600,
    images: [
      "/products/real/vanilla-carousel-case-1.jpg",
      "/products/real/vanilla-carousel-case-2.jpg",
    ],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000019",
    slug: "ready-to-ship-cinnamoroll-sky-case",
    name: "Ready-to-Ship Cinnamoroll Sky Case",
    category: "ready-to-ship",
    description:
      "Baby-blue and white cream waves dotted with Cinnamoroll charms, bows, and butterflies, finished with a tiny \"cute\" charm. Cut for an Android-style quad-camera (2x2) layout. One-of-one, ships in 1-2 days.",
    mrp_inr: 1199,
    price_inr: 600,
    images: ["/products/real/cinnamoroll-sky-case.jpg"],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000020",
    slug: "ready-to-ship-rainbow-noir-case",
    name: "Ready-to-Ship Rainbow Noir Case",
    category: "ready-to-ship",
    description:
      "Black cream borders framing a bold pastel rainbow stripe, dotted with butterflies and a Kuromi-style charm — sweet with an edge. One-of-one, ships in 1-2 days.",
    mrp_inr: 1199,
    price_inr: 600,
    images: ["/products/real/rainbow-noir-case.jpg"],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000021",
    slug: "ready-to-ship-christmas-sparkle-case",
    name: "Ready-to-Ship Christmas Sparkle Case",
    category: "ready-to-ship",
    description:
      "Purple cream borders around a pastel rainbow stripe loaded with Santa, snowman, gingerbread, and reindeer charms. One-of-one, ships in 1-2 days.",
    mrp_inr: 1199,
    price_inr: 600,
    images: ["/products/real/christmas-sparkle-case.jpg"],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000022",
    slug: "ready-to-ship-rose-garden-sanrio-case",
    name: "Ready-to-Ship Rose Garden Sanrio Case",
    category: "ready-to-ship",
    description:
      "Pink, white, and lavender cream stripes with Hello Kitty, My Melody, and Cinnamoroll charms nestled among piped roses and bows. One-of-one, ships in 1-2 days.",
    mrp_inr: 1199,
    price_inr: 600,
    images: ["/products/real/rose-garden-sanrio-case.jpg"],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000023",
    slug: "ready-to-ship-merry-berry-case",
    name: "Ready-to-Ship Merry Berry Case",
    category: "ready-to-ship",
    description:
      "A rich red and white striped case with Santa, snowman, gingerbread, and holly charms tucked into piped cream — a mirror-backed holiday favorite. One-of-one, ships in 1-2 days.",
    mrp_inr: 1199,
    price_inr: 600,
    images: [
      "/products/real/merry-berry-case-1.jpg",
      "/products/real/merry-berry-case-2.jpg",
    ],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000024",
    slug: "ready-to-ship-bear-charm-hairbrush",
    name: "Ready-to-Ship Bear Charm Hairbrush",
    category: "combs",
    description:
      "A wide-tooth hairbrush with a purple charm garden handle — three sweet bear charms nestled in swirls of cream. One-of-one, ships in 1-2 days.",
    mrp_inr: 699,
    price_inr: 350,
    images: ["/products/real/bear-charm-hairbrush.jpg"],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000025",
    slug: "ready-to-ship-bow-heart-mirror",
    name: "Ready-to-Ship Bow & Heart Mirror",
    category: "mirrors",
    description:
      "A rectangular vanity mirror framed in lilac and pink cream, dotted with hearts, bows, and butterflies. One-of-one, ships in 1-2 days.",
    mrp_inr: 399,
    price_inr: 200,
    images: [
      "/products/real/bow-heart-mirror.jpg",
      "/products/real/bow-heart-mirror-2.jpg",
    ],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000026",
    slug: "ready-to-ship-pearl-garden-mirror",
    name: "Ready-to-Ship Pearl Garden Mirror",
    category: "mirrors",
    description:
      "A round hand mirror in blush pink, edged in black cream and studded with pearl shells, roses, bows, and butterflies. One-of-one, ships in 1-2 days.",
    mrp_inr: 399,
    price_inr: 200,
    images: [
      "/products/real/pearl-garden-mirror-1.jpg",
      "/products/real/pearl-garden-mirror-2.jpg",
    ],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000027",
    slug: "ready-to-ship-merry-mirror",
    name: "Ready-to-Ship Merry Mirror",
    category: "mirrors",
    description:
      "A round hand mirror wreathed in holiday cream — Santa, snowman, gingerbread, and reindeer charms tucked among holly and \"MERRY\" lettering. One-of-one, ships in 1-2 days.",
    mrp_inr: 399,
    price_inr: 200,
    images: ["/products/real/merry-mirror.jpg"],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000028",
    slug: "ready-to-ship-merry-trinket-box",
    name: "Ready-to-Ship Merry Trinket Box",
    category: "jewelry-boxes",
    description:
      "A holiday trinket box piped in red and green cream, loaded with Santa, snowman, gingerbread, reindeer, and gift-box charms and a \"MERRY\" charm on the lid. One-of-one, ships in 1-2 days.",
    mrp_inr: 899,
    price_inr: 450,
    images: [
      "/products/real/merry-trinket-box-1.jpg",
      "/products/real/merry-trinket-box-2.jpg",
    ],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000029",
    slug: "ready-to-ship-hello-kitty-bag-charm",
    name: "Ready-to-Ship Hello Kitty Bag Charm",
    category: "keychains",
    description:
      "A Hello Kitty bag charm dressed in pink cream swirls, bows, and a little \"LOVE\" charm — the easiest way to decoden-ify your bag or keys. One-of-one, ships in 1-2 days.",
    mrp_inr: 349,
    price_inr: 175,
    images: ["/products/real/hello-kitty-bag-charm.jpg"],
    stock_quantity: 1,
    active: true,
  },
];
