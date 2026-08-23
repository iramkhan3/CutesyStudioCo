import {
  FREE_SHIPPING_THRESHOLD_INR,
  INTERNATIONAL_SHIPPING_DEFAULT_INR,
  INTERNATIONAL_SHIPPING_ZONES,
  SHIPPING_FLAT_RATE_INR,
  USD_INR_RATE,
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

/**
 * Same shipping logic, for a USD-denominated (PayPal) order. There's no
 * separate USD-native shipping rate table — this converts the USD payable
 * amount to its INR-equivalent (via USD_INR_RATE) purely to run the same
 * calculateShipping() rules (so the domestic free-shipping threshold still
 * behaves consistently regardless of which payment provider a customer
 * picks), then converts the resulting INR shipping figure back to USD.
 */
export function calculateShippingUsd(payableUsd: number, country?: string): number {
  const payableInrEquivalent = payableUsd * USD_INR_RATE;
  const shippingInr = calculateShipping(payableInrEquivalent, country);
  return Math.round((shippingInr / USD_INR_RATE) * 100) / 100;
}
