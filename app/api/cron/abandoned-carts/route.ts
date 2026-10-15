import { NextResponse } from "next/server";
import { sendAbandonedCartReminders } from "@/lib/abandoned-carts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

/**
 * Daily abandoned-checkout reminder run, triggered by Vercel Cron (see
 * vercel.json). Vercel sends `Authorization: Bearer <CRON_SECRET>` when the
 * CRON_SECRET env var is set — anything else is rejected, so nobody can
 * trigger email sends by hitting this URL.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await sendAbandonedCartReminders();
    console.log("[cron/abandoned-carts]", result);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[cron/abandoned-carts] failed:", err);
    return NextResponse.json({ error: "Run failed." }, { status: 500 });
  }
}
