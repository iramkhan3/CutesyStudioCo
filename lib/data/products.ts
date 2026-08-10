import type { CategorySlug } from "@/lib/constants";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  description: string;
  price_inr: number;
  // TODO: replace these placeholder SVG paths with real product photos
  // (recommend Supabase Storage or /public for a handful of hero shots).
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
    price_inr: 2799,
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
    price_inr: 2999,
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
      "A mirrored jewelry box with a soft velvet interior and a lid piled high with bows and tiny charm blooms. The kind of thing that makes getting ready feel special.",
    price_inr: 4799,
    images: ["/products/jewelry-boxes.svg"],
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
      "A gentle, wide-tooth comb with a handle transformed into a tiny charm garden — a bow, a swirl of cream, and a sprinkle of sparkle. Smooth on hair, soft on the eyes.",
    price_inr: 1499,
    images: ["/products/combs.svg"],
    stock_quantity: 15,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000008",
    slug: "bubblegum-bow-mirror",
    name: "Bubblegum Bow Mirror",
    category: "mirrors",
    description:
      "A compact double-sided mirror dressed in bubblegum-pink cream swirls and a statement bow. Pops open for a touch-up, looks adorable left out on a desk.",
    price_inr: 2399,
    images: ["/products/mirrors.svg"],
    stock_quantity: 11,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000009",
    slug: "sweetheart-keychain-duo",
    name: "Sweetheart Keychain Duo",
    category: "keychains",
    description:
      "A matching pair of heart-shaped charm clusters on a sturdy clasp — one for your keys, one for a friend. Cream swirls, a sprinkle of sparkle, and a tiny bow finish each one.",
    price_inr: 1349,
    images: ["/products/keychains.svg"],
    stock_quantity: 20,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000010",
    slug: "milky-star-keychain",
    name: "Milky Star Keychain",
    category: "keychains",
    description:
      "A star-shaped charm swirled with pastel milk-white cream tones and topped with a tiny pearl accent. Small, sturdy, and impossible to leave off your bag.",
    price_inr: 1249,
    images: ["/products/keychains.svg"],
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
      "A lilac padded case dusted in cream swirls with a trail of tiny charms along the spine. Protective corners, pillowy-soft feel, and full decoden charm coverage.",
    price_inr: 3699,
    images: ["/products/tablet-cases.svg"],
    stock_quantity: 5,
    active: true,
  },
  // Ready-to-ship: real, already-finished one-of-a-kind pieces sitting in the
  // studio right now — flat-priced regardless of design. Each is genuinely
  // unique, so stock_quantity is 1: once it sells, that exact piece is gone.
  {
    id: "10000000-0000-0000-0000-000000000013",
    slug: "ready-to-ship-rainbow-hello-kitty-case",
    name: "Ready-to-Ship Rainbow Hello Kitty Case",
    category: "ready-to-ship",
    description:
      "Already made and waiting to ship — pastel rainbow cream stripes loaded with Hello Kitty charms and a little \"LOVE\" charm at the base. One-of-one, ships in 1-2 days.",
    price_inr: 1000,
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
      "A warm caramel-toned case piled with cookie, biscuit, and pastry charms and a \"SWEET\" charm tucked in. One-of-one, ships in 1-2 days.",
    price_inr: 1000,
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
    price_inr: 1000,
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
      "A deep maroon case laced with a black bow and scattered red heart charms — moody, romantic, and a little dramatic. One-of-one, ships in 1-2 days.",
    price_inr: 1000,
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
    price_inr: 1000,
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
    price_inr: 1000,
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
      "Baby-blue and white cream waves dotted with Cinnamoroll charms, bows, and butterflies, finished with a tiny \"cute\" charm. One-of-one, ships in 1-2 days.",
    price_inr: 1000,
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
    price_inr: 1000,
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
    price_inr: 1000,
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
    price_inr: 1000,
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
    price_inr: 1000,
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
    price_inr: 1000,
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
    price_inr: 1000,
    images: ["/products/real/bow-heart-mirror.jpg"],
    stock_quantity: 1,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000026",
    slug: "ready-to-ship-hello-kitty-bag-charm",
    name: "Ready-to-Ship Hello Kitty Bag Charm",
    category: "keychains",
    description:
      "A Hello Kitty bag charm dressed in pink cream swirls, bows, and a little \"LOVE\" charm — the easiest way to decoden-ify your bag or keys. One-of-one, ships in 1-2 days.",
    price_inr: 1000,
    images: ["/products/real/hello-kitty-bag-charm.jpg"],
    stock_quantity: 1,
    active: true,
  },
];
