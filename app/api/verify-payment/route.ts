import { NextResponse } from "next/server";
import crypto from "crypto";
import { markOrderFailed, markOrderPaid, decrementStock } from "@/lib/orders";
import { sendOrderConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";

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
    await markOrderFailed(orderId);
    return NextResponse.json({ success: false, error: "Signature verification failed." }, { status: 400 });
  }

  const order = await markOrderPaid(orderId, razorpay_payment_id);
  if (!order) {
    return NextResponse.json({ success: false, error: "Could not update order status." }, { status: 503 });
  }

  // Best-effort side effects — payment is already confirmed valid above, so
  // neither of these should block the success response to the customer.
  await decrementStock(order.items).catch((err) =>
    console.error("[verify-payment] stock decrement failed:", err)
  );
  await sendOrderConfirmationEmail(order).catch((err) =>
    console.error("[verify-payment] confirmation email failed:", err)
  );

  return NextResponse.json({ success: true, orderId: order.id });
}
