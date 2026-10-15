import { DEFAULT_SHIPPING, type ShippingConfig } from "@/lib/settings-defaults";

/**
 * The applied coupon's shipping overrides (set from the admin coupons page),
 * by destination: `shippingOverrideInr` for orders shipping within India,
 * `shippingOverrideUsd` for international orders. null = normal shipping
 * rules; 0 = free shipping; anything else = flat charge. Whichever currency
 * the order is actually charged in, the override for its destination is
 * converted at the configured $/₹ rate if needed.
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
 * rate (a stand-in until a real courier API is wired up), waived at or
 * above the international USD threshold's INR equivalent. Evaluated against
 * what the customer is actually paying for the items — i.e. subtotal minus
 * any coupon discount — so a heavily-discounted small order doesn't get free
 * shipping it wouldn't otherwise qualify for. Shared by the cart/checkout
 * preview (client) and the order API (server, authoritative).
 *
 * `config` is the admin's shipping settings (Admin → Settings): pass
 * `settings.shipping` from getStoreSettings() (server) or useStore()
 * (client). Defaults to the built-in rates.
 *
 * `country` should be omitted when unknown yet (e.g. cart page, before the
 * shipping address is filled in) — defaults to the domestic rate as the
 * most common case.
 */
export function calculateShipping(
  payableInr: number,
  country?: string,
  override?: ShippingOverride,
  config: ShippingConfig = DEFAULT_SHIPPING
): number {
  if (isDomesticCountry(country)) {
    if (typeof override?.shippingOverrideInr === "number") return override.shippingOverrideInr;
    return payableInr >= config.freeThresholdInr ? 0 : config.domesticFlatInr;
  }

  if (typeof override?.shippingOverrideUsd === "number") return roundMoney(override.shippingOverrideUsd * config.usdInrRate);
  if (payableInr >= config.freeThresholdUsdIntl * config.usdInrRate) return 0;
  return config.intlZones[country!.trim()] ?? config.intlDefaultInr;
}

/**
 * Same rules, for a USD-charged (PayPal) order. International: the coupon's
 * USD override as-is, else free at or above the international USD
 * threshold, else the zone rate converted to USD. Domestic (an Indian
 * address paying via PayPal): the INR rules, converted to USD.
 */
export function calculateShippingUsd(
  payableUsd: number,
  country?: string,
  override?: ShippingOverride,
  config: ShippingConfig = DEFAULT_SHIPPING
): number {
  if (!isDomesticCountry(country)) {
    if (typeof override?.shippingOverrideUsd === "number") return override.shippingOverrideUsd;
    if (payableUsd >= config.freeThresholdUsdIntl) return 0;
  }

  const shippingInr = calculateShipping(payableUsd * config.usdInrRate, country, override, config);
  return roundMoney(shippingInr / config.usdInrRate);
}
