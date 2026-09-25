import { NextResponse } from "next/server";
import { adminListCustomTypes } from "@/lib/admin-custom-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function GET() {
  const types = await adminListCustomTypes();
  return NextResponse.json({ types });
}
