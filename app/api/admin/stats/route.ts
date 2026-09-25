import { NextResponse } from "next/server";
import { getOrderStats } from "@/lib/orders";

export const runtime = "nodejs";
// No request-dependent code runs in this handler (no params, no cookies
// read directly), so Next's static-optimization heuristic would otherwise
// cache the first response forever and serve stale dashboard numbers on
// every later request — force it to run fresh on every request instead.
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function GET() {
  const stats = await getOrderStats();
  return NextResponse.json({ stats });
}
