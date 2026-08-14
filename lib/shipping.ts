import {
  FREE_SHIPPING_THRESHOLD_INR,
  INTERNATIONAL_SHIPPING_DEFAULT_INR,
  INTERNATIONAL_SHIPPING_ZONES,
  SHIPPING_FLAT_RATE_INR,
} from "@/lib/constants";

/**
 * Domestic (India) flat-rate shipping, waived above the free-shipping
 * threshold; zone-based flat rate for international destinations (see
 * INTERNATIONAL_SHIPPING_ZONES — a stand-in until a real courier API is
 * wired up). Evaluated against what the customer is actually paying for the
 * items — i.e. subtotal minus any coupon/launch discount, NOT the raw
 * pre-discount subtotal — so a heavily-discounted small order doesn't get
 * free shipping it wouldn't otherwise qualify for. Shared by the
 * cart/checkout preview (client) and the order API (server, authoritative).
 *
 * `country` should be omitted when unknown yet (e.g. cart page, before the
 * shipping address is filled in) — defaults to the domestic rate as the
 * most common case.
 */
export function calculateShipping(payableInr: number, country?: string): number {
  const isDomestic = !country || country.trim().toLowerCase() === "india";

  if (isDomestic) {
    return payableInr >= FREE_SHIPPING_THRESHOLD_INR ? 0 : SHIPPING_FLAT_RATE_INR;
  }

  return INTERNATIONAL_SHIPPING_ZONES[country.trim()] ?? INTERNATIONAL_SHIPPING_DEFAULT_INR;
}
