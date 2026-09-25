import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminCreateCoupon, adminListCoupons, validateCouponInput, type CouponInput } from "@/lib/admin-coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function GET() {
  const coupons = await adminListCoupons();
  return NextResponse.json({ coupons });
}

export async function POST(req: Request) {
  let body: Partial<CouponInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const errors = validateCouponInput(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: errors }, { status: 400 });
  }

  const result = await adminCreateCoupon(body as CouponInput);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/");

  return NextResponse.json({ coupon: result }, { status: 201 });
}
