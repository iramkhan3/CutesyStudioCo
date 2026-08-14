import { calculateDiscount } from "@/lib/coupons";
import { USD_INR_RATE } from "@/lib/constants";

/**
 * Whole-number discount percentage for an MRP-vs-price display. Returns 0
 * when there's no real discount (mrp <= price) so callers can just check
 * `percent > 0` before rendering a badge.
 */
export function discountPercent(mrpInr: number, priceInr: number): number {
  if (mrpInr <= priceInr || mrpInr <= 0) return 0;
  return Math.round(((mrpInr - priceInr) / mrpInr) * 100);
}

export type DisplayPricing = {
  mrpInr: number;
  effectivePriceInr: number;
  percentOff: number;
};

/**
 * What a customer actually ends up paying per unit, right now, including
 * any currently-active sitewide auto-discount (e.g. the LAUNCH50 coupon) —
 * NOT just the raw price_inr. price_inr alone understates the real discount
 * whenever an auto-coupon is active, since that coupon applies again on top
 * of it at checkout: showing "50% OFF" on a product page while the cart
 * silently applies another 50% on top is a bait-and-switch, so every
 * customer-facing price/badge should be computed from this, not price_inr
 * directly. Cart/checkout math is untouched by this — they still start from
 * price_inr and apply the coupon at the subtotal level, and the two now
 * agree because this helper runs the exact same calculateDiscount() a
 * single unit would see.
 */
export function getDisplayPricing(mrpInr: number, priceInr: number): DisplayPricing {
  const { discount } = calculateDiscount(priceInr, null);
  const effectivePriceInr = Math.round((priceInr - discount) * 100) / 100;
  return { mrpInr, effectivePriceInr, percentOff: discountPercent(mrpInr, effectivePriceInr) };
}

/**
 * Approximate USD string for showing alongside an INR amount at checkout
 * for international orders, e.g. "$7.23" — reference only, see
 * USD_INR_RATE. Always call formatUsdApprox() for the "(~$X.XX)" bracket
 * form customers actually see.
 */
export function toUsdApprox(inr: number): string {
  return (inr / USD_INR_RATE).toFixed(2);
}

export function formatUsdApprox(inr: number): string {
  return `(~$${toUsdApprox(inr)})`;
}
