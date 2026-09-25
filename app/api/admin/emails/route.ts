import { NextResponse } from "next/server";
import { adminListEmailTemplates } from "@/lib/admin-email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function GET() {
  const templates = await adminListEmailTemplates();
  return NextResponse.json({ templates });
}
