import { NextResponse } from "next/server";
import { getPaypalConfig, getPaypalAccessToken } from "@/lib/paypal";
import { getOrderById, markOrderFailed, markOrderPaidPaypal, decrementStock } from "@/lib/orders";
import { sendOrderConfirmationEmail, sendAdminNewOrderNotification } from "@/lib/email";

export const runtime = "nodejs";

type RequestBody = {
  orderId?: string;
  paypalOrderId?: string;
};

type PaypalCaptureResponse = {
  status?: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
      }>;
    };
  }>;
};

// A cent of rounding slack for float/string comparisons between our
// server-computed total and what PayPal reports back.
const AMOUNT_TOLERANCE = 0.01;

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const { orderId, paypalOrderId } = body;
  if (!orderId || !paypalOrderId) {
    return NextResponse.json({ success: false, error: "Missing payment details." }, { status: 400 });
  }

  const paypalConfig = getPaypalConfig();
  if (!paypalConfig) {
    return NextResponse.json(
      { success: false, error: "Payment verification isn't configured." },
      { status: 503 }
    );
  }

  // --- load OUR pending order and sanity-check it before trusting anything --
  const order = await getOrderById(orderId);
  if (!order || order.payment_provider !== "paypal") {
    return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
  }
  if (order.payment_status === "paid") {
    // Already captured (e.g. a duplicate onApprove call) — treat as success,
    // don't double-decrement stock or double-send the confirmation email.
    return NextResponse.json({ success: true, orderId: order.id });
  }
  if (order.payment_status !== "pending") {
    return NextResponse.json({ success: false, error: "This order can no longer be paid." }, { status: 400 });
  }

  const accessToken = await getPaypalAccessToken(paypalConfig);
  if (!accessToken) {
    return NextResponse.json({ success: false, error: "Payment provider error. Please try again shortly." }, { status: 500 });
  }

  try {
    const captureRes = await fetch(
      `${paypalConfig.apiBase}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const captureData = (await captureRes.json()) as PaypalCaptureResponse;

    if (!captureRes.ok) {
      console.error("[paypal/capture-order] PayPal API error:", captureRes.status, captureData);
      await markOrderFailed(orderId);
      return NextResponse.json({ success: false, error: "Payment could not be captured." }, { status: 400 });
    }

    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];

    // --- re-verify the captured amount server-side against the DB-computed
    // order total, before ever marking the order paid — same principle as
    // the Razorpay HMAC signature check: never trust the client, and here,
    // don't even trust that "PayPal said OK" alone is enough without
    // confirming the amount/currency actually match what we expected to
    // charge for this exact order.
    const capturedAmount = capture ? parseFloat(capture.amount.value) : NaN;
    const amountMatches =
      capture &&
      captureData.status === "COMPLETED" &&
      capture.status === "COMPLETED" &&
      capture.amount.currency_code === order.currency &&
      Math.abs(capturedAmount - order.total_amount) <= AMOUNT_TOLERANCE;

    if (!amountMatches) {
      console.error("[paypal/capture-order] amount/status mismatch", {
        orderId,
        expected: order.total_amount,
        expectedCurrency: order.currency,
        capture,
        topLevelStatus: captureData.status,
      });
      await markOrderFailed(orderId);
      return NextResponse.json(
        { success: false, error: "We couldn't verify your payment amount. Please contact us." },
        { status: 400 }
      );
    }

    const paidOrder = await markOrderPaidPaypal(orderId, capture.id);
    if (!paidOrder) {
      return NextResponse.json({ success: false, error: "Could not update order status." }, { status: 503 });
    }

    // Best-effort side effects — payment is already confirmed valid above,
    // so neither of these should block the success response to the customer.
    await decrementStock(paidOrder.items).catch((err) =>
      console.error("[paypal/capture-order] stock decrement failed:", err)
    );
    await sendOrderConfirmationEmail(paidOrder).catch((err) =>
      console.error("[paypal/capture-order] confirmation email failed:", err)
    );
    await sendAdminNewOrderNotification(paidOrder).catch((err) =>
      console.error("[paypal/capture-order] admin notification email failed:", err)
    );

    return NextResponse.json({ success: true, orderId: paidOrder.id });
  } catch (err) {
    console.error("[paypal/capture-order] error:", err);
    await markOrderFailed(orderId).catch(() => {});
    return NextResponse.json({ success: false, error: "Payment provider error. Please try again shortly." }, { status: 500 });
  }
}
