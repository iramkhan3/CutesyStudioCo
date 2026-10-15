// Admin-editable settings: types + defaults. Client-safe (no server-only
// imports) — client components read the live values via useStore() from
// components/StoreProvider.tsx; the server reads them via lib/settings.ts.
// The defaults are the values the site shipped with, so a fresh database
// (or a field that's never been edited) behaves exactly as before.
import {
  CUSTOM_ORDER_TIMELINE_NOTE,
  FREE_SHIPPING_THRESHOLD_INR,
  FREE_SHIPPING_THRESHOLD_USD_INTERNATIONAL,
  INTERNATIONAL_SHIPPING_DEFAULT_INR,
  INTERNATIONAL_SHIPPING_ZONES,
  SHIPPING_FLAT_RATE_INR,
  SITE,
  USD_INR_RATE,
} from "@/lib/constants";

export type ShippingConfig = {
  domesticFlatInr: number;
  freeThresholdInr: number;
  freeThresholdUsdIntl: number;
  intlDefaultInr: number;
  // Country name → flat international shipping rate in ₹.
  intlZones: Record<string, number>;
  usdInrRate: number;
};

export type StoreSettings = {
  contactEmail: string;
  // Digits only, with country code (wa.me format).
  whatsappNumber: string;
  instagramHandle: string;
  instagramUrl: string;
  // Shown in a strip above the navbar on every page. Empty = hidden.
  announcementText: string;
  customOrderTimelineNote: string;
  shipping: ShippingConfig;
};

export type Category = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  rank: number;
  enabled: boolean;
  // "Starting from" price per piece for custom requests; null = on request.
  customFromInr: number | null;
  // Defined in lib/constants.ts CATEGORIES (can be renamed/disabled, not deleted).
  builtIn: boolean;
};

export type CarouselSlide = { src: string; alt: string };

export type HomepageContent = {
  heroTag: string;
  heroTitle: string;
  heroText: string;
  shopTag: string;
  shopTitle: string;
  shopText: string;
  customizeTitle: string;
  customizeText: string;
  carouselTitle: string;
  carouselText: string;
  carousel: CarouselSlide[];
  // Launch-offer banner (only shown while an auto-apply coupon is active).
  // {percent} is replaced with the coupon's % off.
  launchTitle: string;
  launchText: string;
  aboutTitle: string;
  aboutParagraphs: string[];
  makerTitle: string;
  makerText: string;
  makerImage: string;
};

export const DEFAULT_SHIPPING: ShippingConfig = {
  domesticFlatInr: SHIPPING_FLAT_RATE_INR,
  freeThresholdInr: FREE_SHIPPING_THRESHOLD_INR,
  freeThresholdUsdIntl: FREE_SHIPPING_THRESHOLD_USD_INTERNATIONAL,
  intlDefaultInr: INTERNATIONAL_SHIPPING_DEFAULT_INR,
  intlZones: INTERNATIONAL_SHIPPING_ZONES,
  usdInrRate: USD_INR_RATE,
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  contactEmail: SITE.email,
  whatsappNumber: SITE.whatsappNumber,
  instagramHandle: SITE.instagramHandle,
  instagramUrl: SITE.instagramUrl,
  announcementText: "",
  customOrderTimelineNote: CUSTOM_ORDER_TIMELINE_NOTE,
  shipping: DEFAULT_SHIPPING,
};

export const DEFAULT_HOMEPAGE: HomepageContent = {
  heroTag: "Made just for you",
  heroTitle: "Design your dream piece,\nmade by hand",
  heroText:
    "CutesyStudioCo is a one-woman decoden studio. Pick your phone case, hairbrush, mirror, or keychain, tell us your vibe, and we'll hand-cover it in cute charms and swirls of satisfying decoden cream — one of one, just for you.",
  shopTag: "Existing Designs",
  shopTitle: "Our Favorite Pieces Right Now",
  shopText:
    "Already finished and sitting in the studio — buy this exact piece and it ships in 1-2 days. Love the design but need a different phone? Every design here can be custom-made for your exact model.",
  customizeTitle: "Build Your Dream Piece",
  customizeText:
    "Phone case, hairbrush, hand mirror, table mirror, or keychain — pick a type, choose every detail yourself, or let us surprise you with something one-of-a-kind.",
  carouselTitle: "No renders. No stock photos. Just the real thing.",
  carouselText:
    "A look at what leaves our desk — hand-placed charms, piped cream, and every little detail intact. This is the kind of care that goes into every custom order too.",
  carousel: [
    { src: "/products/real/rainbow-hello-kitty-case.jpg", alt: "Pastel rainbow Hello Kitty decoden phone case" },
    { src: "/products/real/cookies-cream-case.jpg", alt: "Cookies and cream themed decoden phone case" },
    { src: "/products/real/carousel-dreams-case.jpg", alt: "Pastel carousel-themed decoden phone case" },
    { src: "/products/real/lilac-garden-case-1.jpg", alt: "Lilac garden decoden phone case" },
    { src: "/products/real/vanilla-carousel-case-1.jpg", alt: "Vanilla carousel decoden phone case" },
    { src: "/products/real/cinnamoroll-sky-case.jpg", alt: "Cinnamoroll sky blue decoden phone case" },
    { src: "/products/real/rainbow-noir-case.jpg", alt: "Rainbow noir decoden phone case" },
    { src: "/products/real/christmas-sparkle-case.jpg", alt: "Christmas sparkle decoden phone case" },
    { src: "/marketing/pastel-cases-pair.jpg", alt: "A pair of pastel decoden phone cases side by side" },
    { src: "/marketing/three-cases-lineup.jpg", alt: "Three finished decoden phone cases lined up" },
    { src: "/products/real/charms-in-hand.jpg", alt: "A handful of tiny charms ready to be placed" },
    { src: "/marketing/festive-pouches-duo.jpg", alt: "A Christmas pouch and a Hello Kitty pouch, handmade" },
  ],
  launchTitle: "Flat {percent}% off, everything",
  launchText:
    "To celebrate going live, every single piece — ready-to-ship or made to order — is {percent}% off, automatically, no code needed.",
  aboutTitle: "A little studio, a whole lot of cute",
  aboutParagraphs: [
    "CutesyStudioCo started the way a lot of good things do — with a dream and a life that felt a little too plain. What began as decorating my own case with a couple of cute charms and creamy decoden turned into a passion to transform the world with a dash of joy. Every object that you see daily can make you happy — everything from phone cases and covers, jewelry boxes, mirrors, hairbrushes, tablet stands to trinket boxes.",
    "If you're new to the term: decoden is a Japanese decorating style built around rhinestones, cute charms, and swirls of faux cream, layered on until an everyday object looks like it belongs in a dessert shop. It's fussy, it's slow, and it is genuinely my favorite way to spend my leisure time.",
    "It is made from 100% silicone and is completely safe and enhances strength of the objects. All charms are firmly attached to the silicone and don't fall off!",
    "Every single piece that leaves this studio is made by hand, one at a time — no molds, no mass production, no two pieces exactly alike. I place each charm myself, seal it by hand, and pack it up with as much care as I put into making it.",
  ],
  makerTitle: "Hi, I'm Iram 👋",
  makerText:
    "I'm the one-person team behind every piece here — designer, charm-placer, packer, and the person who answers your emails. I'm based in India, obsessed with all things kawaii and pastel, and I built CutesyStudioCo around one simple goal: bringing joy to the world, one cute thing at a time.",
  makerImage: "/products/real/charms-in-hand.jpg",
};

/** Deep-merges a saved (possibly partial / older-shape) settings object over the defaults. */
export function mergeStoreSettings(saved: unknown): StoreSettings {
  const s = (saved && typeof saved === "object" ? saved : {}) as Partial<StoreSettings>;
  return {
    ...DEFAULT_STORE_SETTINGS,
    ...pickDefined(s, DEFAULT_STORE_SETTINGS),
    shipping: {
      ...DEFAULT_SHIPPING,
      ...pickDefined((s.shipping ?? {}) as Partial<ShippingConfig>, DEFAULT_SHIPPING),
    },
  };
}

export function mergeHomepage(saved: unknown): HomepageContent {
  const s = (saved && typeof saved === "object" ? saved : {}) as Partial<HomepageContent>;
  return { ...DEFAULT_HOMEPAGE, ...pickDefined(s, DEFAULT_HOMEPAGE) };
}

// Only keeps keys that exist in the defaults and have the same JS type, so a
// malformed or outdated saved value can never break a page.
function pickDefined<T extends object>(saved: Partial<T>, defaults: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const value = saved[key];
    if (value === undefined || value === null) continue;
    const expected = defaults[key];
    if (Array.isArray(expected) ? Array.isArray(value) : typeof value === typeof expected) out[key] = value as T[keyof T];
  }
  return out;
}

/** Country dropdown: India first, then countries with a shipping zone, then "Other". */
export function countriesFor(shipping: ShippingConfig): string[] {
  return ["India", ...Object.keys(shipping.intlZones).filter((c) => c !== "India").sort(), "Other"];
}

export function whatsappLinkFor(number: string, message?: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
