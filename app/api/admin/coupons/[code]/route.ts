import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminDeleteCoupon, adminUpdateCoupon, validateCouponInput, type CouponInput } from "@/lib/admin-coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  let body: Partial<CouponInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Code itself is the primary key and isn't editable here — keep the
  // existing one for validation purposes so the shared validator is happy.
  const errors = validateCouponInput({ ...body, code: params.code });
  if (errors.length > 0) {
    return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: errors }, { status: 400 });
  }

  const result = await adminUpdateCoupon(params.code, body as CouponInput);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Cart/checkout/navbar read coupons via a force-dynamic API fetch (never
  // cached) — only the homepage's server-rendered launch banner text needs
  // an explicit revalidate.
  revalidatePath("/");

  return NextResponse.json({ coupon: result });
}

export async function DELETE(_req: Request, { params }: { params: { code: string } }) {
  const ok = await adminDeleteCoupon(params.code);
  if (!ok) return NextResponse.json({ error: "Failed to delete coupon." }, { status: 400 });

  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
