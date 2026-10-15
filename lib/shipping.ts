import {
  FREE_SHIPPING_THRESHOLD_INR,
  FREE_SHIPPING_THRESHOLD_USD_INTERNATIONAL,
  INTERNATIONAL_SHIPPING_DEFAULT_INR,
  INTERNATIONAL_SHIPPING_ZONES,
  SHIPPING_FLAT_RATE_INR,
  USD_INR_RATE,
} from "@/lib/constants";

/**
 * The applied coupon's shipping overrides (set from the admin coupons page),
 * by destination: `shippingOverrideInr` for orders shipping within India,
 * `shippingOverrideUsd` for international orders. null = normal shipping
 * rules; 0 = free shipping; anything else = flat charge. Whichever currency
 * the order is actually charged in, the override for its destination is
 * converted at USD_INR_RATE if needed.
 */
export type ShippingOverride = { shippingOverrideInr: number | null; shippingOverrideUsd: number | null } | null | undefined;

function isDomesticCountry(country?: string): boolean {
  return !country || country.trim().toLowerCase() === "india";
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Shipping for an INR-charged (Razorpay) order. Domestic (India): flat rate,
 * waived above the free-shipping threshold. International: zone-based flat
 * rate (see INTERNATIONAL_SHIPPING_ZONES — a stand-in until a real courier
 * API is wired up), waived at or above the international USD threshold's
 * INR equivalent. Evaluated against what the customer is actually paying for
 * the items — i.e. subtotal minus any coupon discount — so a
 * heavily-discounted small order doesn't get free shipping it wouldn't
 * otherwise qualify for. Shared by the cart/checkout preview (client) and
 * the order API (server, authoritative).
 *
 * `country` should be omitted when unknown yet (e.g. cart page, before the
 * shipping address is filled in) — defaults to the domestic rate as the
 * most common case.
 */
export function calculateShipping(payableInr: number, country?: string, override?: ShippingOverride): number {
  if (isDomesticCountry(country)) {
    if (typeof override?.shippingOverrideInr === "number") return override.shippingOverrideInr;
    return payableInr >= FREE_SHIPPING_THRESHOLD_INR ? 0 : SHIPPING_FLAT_RATE_INR;
  }

  if (typeof override?.shippingOverrideUsd === "number") return roundMoney(override.shippingOverrideUsd * USD_INR_RATE);
  if (payableInr >= FREE_SHIPPING_THRESHOLD_USD_INTERNATIONAL * USD_INR_RATE) return 0;
  return INTERNATIONAL_SHIPPING_ZONES[country!.trim()] ?? INTERNATIONAL_SHIPPING_DEFAULT_INR;
}

/**
 * Same rules, for a USD-charged (PayPal) order. International: the coupon's
 * USD override as-is, else free at or above FREE_SHIPPING_THRESHOLD_USD_INTERNATIONAL,
 * else the zone rate converted to USD. Domestic (an Indian address paying
 * via PayPal): the INR rules, converted to USD.
 */
export function calculateShippingUsd(payableUsd: number, country?: string, override?: ShippingOverride): number {
  if (!isDomesticCountry(country)) {
    if (typeof override?.shippingOverrideUsd === "number") return override.shippingOverrideUsd;
    if (payableUsd >= FREE_SHIPPING_THRESHOLD_USD_INTERNATIONAL) return 0;
  }

  const shippingInr = calculateShipping(payableUsd * USD_INR_RATE, country, override);
  return roundMoney(shippingInr / USD_INR_RATE);
}
