import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type AdminCouponRow = {
  code: string;
  percent_off: number;
  min_purchase_inr: number;
  active: boolean;
  auto_apply: boolean;
  shipping_override_inr: number | null;
  shipping_override_usd: number | null;
};

export async function adminListCoupons(): Promise<AdminCouponRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase.from("coupons").select("*").order("code", { ascending: true });
  if (error || !data) return [];
  return data as AdminCouponRow[];
}

export type CouponInput = {
  code: string;
  percent_off: number;
  min_purchase_inr: number;
  active: boolean;
  auto_apply: boolean;
  // By destination: _inr for orders shipping within India, _usd for international.
  // null = normal shipping rules; 0 = free shipping; > 0 = flat shipping.
  shipping_override_inr: number | null;
  shipping_override_usd: number | null;
};

function isValidOverride(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export type CouponValidationError = { field: string; message: string };

const CODE_RE = /^[A-Z0-9]{3,20}$/;

export function validateCouponInput(input: Partial<CouponInput>): CouponValidationError[] {
  const errors: CouponValidationError[] = [];

  if (typeof input.code !== "string" || !CODE_RE.test(input.code.trim().toUpperCase())) {
    errors.push({ field: "code", message: "Code must be 3-20 letters/numbers, no spaces or symbols." });
  }
  for (const field of ["shipping_override_inr", "shipping_override_usd"] as const) {
    const value = input[field];
    if (value !== null && value !== undefined && !isValidOverride(value)) {
      errors.push({ field, message: "Shipping charge must be 0 or more (leave blank for normal shipping)." });
    }
  }
  const hasShippingOverride = isValidOverride(input.shipping_override_inr) || isValidOverride(input.shipping_override_usd);
  // 0% off is only allowed for a shipping-only coupon (e.g. a FREESHIP code).
  if (
    typeof input.percent_off !== "number" ||
    !Number.isFinite(input.percent_off) ||
    input.percent_off < 0 ||
    input.percent_off > 100 ||
    (input.percent_off === 0 && !hasShippingOverride)
  ) {
    errors.push({
      field: "percent_off",
      message: "Percent off must be between 1 and 100 (or 0 if the coupon only changes shipping).",
    });
  }
  if (typeof input.min_purchase_inr !== "number" || !Number.isFinite(input.min_purchase_inr) || input.min_purchase_inr < 0) {
    errors.push({ field: "min_purchase_inr", message: "Minimum purchase must be 0 or more." });
  }
  if (typeof input.active !== "boolean") {
    errors.push({ field: "active", message: "Active must be true or false." });
  }
  if (typeof input.auto_apply !== "boolean") {
    errors.push({ field: "auto_apply", message: "Auto-apply must be true or false." });
  }

  return errors;
}

export async function adminCreateCoupon(input: CouponInput): Promise<AdminCouponRow | { error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Database isn't configured." };

  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code: input.code.trim().toUpperCase(),
      percent_off: input.percent_off,
      min_purchase_inr: input.min_purchase_inr,
      active: input.active,
      auto_apply: input.auto_apply,
      shipping_override_inr: input.shipping_override_inr ?? null,
      shipping_override_usd: input.shipping_override_usd ?? null,
    })
    .select()
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create coupon." };
  return data as AdminCouponRow;
}

export async function adminUpdateCoupon(code: string, input: CouponInput): Promise<AdminCouponRow | { error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Database isn't configured." };

  const { data, error } = await supabase
    .from("coupons")
    .update({
      percent_off: input.percent_off,
      min_purchase_inr: input.min_purchase_inr,
      active: input.active,
      auto_apply: input.auto_apply,
      shipping_override_inr: input.shipping_override_inr ?? null,
      shipping_override_usd: input.shipping_override_usd ?? null,
    })
    .eq("code", code)
    .select()
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to update coupon." };
  return data as AdminCouponRow;
}

export async function adminDeleteCoupon(code: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { error } = await supabase.from("coupons").delete().eq("code", code);
  return !error;
}
