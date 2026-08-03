export const SITE = {
  name: "CutesyStudioCo",
  tagline: "Bringing joy to the world, one cute thing at a time",
  description:
    "Cream-topped decoden phone cases, jewelry boxes, mirrors, keychains and more — handmade charm by charm by a solo maker on a mission to spread a little joy.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://cutesystudioco.com",
  instagramHandle: "@cutesystudioco",
  instagramUrl: "https://www.instagram.com/cutesystudioco",
  email: "hello.cutesystudioco@gmail.com",
} as const;

export const CATEGORIES = [
  {
    slug: "phone-cases",
    name: "Phone Cases",
    tagline: "Pocket-sized charm overload",
    description:
      "Every case starts life as a plain shell before it's covered in piped cream, bows, and tiny charms. Built to protect your phone and steal the show at the same time.",
  },
  {
    slug: "tablet-cases",
    name: "Tablet Cases",
    tagline: "Cozy armor for your iPad bestie",
    description:
      "Padded, decoden-covered cases that keep your tablet safe from drops while looking like it wandered out of a candy shop.",
  },
  {
    slug: "tablet-holders",
    name: "Tablet Holders",
    tagline: "A charm-covered throne for movie nights",
    description:
      "Adjustable stands dressed in pastel cream swirls and charms — perfect for FaceTime calls, recipes, or your fifth rewatch of a comfort show.",
  },
  {
    slug: "jewelry-boxes",
    name: "Jewelry Boxes",
    tagline: "Tiny treasure chests, very extra",
    description:
      "Mirrored lids, velvet-soft interiors, and lids piled high with bows and tiny charms — a proper home for your favorite rings and earrings.",
  },
  {
    slug: "makeup-boxes",
    name: "Makeup Boxes",
    tagline: "Vanity-table main character energy",
    description:
      "Roomy storage for your makeup bag essentials, dressed up with cream swirls and charm clusters so your vanity looks as good as it works.",
  },
  {
    slug: "combs",
    name: "Combs",
    tagline: "Detangling, but make it decoden",
    description:
      "Smooth, gentle-tooth combs with handles transformed into tiny charm gardens — the cutest thing in your bag by far.",
  },
  {
    slug: "mirrors",
    name: "Mirrors",
    tagline: "Compact mirrors worth showing off",
    description:
      "Pop them open for a touch-up, or just leave them on your desk — either way, these mirrors are dripping in bows and sweet little charms.",
  },
  {
    slug: "keychains",
    name: "Keychains",
    tagline: "Bag charms with big personality",
    description:
      "Little clusters of charms, cream swirls, and bows on a sturdy clasp — the easiest way to decoden-ify your keys, bag, or backpack.",
  },
  {
    slug: "posters",
    name: "Posters",
    tagline: "Wall art straight from a dream room",
    description:
      "Soft, pastel, sparkle-dusted print designs for the wall behind your desk, bed, or vanity — because even your walls deserve decoden energy.",
  },
  {
    slug: "ready-to-ship",
    name: "Ready to Ship",
    tagline: "Already made, ready to fly to you",
    description:
      "Pieces already finished and sitting in the studio — no made-to-order wait, ships in 1-2 days. Every ready-to-ship piece is flat-priced at ₹1000.",
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

// Flat domestic (India) shipping rate, waived above the free-shipping
// threshold. Both are evaluated against the pre-discount cart subtotal.
export const SHIPPING_FLAT_RATE_INR = 99;
export const FREE_SHIPPING_THRESHOLD_INR = 999;

// Rough reference rate only — TODO: wire up a live FX rate API if you want
// USD reference prices to stay accurate over time. Actual charges always run
// on the price_inr value stored per-product, never a computed conversion.
export const USD_TO_INR_REFERENCE_RATE = 83;

export const READY_TO_SHIP_PRICE_INR = 1000;

// ============================================================================
// Custom phone case builder
// ============================================================================

export const CUSTOM_CASE_PRICE_INR = 1500;
export const SURPRISE_ME_PRICE_INR = 2000;

// TODO: this is a representative list of phones commonly sold in India, not
// an exhaustive live catalog — add/remove models here as needed. "Type your
// own" is always offered as a fallback so no customer is blocked from ordering.
export const PHONE_MODELS: string[] = [
  // Apple
  "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
  "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
  "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 Mini",
  "iPhone 12", "iPhone 12 Mini", "iPhone 11", "iPhone SE (2022)",
  // Samsung
  "Samsung Galaxy S24 Ultra", "Samsung Galaxy S24+", "Samsung Galaxy S24",
  "Samsung Galaxy S23 Ultra", "Samsung Galaxy S23+", "Samsung Galaxy S23", "Samsung Galaxy S23 FE",
  "Samsung Galaxy Z Fold 6", "Samsung Galaxy Z Flip 6", "Samsung Galaxy Z Fold 5", "Samsung Galaxy Z Flip 5",
  "Samsung Galaxy A55", "Samsung Galaxy A54", "Samsung Galaxy A34", "Samsung Galaxy A25", "Samsung Galaxy A15",
  "Samsung Galaxy M55", "Samsung Galaxy M35", "Samsung Galaxy M15",
  "Samsung Galaxy F55", "Samsung Galaxy F15",
  // OnePlus
  "OnePlus 12", "OnePlus 12R", "OnePlus 11", "OnePlus 11R",
  "OnePlus Nord 4", "OnePlus Nord CE 4", "OnePlus Nord 3", "OnePlus Nord CE 3 Lite",
  // Xiaomi / Redmi / POCO
  "Xiaomi 14", "Xiaomi 14 Civi", "Xiaomi 13 Pro",
  "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13", "Redmi Note 12 Pro+",
  "Redmi 13C", "Redmi 12",
  "POCO X6 Pro", "POCO X6", "POCO M6 Pro", "POCO F6", "POCO C65",
  // Vivo
  "Vivo V30 Pro", "Vivo V30", "Vivo V29", "Vivo Y200", "Vivo Y100", "Vivo Y28",
  "Vivo T3 Pro", "Vivo T3x",
  // Oppo
  "Oppo Reno 12 Pro", "Oppo Reno 11 Pro", "Oppo F25 Pro", "Oppo A79", "Oppo A59", "Oppo K12x",
  // Realme
  "Realme 12 Pro+", "Realme 12 Pro", "Realme 12x", "Realme Narzo 70 Pro", "Realme Narzo 70",
  "Realme C67", "Realme GT 6",
  // Google
  "Google Pixel 9 Pro", "Google Pixel 9", "Google Pixel 8 Pro", "Google Pixel 8",
  "Google Pixel 8a", "Google Pixel 7a",
  // Motorola
  "Moto Edge 50 Pro", "Moto Edge 50", "Moto G85", "Moto G64", "Moto G34", "Moto Razr 50 Ultra",
  // iQOO
  "iQOO 12", "iQOO Neo 9 Pro", "iQOO Z9", "iQOO Z9x",
  // Nothing
  "Nothing Phone (2)", "Nothing Phone (2a)", "Nothing Phone (1)",
  // Others
  "Asus ROG Phone 8", "Lava Blaze 2", "Micromax In Note 2",
  // Fallback
  "My phone isn't listed (type below)",
] as const;

export const CUSTOM_CASE_THEMES = [
  "Barbie",
  "Sanrio",
  "Cinnamoroll",
  "Hello Kitty",
  "Pompompurin",
  "Pochacco",
  "Flowers",
  "Pearls",
  "Type your own",
] as const;

export const CUSTOM_CASE_STYLES = [
  "Minimalistic",
  "Extra Stuffed",
  "Medium Charm-Piping Ratio",
] as const;

export const CUSTOM_CASE_WEIGHTS = [
  "Light & Comfortable — Cute",
  "Medium Heavy — High Cute",
  "Heavy — Worth the Extra Cuteness",
] as const;

export const CUSTOM_CASE_COLOURS = [
  "Multicolor Pastel",
  "Black",
  "White",
  "Multicolor Dark",
  "Type your own",
] as const;

// ============================================================================
// Coupons
// ============================================================================

export type Coupon = {
  code: string;
  percentOff: number;
  minPurchaseInr: number;
};

// TODO: move this to a database table if you ever need more than a couple of
// always-on codes (seasonal codes, per-customer codes, expiry dates, etc.).
export const COUPONS: Record<string, Coupon> = {
  CUTE30: { code: "CUTE30", percentOff: 30, minPurchaseInr: 500 },
};
