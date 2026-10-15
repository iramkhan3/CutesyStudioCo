import type { Coupon } from "@/lib/constants";

export function findCoupon(code: string, coupons: Coupon[]): Coupon | null {
  const normalized = code.trim().toUpperCase();
  return coupons.find((c) => c.code === normalized) ?? null;
}

export type CouponResult = {
  discount: number;
  coupon: Coupon | null;
  error: string | null;
};

/**
 * Pure discount calculation shared by the cart/checkout preview (client,
 * fetches `coupons` from GET /api/coupons) and the order API (server,
 * authoritative — fetches via lib/coupons-data.ts). Never trust a discount
 * amount computed anywhere but here, run against the server's own subtotal,
 * with the server's own `coupons` list.
 */
export function calculateDiscount(
  subtotalInr: number,
  code: string | null | undefined,
  coupons: Coupon[],
  // For a USD (PayPal) order, `subtotalInr` is really the USD subtotal (the
  // percentage math is currency-agnostic) — pass its INR equivalent here so
  // the coupon's ₹ minimum purchase is compared like-for-like.
  subtotalInrForMinimum: number = subtotalInr
): CouponResult {
  const autoApply = coupons.find((c) => c.autoApply) ?? null;
  const effectiveCode = code && code.trim() ? code : autoApply?.code ?? null;

  if (!effectiveCode) {
    return { discount: 0, coupon: null, error: null };
  }

  const coupon = findCoupon(effectiveCode, coupons);
  if (!coupon) {
    return { discount: 0, coupon: null, error: "That coupon code isn't valid." };
  }

  if (subtotalInrForMinimum < coupon.minPurchaseInr) {
    return {
      discount: 0,
      coupon: null,
      error: `Add ₹${(coupon.minPurchaseInr - subtotalInrForMinimum).toFixed(2)} more to use ${coupon.code}.`,
    };
  }

  const discount = Math.round(subtotalInr * (coupon.percentOff / 100) * 100) / 100;
  return { discount, coupon, error: null };
}
