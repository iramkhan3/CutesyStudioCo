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
  priceInr: number;
  percentOff: number;
};

/**
 * MRP vs. price_inr display, plain and simple — the % off badge shown on
 * product cards/detail/the custom builder is just mrp_inr vs. price_inr.
 * It deliberately does NOT fold in any cart-level coupon (e.g. LAUNCH50):
 * that's a separate, additional discount shown only in the cart/checkout
 * breakdown, same as any normal store shows "MRP / our price" on a product
 * page and a coupon discount only once you're in the cart.
 */
export function getDisplayPricing(mrpInr: number, priceInr: number): DisplayPricing {
  return { mrpInr, priceInr, percentOff: discountPercent(mrpInr, priceInr) };
}

/**
 * Approximate USD string for showing alongside an INR amount at checkout
 * for international orders, e.g. "7.23" — reference only, see
 * USD_INR_RATE. Always call formatUsdApprox() for the "(~$X.XX USD)"
 * bracket form customers actually see.
 */
export function toUsdApprox(inr: number): string {
  return (inr / USD_INR_RATE).toFixed(2);
}

export function formatUsdApprox(inr: number): string {
  return `(~$${toUsdApprox(inr)} USD)`;
}
