import { NextResponse } from "next/server";
import crypto from "crypto";
import { getOrderById, markOrderPaid, decrementStock } from "@/lib/orders";
import { markCustomRequestPaidForOrder } from "@/lib/custom-requests";
import { sendOrderConfirmationEmail, sendAdminNewOrderNotification } from "@/lib/email";

export const runtime = "nodejs";
// Give the background stock-decrement/email work below enough headroom that
// a slow Resend/Supabase call can't get killed mid-flight by the platform's
// default function timeout — that previously showed up as customers seeing a
// "couldn't confirm your payment" error for a payment that had, in fact,
// already been captured and marked paid.
export const maxDuration = 30;

type RequestBody = {
  orderId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ success: false, error: "Missing payment details." }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json(
      { success: false, error: "Payment verification isn't configured." },
      { status: 503 }
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expectedSignature, "utf8");
  const actualBuf = Buffer.from(razorpay_signature, "utf8");

  const isValid =
    expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);

  if (!isValid) {
    // Deliberately does NOT mark the order failed: anyone can call this
    // endpoint with a made-up signature, and that must never be able to
    // cancel a real customer's in-progress checkout. A genuinely abandoned
    // order is cleaned up by the stale-reservation release instead.
    return NextResponse.json({ success: false, error: "Signature verification failed." }, { status: 400 });
  }

  // The signature only proves Razorpay order <razorpay_order_id> was paid —
  // it must also be the Razorpay order we created for THIS order. Otherwise a
  // cheap paid order's signature could be replayed to mark a different,
  // pricier order as paid.
  const existing = await getOrderById(orderId);
  if (!existing || existing.payment_provider !== "razorpay" || existing.razorpay_order_id !== razorpay_order_id) {
    console.error("[verify-payment] razorpay_order_id doesn't belong to this order", { orderId, razorpay_order_id });
    return NextResponse.json({ success: false, error: "Payment doesn't match this order." }, { status: 400 });
  }

  const result = await markOrderPaid(orderId, razorpay_payment_id);
  if (!result) {
    return NextResponse.json({ success: false, error: "Could not update order status." }, { status: 503 });
  }
  const { order, alreadyPaid } = result;

  // If the Razorpay webhook already marked this order paid (e.g. this client
  // round trip is the slow/retried one), it already ran these side effects —
  // running them again would double-decrement stock and send duplicate emails.
  if (!alreadyPaid) {
    // Best-effort side effects — payment is already confirmed valid above, so
    // none of these should block (or fail) the success response to the
    // customer. Run them concurrently rather than one after another: adding a
    // Resend/Supabase round trip's latency three times over (instead of once)
    // is what let a single slow call risk exceeding the function's execution
    // time and taking the whole response down with it — a payment already
    // captured by Razorpay and marked paid in our DB then reads to the
    // customer as an outright failure.
    await Promise.allSettled([
      decrementStock(order).catch((err) =>
        console.error("[verify-payment] stock decrement failed:", err)
      ),
      markCustomRequestPaidForOrder(order.id).catch((err) =>
        console.error("[verify-payment] custom request update failed:", err)
      ),
      sendOrderConfirmationEmail(order).catch((err) =>
        console.error("[verify-payment] confirmation email failed:", err)
      ),
      sendAdminNewOrderNotification(order).catch((err) =>
        console.error("[verify-payment] admin notification email failed:", err)
      ),
    ]);
  }

  return NextResponse.json({ success: true, orderId: order.id });
}
