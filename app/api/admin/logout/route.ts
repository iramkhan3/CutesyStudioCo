import { NextResponse } from "next/server";
import { getAdminCookieName } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getAdminCookieName(), "", { path: "/", maxAge: 0 });
  return res;
}
