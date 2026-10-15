import { NextResponse } from "next/server";
import {
  adminApproveCustomRequest,
  adminGetCustomRequest,
  adminRejectCustomRequest,
  categoryName,
  getCustomRequestCategories,
  suggestUsd,
} from "@/lib/custom-requests";
import { sendCustomRequestDecisionEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const request = await adminGetCustomRequest(params.id);
  if (!request) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Pre-fill for the approve form: the category's "starting from" price.
  const category = (await getCustomRequestCategories()).find((c) => c.slug === request.category);
  const suggestedInr = request.quoted_price_inr ?? (category?.fromInr != null ? category.fromInr * request.quantity : null);
  return NextResponse.json({
    request,
    categoryName: category?.name ?? (await categoryName(request.category)),
    suggested: {
      priceInr: suggestedInr,
      priceUsd: request.quoted_price_usd ?? (suggestedInr != null ? await suggestUsd(suggestedInr) : null),
    },
  });
}

type Body = { action?: unknown; priceInr?: unknown; priceUsd?: unknown; message?: unknown };

/**
 * { action: "approve", priceInr, priceUsd, message? } — quote and email the
 * customer a payment link (also used to re-send with a changed quote while
 * unpaid). { action: "reject", message? } — polite rejection email.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const message = typeof body.message === "string" && body.message.trim() ? body.message.trim().slice(0, 2000) : null;

  let result;
  if (body.action === "approve") {
    const priceInr = Number(body.priceInr);
    const priceUsd = Number(body.priceUsd);
    if (!Number.isFinite(priceInr) || priceInr < 1) {
      return NextResponse.json({ error: "Enter a ₹ price of at least ₹1." }, { status: 400 });
    }
    if (!Number.isFinite(priceUsd) || priceUsd < 1) {
      return NextResponse.json({ error: "Enter a $ price of at least $1 (used if the customer pays with PayPal)." }, { status: 400 });
    }
    result = await adminApproveCustomRequest(params.id, {
      priceInr: Math.round(priceInr * 100) / 100,
      priceUsd: Math.round(priceUsd * 100) / 100,
      message,
    });
  } else if (body.action === "reject") {
    result = await adminRejectCustomRequest(params.id, message);
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const email = await sendCustomRequestDecisionEmail(result).catch(() => ({ sent: false as const }));
  return NextResponse.json({ request: result, emailSent: email.sent });
}
