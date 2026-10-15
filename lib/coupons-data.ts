import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { COUPONS, type Coupon } from "@/lib/constants";

type CouponRow = {
  code: string;
  percent_off: number;
  min_purchase_inr: number;
  active: boolean;
  auto_apply: boolean;
  // Missing entirely if the shipping override migration hasn't been run.
  shipping_override_inr?: number | null;
  shipping_override_usd?: number | null;
};

function rowToCoupon(row: CouponRow): Coupon {
  return {
    code: row.code,
    percentOff: row.percent_off,
    minPurchaseInr: row.min_purchase_inr,
    active: row.active,
    autoApply: row.auto_apply,
    shippingOverrideInr: row.shipping_override_inr == null ? null : Number(row.shipping_override_inr),
    shippingOverrideUsd: row.shipping_override_usd == null ? null : Number(row.shipping_override_usd),
  };
}

/**
 * Active coupons, DB-backed with a fallback to the hardcoded COUPONS
 * constant (same pattern as products/custom-types) so checkout never breaks
 * if the `coupons` table migration hasn't been run yet. Only `active` rows
 * are returned — an inactive coupon should behave as if it doesn't exist.
 */
export async function getCoupons(): Promise<Coupon[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return Object.values(COUPONS).filter((c) => c.active);

  const { data, error } = await supabase.from("coupons").select("*").eq("active", true);
  if (error || !data || data.length === 0) return Object.values(COUPONS).filter((c) => c.active);
  return (data as CouponRow[]).map(rowToCoupon);
}
