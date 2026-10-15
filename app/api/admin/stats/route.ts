import { NextResponse } from "next/server";
import { getOrderStats } from "@/lib/orders";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** Items waiting on the maker, for the dashboard's "Needs your attention" panel. */
async function getAttentionCounts() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { pendingRequests: 0, pendingReviews: 0, subscribers: 0 };
  const count = async (table: string, filter?: [string, string]) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true });
    if (filter) q = q.eq(filter[0], filter[1]);
    const { count: n, error } = await q;
    return error ? 0 : n ?? 0;
  };
  const [pendingRequests, pendingReviews, subscribers] = await Promise.all([
    count("custom_requests", ["status", "pending"]),
    count("reviews", ["status", "pending"]),
    count("subscribers"),
  ]);
  return { pendingRequests, pendingReviews, subscribers };
}

export const runtime = "nodejs";
// No request-dependent code runs in this handler (no params, no cookies
// read directly), so Next's static-optimization heuristic would otherwise
// cache the first response forever and serve stale dashboard numbers on
// every later request — force it to run fresh on every request instead.
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function GET() {
  const [stats, attention] = await Promise.all([getOrderStats(), getAttentionCounts()]);
  return NextResponse.json({ stats, attention });
}
