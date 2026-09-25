import { NextResponse } from "next/server";
import { getCoupons } from "@/lib/coupons-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// `dynamic = "force-dynamic"` alone doesn't reliably stop Next's Data Cache
// from caching fetch() calls made *inside* a Route Handler (that guarantee
// is documented for page/layout rendering, not Route Handlers) — without
// this, the Supabase client's internal fetch could keep serving a cached
// coupons snapshot from before an admin toggled one on/off.
export const fetchCache = "force-no-store";

/**
 * Public, unauthenticated — coupon codes and percentages are already visible
 * to any customer who applies one, so there's nothing sensitive here. Used
 * by cart/checkout (live discount preview) and the navbar (launch banner).
 */
export async function GET() {
  const coupons = await getCoupons();
  return NextResponse.json({ coupons });
}
