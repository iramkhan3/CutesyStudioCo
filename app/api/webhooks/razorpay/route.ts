import { NextResponse } from "next/server";
import crypto from "crypto";
import { getOrderByRazorpayOrderId, markOrderPaid, decrementStock } from "@/lib/orders";
import { sendOrderConfirmationEmail, sendAdminNewOrderNotification } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const maxDuration = 30;

/**
 * Backstop for app/api/verify-payment: that route only ever runs if the
 * customer's browser successfully completes the post-payment round trip
 * after Razorpay's checkout popup closes. A closed tab, a dropped mobile
 * connection, or a function timeout on our side means Razorpay has captured
 * the money but our DB never finds out — the customer sees an error despite
 * having paid, and no confirmation/admin emails go out. Razorpay's own
 * server-to-server webhook doesn't depend on the customer's browser at all,
 * so it catches every case the client round trip can miss.
 *
 * Configure this in Razorpay Dashboard → Settings → Webhooks: URL
 * `<site>/api/webhooks/razorpay`, event `payment.captured`, and set the
 * webhook secret you choose there as RAZORPAY_WEBHOOK_SECRET here.
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    // Not configured yet — ack with 200 so Razorpay doesn't retry forever,
    // but log loudly since this means the safety net isn't active.
    console.error("[webhooks/razorpay] RAZORPAY_WEBHOOK_SECRET isn't set — ignoring webhook.");
    return NextResponse.json({ ok: true });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expectedSignature, "utf8");
  const actualBuf = Buffer.from(signature, "utf8");
  const isValid = expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (event.event !== "payment.captured") {
    // Other event types (payment.failed, order.paid, refund.*, ...) aren't
    // needed for this flow — ack so Razorpay stops retrying.
    return NextResponse.json({ ok: true });
  }

  const payment = event.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id;
  const razorpayPaymentId = payment?.id;
  if (!razorpayOrderId || !razorpayPaymentId) {
    return NextResponse.json({ error: "Malformed payment.captured payload." }, { status: 400 });
  }

  const order = await getOrderByRazorpayOrderId(razorpayOrderId);
  if (!order) {
    // Genuinely nothing we can do with this — ack anyway so Razorpay doesn't
    // keep retrying a payment we have no matching order for.
    console.error(`[webhooks/razorpay] No order found for Razorpay order ${razorpayOrderId}.`);
    return NextResponse.json({ ok: true });
  }

  const result = await markOrderPaid(order.id, razorpayPaymentId);
  if (!result) {
    // Transient DB issue — return 500 so Razorpay retries the webhook later.
    return NextResponse.json({ error: "Could not update order status." }, { status: 500 });
  }

  // If app/api/verify-payment's client round trip already handled this
  // payment, its side effects already ran — don't double them here.
  if (!result.alreadyPaid) {
    await Promise.allSettled([
      decrementStock(result.order.items).catch((err) =>
        console.error("[webhooks/razorpay] stock decrement failed:", err)
      ),
      sendOrderConfirmationEmail(result.order).catch((err) =>
        console.error("[webhooks/razorpay] confirmation email failed:", err)
      ),
      sendAdminNewOrderNotification(result.order).catch((err) =>
        console.error("[webhooks/razorpay] admin notification email failed:", err)
      ),
    ]);
  }

  return NextResponse.json({ ok: true });
}
