import type { CategorySlug } from "@/lib/constants";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  description: string;
  price_usd: number;
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
      "A dreamy blush-pink case piled high with tiny strawberry charms, a swirl of piped cream, and a satin bow. Each charm is placed and sealed by hand, so the exact arrangement on yours will be one of a kind.",
    price_usd: 34,
    price_inr: 2799,
    images: ["/products/phone-cases.svg"],
    stock_quantity: 12,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    slug: "sweetheart-charm-phone-case",
    name: "Sweetheart Charm Phone Case",
    category: "phone-cases",
    description:
      "Lavender cream swirls trail across the shell with a cluster of tiny heart charms at the corner. Soft on the edges, tough where it counts, and unapologetically extra.",
    price_usd: 36,
    price_inr: 2999,
    images: ["/products/phone-cases.svg"],
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
    price_usd: 42,
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
    price_usd: 38,
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
    price_usd: 58,
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
    price_usd: 46,
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
    price_usd: 18,
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
    price_usd: 28,
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
    price_usd: 16,
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
    price_usd: 15,
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
    price_usd: 22,
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
    price_usd: 44,
    price_inr: 3699,
    images: ["/products/tablet-cases.svg"],
    stock_quantity: 5,
    active: true,
  },
  // Ready-to-ship: pieces already made and sitting in the studio, flat-priced
  // regardless of design. TODO: replace with your actual current in-stock pieces.
  {
    id: "10000000-0000-0000-0000-000000000013",
    slug: "ready-to-ship-blush-charm-case",
    name: "Ready-to-Ship Blush Charm Case",
    category: "ready-to-ship",
    description:
      "Already made and waiting to ship — a blush-pink case with a scatter of charms and bows. Ships in 1-2 days, no made-to-order wait.",
    price_usd: 12,
    price_inr: 1000,
    images: ["/products/phone-cases.svg"],
    stock_quantity: 3,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000014",
    slug: "ready-to-ship-star-keychain",
    name: "Ready-to-Ship Star Keychain",
    category: "ready-to-ship",
    description:
      "One-of-one, made and ready now — a star charm keychain in pastel tones. Ships in 1-2 days, no made-to-order wait.",
    price_usd: 12,
    price_inr: 1000,
    images: ["/products/keychains.svg"],
    stock_quantity: 4,
    active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000015",
    slug: "ready-to-ship-bow-mirror",
    name: "Ready-to-Ship Bow Mirror",
    category: "ready-to-ship",
    description:
      "A compact mirror finished in bows and charms, already made and ready to go. Ships in 1-2 days, no made-to-order wait.",
    price_usd: 12,
    price_inr: 1000,
    images: ["/products/mirrors.svg"],
    stock_quantity: 2,
    active: true,
  },
];
