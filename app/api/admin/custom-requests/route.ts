import { NextResponse } from "next/server";
import { adminListCustomRequests } from "@/lib/custom-requests";
import type { CustomRequestStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

const STATUSES: CustomRequestStatus[] = ["pending", "approved", "rejected", "paid"];

export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get("status");
  const filter = STATUSES.includes(status as CustomRequestStatus) ? (status as CustomRequestStatus) : undefined;
  const requests = await adminListCustomRequests(filter);
  return NextResponse.json({ requests });
}
