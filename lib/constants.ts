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

// Shown wherever a customer is about to order (or has ordered) a made-to-order
// custom piece — the /custom page, the builder itself, cart, and checkout.
export const CUSTOM_ORDER_TIMELINE_NOTE =
  "Customized handmade items take longer to make, as each order is unique. Please expect 7-10 days to ship your order. Delivery time after that depends on the external courier service provider — we'll share all tracking details with you.";

// Approximate, static reference rate for showing a USD equivalent to
// international customers at checkout — NOT a live FX rate, and never used
// for the actual charge (Razorpay always charges in INR, per SITE currency
// policy). Update occasionally; a few % of drift is fine for a reference.
export const USD_INR_RATE = 83;

export const CATEGORIES = [
  {
    slug: "phone-cases",
    name: "Phone Cases",
    tagline: "Pocket-sized charm overload",
    description:
      "Every case starts life as a plain shell before it's covered in piped decoden cream and tiny cute charms. Built to protect your phone and steal the show at the same time.",
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
      "Mirrored lids, velvet-soft interiors, and lids piled high with cute charms and swirls of decoden cream — a proper home for your favorite rings and earrings.",
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
      "Pop them open for a touch-up, or just leave them on your desk — either way, these mirrors are dripping in decoden cream and sweet little charms.",
  },
  {
    slug: "keychains",
    name: "Keychains",
    tagline: "Bag charms with big personality",
    description:
      "Little clusters of cute charms and cream swirls on a sturdy clasp — the easiest way to decoden-ify your keys, bag, or backpack.",
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
      "Pieces already finished and sitting in the studio — no made-to-order wait, ships in 1-2 days.",
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

// Flat domestic (India) shipping rate, waived above the free-shipping
// threshold. Both are evaluated against the pre-discount cart subtotal.
export const SHIPPING_FLAT_RATE_INR = 99;
export const FREE_SHIPPING_THRESHOLD_INR = 900;

// International shipping — zone-based flat rates, since we don't have a live
// courier API (Shiprocket/DHL/EasyPost etc.) wired up yet. This is a
// deterministic stand-in based on destination country, collected at checkout.
// TODO: replace with a real-time carrier rate lookup once you have a
// shipping-API account — swap the body of calculateShipping() in
// lib/shipping.ts for an API call keyed on country + postal code + weight.
export const INTERNATIONAL_SHIPPING_DEFAULT_INR = 2499;
export const INTERNATIONAL_SHIPPING_ZONES: Record<string, number> = {
  // Zone 1 — neighboring countries
  Nepal: 799,
  Bangladesh: 799,
  "Sri Lanka": 799,
  Bhutan: 799,
  Pakistan: 799,
  Maldives: 799,
  // Zone 2 — Asia-Pacific & Middle East
  "United Arab Emirates": 1299,
  "Saudi Arabia": 1299,
  Qatar: 1299,
  Kuwait: 1299,
  Oman: 1299,
  Bahrain: 1299,
  Singapore: 1299,
  Malaysia: 1299,
  Thailand: 1299,
  Indonesia: 1299,
  Philippines: 1299,
  "Hong Kong": 1299,
  Japan: 1299,
  "South Korea": 1299,
  China: 1299,
  // Zone 3 — North America, Europe, Oceania
  "United States": 1999,
  Canada: 1999,
  "United Kingdom": 1999,
  Germany: 1999,
  France: 1999,
  Italy: 1999,
  Spain: 1999,
  Netherlands: 1999,
  Australia: 1999,
  "New Zealand": 1999,
  Ireland: 1999,
  Sweden: 1999,
  Switzerland: 1999,
};

// Country dropdown for checkout — "India" first (the common case), then the
// countries with an explicit shipping zone above, alphabetically. Anything
// else falls back to INTERNATIONAL_SHIPPING_DEFAULT_INR.
export const COUNTRIES = [
  "India",
  ...Object.keys(INTERNATIONAL_SHIPPING_ZONES).sort(),
  "Other",
] as const;

// ============================================================================
// Custom builder — the site's main focus. Customers pick a product type,
// then either "Build Your Own" (pick every detail) or "Surprise Me" (write a
// note, let the maker decide). Each product type has its own MRP/price for
// each mode — edit any of these directly for a sale, price change, etc.
// ============================================================================

export type CustomProductTypeSlug =
  | "phone-case"
  | "hairbrush"
  | "hand-mirror"
  | "table-mirror"
  | "keychain";

export type CustomProductType = {
  slug: CustomProductTypeSlug;
  name: string;
  requiresPhoneModel: boolean;
  image: string;
  build: { mrpInr: number; priceInr: number };
  surprise: { mrpInr: number; priceInr: number };
};

export const CUSTOM_PRODUCT_TYPES: CustomProductType[] = [
  {
    slug: "phone-case",
    name: "Phone Case",
    requiresPhoneModel: true,
    image: "/products/real/pink-hello-kitty-case.jpg",
    build: { mrpInr: 1999, priceInr: 1000 },
    surprise: { mrpInr: 1799, priceInr: 900 },
  },
  {
    slug: "hairbrush",
    name: "Hairbrush",
    requiresPhoneModel: false,
    image: "/products/real/sugar-bow-comb.jpg",
    build: { mrpInr: 1199, priceInr: 600 },
    surprise: { mrpInr: 1099, priceInr: 550 },
  },
  {
    slug: "hand-mirror",
    name: "Hand Mirror",
    requiresPhoneModel: false,
    image: "/products/real/bubblegum-bow-mirror-1.jpg",
    build: { mrpInr: 699, priceInr: 350 },
    surprise: { mrpInr: 649, priceInr: 325 },
  },
  {
    slug: "table-mirror",
    name: "Table Mirror",
    requiresPhoneModel: false,
    image: "/products/real/bow-heart-mirror.jpg",
    build: { mrpInr: 699, priceInr: 350 },
    surprise: { mrpInr: 649, priceInr: 325 },
  },
  {
    slug: "keychain",
    name: "Keychain",
    requiresPhoneModel: false,
    image: "/products/real/sweetheart-keychain-duo.jpg",
    build: { mrpInr: 599, priceInr: 300 },
    surprise: { mrpInr: 549, priceInr: 275 },
  },
];

// TODO: this is a representative list of phones commonly sold in India, not
// an exhaustive live catalog — add/remove models here as needed. "Type your
// own" is always offered as a fallback so no customer is blocked from ordering.
export const PHONE_MODELS: string[] = [
  // Apple
  "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17 Air", "iPhone 17",
  "iPhone 16e",
  "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
  "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
  "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 Mini",
  "iPhone 12", "iPhone 12 Mini", "iPhone 11", "iPhone SE (2022)",
  // Samsung
  "Samsung Galaxy S25 Ultra", "Samsung Galaxy S25 Edge", "Samsung Galaxy S25+", "Samsung Galaxy S25",
  "Samsung Galaxy S24 Ultra", "Samsung Galaxy S24+", "Samsung Galaxy S24", "Samsung Galaxy S24 FE",
  "Samsung Galaxy S23 Ultra", "Samsung Galaxy S23+", "Samsung Galaxy S23", "Samsung Galaxy S23 FE",
  "Samsung Galaxy Z Fold 7", "Samsung Galaxy Z Flip 7", "Samsung Galaxy Z Fold 6", "Samsung Galaxy Z Flip 6",
  "Samsung Galaxy A56", "Samsung Galaxy A36", "Samsung Galaxy A26", "Samsung Galaxy A16",
  "Samsung Galaxy A55", "Samsung Galaxy A54", "Samsung Galaxy A34", "Samsung Galaxy A25", "Samsung Galaxy A15",
  "Samsung Galaxy M56", "Samsung Galaxy M36", "Samsung Galaxy M55", "Samsung Galaxy M35", "Samsung Galaxy M15",
  "Samsung Galaxy F56", "Samsung Galaxy F55", "Samsung Galaxy F15",
  // OnePlus
  "OnePlus 13", "OnePlus 13R", "OnePlus 12", "OnePlus 12R", "OnePlus 11",
  "OnePlus Nord 5", "OnePlus Nord CE 5", "OnePlus Nord 4", "OnePlus Nord CE 4",
  // Xiaomi / Redmi / POCO
  "Xiaomi 15 Ultra", "Xiaomi 15", "Xiaomi 15 Civi", "Xiaomi 14", "Xiaomi 14 Civi",
  "Redmi Note 14 Pro+", "Redmi Note 14 Pro", "Redmi Note 14", "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13",
  "Redmi 14C", "Redmi 13C",
  "POCO X7 Pro", "POCO X7", "POCO X6 Pro", "POCO X6", "POCO M6 Pro", "POCO F6", "POCO C71",
  // Vivo
  "Vivo X200 Pro", "Vivo X200", "Vivo V40 Pro", "Vivo V30 Pro", "Vivo V30", "Vivo V29",
  "Vivo Y200", "Vivo Y100", "Vivo Y28", "Vivo T3 Pro", "Vivo T3x",
  // Oppo
  "Oppo Find X8 Pro", "Oppo Find X8", "Oppo Reno 13 Pro", "Oppo Reno 12 Pro", "Oppo Reno 11 Pro",
  "Oppo F27 Pro", "Oppo F25 Pro", "Oppo A79", "Oppo A59", "Oppo K12x",
  // Realme
  "Realme GT 7", "Realme GT 6", "Realme 13 Pro+", "Realme 13 Pro", "Realme 12 Pro+", "Realme 12 Pro",
  "Realme Narzo 70 Pro", "Realme Narzo 70", "Realme C67",
  // Google
  "Google Pixel 10 Pro", "Google Pixel 10", "Google Pixel 9 Pro", "Google Pixel 9",
  "Google Pixel 9a", "Google Pixel 8a", "Google Pixel 7a",
  // Motorola
  "Moto Edge 60 Pro", "Moto Edge 50 Pro", "Moto Edge 50", "Moto G95", "Moto G85", "Moto G64",
  "Moto Razr 60 Ultra", "Moto Razr 50 Ultra",
  // iQOO
  "iQOO 13", "iQOO 12", "iQOO Neo 10", "iQOO Neo 9 Pro", "iQOO Z10", "iQOO Z9x",
  // Nothing
  "Nothing Phone (3)", "Nothing Phone (2a) Plus", "Nothing Phone (2)", "Nothing Phone (2a)",
  // Others
  "Asus ROG Phone 9", "Asus ROG Phone 8", "Lava Blaze 2", "Micromax In Note 2",
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
  "Pink",
  "Purple",
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
  CUTEJOY30: { code: "CUTEJOY30", percentOff: 30, minPurchaseInr: 500 },
  LAUNCH50: { code: "LAUNCH50", percentOff: 50, minPurchaseInr: 0 },
};

// Site-wide launch offer — automatically applied to every order with no code
// needed, no minimum purchase. Flip to false (or delete) once the launch
// promo period ends; existing coupon codes keep working either way.
export const LAUNCH_OFFER_ACTIVE = true;
export const AUTO_APPLY_COUPON_CODE = "LAUNCH50";
