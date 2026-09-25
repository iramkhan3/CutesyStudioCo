import { NextResponse } from "next/server";
import { getOrderById, updateOrderFulfillment } from "@/lib/orders";
import { sendOrderShippedEmail, sendOrderDeliveredEmail, sendOrderCancelledEmail } from "@/lib/email";
import type { FulfillmentStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

const VALID_STATUSES: FulfillmentStatus[] = ["unfulfilled", "shipped", "delivered", "cancelled"];
const MAX_FREE_TEXT_LEN = 300;
const MAX_NOTES_LEN = 2000;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ order });
}

type PatchBody = {
  fulfillment_status?: unknown;
  tracking_number?: unknown;
  courier?: unknown;
  admin_notes?: unknown;
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const updates: {
    fulfillment_status?: FulfillmentStatus;
    tracking_number?: string | null;
    courier?: string | null;
    admin_notes?: string | null;
  } = {};

  if (body.fulfillment_status !== undefined) {
    if (typeof body.fulfillment_status !== "string" || !VALID_STATUSES.includes(body.fulfillment_status as FulfillmentStatus)) {
      return NextResponse.json({ error: "Invalid fulfillment status." }, { status: 400 });
    }
    updates.fulfillment_status = body.fulfillment_status as FulfillmentStatus;
  }

  for (const [key, maxLen] of [
    ["tracking_number", MAX_FREE_TEXT_LEN],
    ["courier", MAX_FREE_TEXT_LEN],
    ["admin_notes", MAX_NOTES_LEN],
  ] as const) {
    const value = body[key];
    if (value === undefined) continue;
    if (value !== null && typeof value !== "string") {
      return NextResponse.json({ error: `Invalid ${key.replace("_", " ")}.` }, { status: 400 });
    }
    if (typeof value === "string" && value.length > maxLen) {
      return NextResponse.json({ error: `${key.replace("_", " ")} is too long (max ${maxLen} characters).` }, { status: 400 });
    }
    updates[key] = typeof value === "string" ? value.trim() || null : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  // Fetched before the update so we can tell whether fulfillment_status
  // actually changed — only send a shipped/delivered/cancelled email on a
  // real transition, never on every save (e.g. just editing admin notes).
  const previousOrder = await getOrderById(params.id);

  const order = await updateOrderFulfillment(params.id, updates);
  if (!order) {
    return NextResponse.json(
      {
        error:
          "Couldn't update this order — it may not exist, or the database migration for order tracking hasn't been run yet (re-run supabase/schema.sql).",
      },
      { status: 400 }
    );
  }

  if (updates.fulfillment_status && previousOrder && previousOrder.fulfillment_status !== order.fulfillment_status) {
    if (order.fulfillment_status === "shipped") {
      await sendOrderShippedEmail(order).catch((err) => console.error("[admin/orders] shipped email failed:", err));
    } else if (order.fulfillment_status === "delivered") {
      await sendOrderDeliveredEmail(order).catch((err) => console.error("[admin/orders] delivered email failed:", err));
    } else if (order.fulfillment_status === "cancelled") {
      await sendOrderCancelledEmail(order).catch((err) => console.error("[admin/orders] cancelled email failed:", err));
    }
  }

  return NextResponse.json({ order });
}
