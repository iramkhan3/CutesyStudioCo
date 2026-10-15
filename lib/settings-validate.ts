import "server-only";
import type { HomepageContent, StoreSettings } from "@/lib/settings-defaults";

/**
 * Validation for Admin → Settings / Homepage saves. Returns an error message,
 * or null if the value is safe to store. Every field the storefront relies on
 * (prices, rates, links) is checked, so a typo can't break checkout.
 */

const isText = (v: unknown, max: number, min = 0) => typeof v === "string" && v.trim().length >= min && v.length <= max;
const isMoney = (v: unknown, max = 1_000_000) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;

export function validateStoreSettings(s: Partial<StoreSettings>): string | null {
  if (!isText(s.contactEmail, 200, 3) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.contactEmail!.trim())) {
    return "Contact email must be a valid email address.";
  }
  if (typeof s.whatsappNumber !== "string" || !/^\d{8,15}$/.test(s.whatsappNumber.replace(/\D/g, ""))) {
    return "WhatsApp number must include the country code, e.g. 919167829289.";
  }
  if (!isText(s.instagramHandle, 60)) return "Instagram handle is too long.";
  if (typeof s.instagramUrl !== "string" || (s.instagramUrl && !/^https:\/\//.test(s.instagramUrl))) {
    return "Instagram link must start with https://";
  }
  if (!isText(s.announcementText, 200)) return "Announcement text must be at most 200 characters.";
  if (!isText(s.customOrderTimelineNote, 600)) return "Custom order note must be at most 600 characters.";

  const sh = s.shipping;
  if (!sh || typeof sh !== "object") return "Shipping settings are missing.";
  if (!isMoney(sh.domesticFlatInr, 10_000)) return "India shipping rate must be between ₹0 and ₹10,000.";
  if (!isMoney(sh.freeThresholdInr)) return "India free-shipping threshold must be ₹0 or more.";
  if (!isMoney(sh.freeThresholdUsdIntl, 100_000)) return "International free-shipping threshold must be $0 or more.";
  if (!isMoney(sh.intlDefaultInr, 100_000)) return "Default international rate must be between ₹0 and ₹1,00,000.";
  if (typeof sh.usdInrRate !== "number" || !Number.isFinite(sh.usdInrRate) || sh.usdInrRate < 10 || sh.usdInrRate > 500) {
    return "The $/₹ rate must be between 10 and 500.";
  }
  if (!sh.intlZones || typeof sh.intlZones !== "object" || Array.isArray(sh.intlZones)) return "Country rates are invalid.";
  const zones = Object.entries(sh.intlZones);
  if (zones.length > 250) return "Too many country rates.";
  for (const [country, rate] of zones) {
    if (!isText(country, 60, 2) || country.toLowerCase() === "india" || country.toLowerCase() === "other") {
      return `"${country}" isn't a valid country name for an international rate.`;
    }
    if (!isMoney(rate, 100_000)) return `The rate for ${country} must be between ₹0 and ₹1,00,000.`;
  }
  return null;
}

// Site images (/products/…, /marketing/…) or photos uploaded to this
// project's Supabase Storage — the only remote host next/image allows.
const isImagePath = (v: unknown) =>
  typeof v === "string" &&
  v.length <= 500 &&
  (/^\/[\w\-./%]+$/.test(v) || /^https:\/\/[\w-]+\.supabase\.co\/storage\/v1\/object\/public\//.test(v)) &&
  !/\.(mp4|webm|mov)$/i.test(v);

export function validateHomepage(h: Partial<HomepageContent>): string | null {
  const short: (keyof HomepageContent)[] = ["heroTag", "shopTag", "launchTitle", "makerTitle"];
  const titles: (keyof HomepageContent)[] = ["heroTitle", "shopTitle", "customizeTitle", "carouselTitle", "aboutTitle"];
  const texts: (keyof HomepageContent)[] = ["heroText", "shopText", "customizeText", "carouselText", "launchText", "makerText"];
  for (const k of short) if (!isText(h[k], 80, 1)) return `"${k}" must be 1–80 characters.`;
  for (const k of titles) if (!isText(h[k], 140, 1)) return `"${k}" must be 1–140 characters.`;
  for (const k of texts) if (!isText(h[k], 1200)) return `"${k}" must be at most 1200 characters.`;

  if (!Array.isArray(h.aboutParagraphs) || h.aboutParagraphs.length > 12 || !h.aboutParagraphs.every((p) => isText(p, 2000))) {
    return "About paragraphs: up to 12, each at most 2000 characters.";
  }
  if (!isImagePath(h.makerImage)) return "Maker photo must be an uploaded image.";
  if (!Array.isArray(h.carousel) || h.carousel.length > 30) return "The photo carousel can have up to 30 photos.";
  for (const slide of h.carousel) {
    if (!slide || !isImagePath(slide.src) || !isText(slide.alt, 200)) return "Each carousel photo needs an image and a description of at most 200 characters.";
  }
  return null;
}
