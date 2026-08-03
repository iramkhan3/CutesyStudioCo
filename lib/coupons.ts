import { COUPONS, type Coupon } from "@/lib/constants";

export function getCoupon(code: string): Coupon | null {
  const normalized = code.trim().toUpperCase();
  return COUPONS[normalized] ?? null;
}

export type CouponResult = {
  discount: number;
  coupon: Coupon | null;
  error: string | null;
};

/**
 * Pure discount calculation shared by the cart preview (client) and the
 * order API (server, authoritative). Never trust a discount amount computed
 * anywhere but here run against the server's own subtotal.
 */
export function calculateDiscount(subtotalInr: number, code?: string | null): CouponResult {
  if (!code || !code.trim()) {
    return { discount: 0, coupon: null, error: null };
  }

  const coupon = getCoupon(code);
  if (!coupon) {
    return { discount: 0, coupon: null, error: "That coupon code isn't valid." };
  }

  if (subtotalInr < coupon.minPurchaseInr) {
    return {
      discount: 0,
      coupon: null,
      error: `Add ₹${(coupon.minPurchaseInr - subtotalInr).toFixed(2)} more to use ${coupon.code}.`,
    };
  }

  const discount = Math.round(subtotalInr * (coupon.percentOff / 100) * 100) / 100;
  return { discount, coupon, error: null };
}
