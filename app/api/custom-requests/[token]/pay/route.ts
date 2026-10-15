import { NextResponse } from "next/server";
import { getRazorpayClient } from "@/lib/razorpay";
import { getPaypalAccessToken, getPaypalConfig } from "@/lib/paypal";
import { attachPaypalOrderId, attachRazorpayOrderId, createPendingOrder, markOrderFailed } from "@/lib/orders";
import { attachOrderToCustomRequest, categoryName, getCustomRequestByToken } from "@/lib/custom-requests";
import { calculateShipping, calculateShippingUsd } from "@/lib/shipping";
import { getStoreSettings } from "@/lib/settings";
import { calculateDiscount } from "@/lib/coupons";
import { getCoupons } from "@/lib/coupons-data";
import type { OrderItemSnapshot, ShippingAddress } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

const INDIA_PINCODE_RE = /^[1-9]\d{5}$/;
const GENERIC_POSTAL_CODE_RE = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/;

type Body = { provider?: unknown; shippingAddress?: Partial<ShippingAddress>; couponCode?: unknown };

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Starts payment for an APPROVED custom request: creates a normal pending
 * order priced from the maker's quote (never from the client) + standard
 * shipping for the address (minus an optional coupon the customer types —
 * never an auto-applied one, since the quote is already a personal price),
 * then a Razorpay or PayPal order for it. The
 * response matches /api/create-order and /api/paypal/create-order, so the
 * existing /api/verify-payment and /api/paypal/capture-order finish the job
 * (and they mark the request paid via markCustomRequestPaidForOrder).
 */
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const request = await getCustomRequestByToken(params.token);
  if (!request) return NextResponse.json({ error: "We couldn't find this request." }, { status: 404 });
  if (request.status === "paid") return NextResponse.json({ error: "This request has already been paid. Thank you!" }, { status: 409 });
  if (request.status !== "approved" || request.quoted_price_inr == null) {
    return NextResponse.json({ error: "This request isn't ready for payment." }, { status: 409 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const provider = body.provider === "paypal" ? "paypal" : body.provider === "razorpay" ? "razorpay" : null;
  if (!provider) return NextResponse.json({ error: "Please choose a payment method." }, { status: 400 });

  const a = body.shippingAddress ?? {};
  const shippingAddress: ShippingAddress = {
    line1: (a.line1 ?? "").trim(),
    line2: (a.line2 ?? "").trim() || undefined,
    city: (a.city ?? "").trim(),
    state: (a.state ?? "").trim(),
    postalCode: (a.postalCode ?? "").trim(),
    country: (a.country ?? "").trim(),
  };
  if (!shippingAddress.line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.country) {
    return NextResponse.json({ error: "Please complete your shipping address." }, { status: 400 });
  }
  const postalOk =
    shippingAddress.country === "India"
      ? INDIA_PINCODE_RE.test(shippingAddress.postalCode)
      : GENERIC_POSTAL_CODE_RE.test(shippingAddress.postalCode);
  if (!postalOk) return NextResponse.json({ error: "Please provide a valid postal code." }, { status: 400 });

  const isUsd = provider === "paypal";
  if (isUsd && (request.quoted_price_usd == null || request.quoted_price_usd <= 0)) {
    return NextResponse.json({ error: "PayPal isn't available for this request — please pay in ₹ instead." }, { status: 400 });
  }

  const subtotal = isUsd ? request.quoted_price_usd! : request.quoted_price_inr;
  const couponCode = typeof body.couponCode === "string" ? body.couponCode.trim().slice(0, 40) : "";
  const [allCoupons, { shipping: shippingConfig }] = await Promise.all([getCoupons(), getStoreSettings()]);
  const { discount, coupon, error: couponError } = calculateDiscount(
    subtotal,
    couponCode || null,
    allCoupons.filter((c) => !c.autoApply),
    isUsd ? subtotal * shippingConfig.usdInrRate : subtotal
  );
  if (couponCode && !coupon) {
    return NextResponse.json({ error: couponError || "That coupon code isn't valid." }, { status: 400 });
  }
  const payable = round2(Math.max(0, subtotal - discount));
  const shipping = isUsd
    ? calculateShippingUsd(payable, shippingAddress.country, coupon, shippingConfig)
    : calculateShipping(payable, shippingAddress.country, coupon, shippingConfig);
  const total = round2(payable + shipping);
  // Razorpay's minimum is ₹1; keep PayPal at $1 too.
  if (total < 1) {
    return NextResponse.json({ error: "Order total is below the minimum payable amount." }, { status: 400 });
  }

  const item: OrderItemSnapshot = {
    kind: "custom",
    name: `Custom ${await categoryName(request.category)}${request.quantity > 1 ? ` × ${request.quantity}` : ""} (request #${request.id.slice(0, 8)})`,
    image: "/products/real/charms-in-hand.jpg",
    unitPriceInr: subtotal,
    quantity: 1,
    customization: {
      mode: "request",
      productType: request.category,
      phoneModel: request.device_model ?? undefined,
      note: request.notes,
    },
  };

  const razorpay = isUsd ? null : getRazorpayClient();
  const paypalConfig = isUsd ? getPaypalConfig() : null;
  if (!isUsd && !razorpay) return NextResponse.json({ error: "Payments aren't configured yet — please contact us." }, { status: 503 });
  if (isUsd && !paypalConfig) return NextResponse.json({ error: "PayPal isn't configured yet — please contact us." }, { status: 503 });

  const order = await createPendingOrder({
    customerName: request.customer_name,
    email: request.email,
    phone: request.phone,
    shippingAddress,
    items: [item],
    subtotal,
    couponCode: coupon?.code ?? null,
    discountAmount: discount,
    shippingAmount: shipping,
    totalAmount: total,
    currency: isUsd ? "USD" : "INR",
    paymentProvider: provider,
  });
  if (!order) return NextResponse.json({ error: "We couldn't start your payment — please try again." }, { status: 503 });

  await attachOrderToCustomRequest(request.id, order.id);

  try {
    if (!isUsd) {
      const amount = Math.round(total * 100);
      const rzpOrder = await razorpay!.orders.create({ amount, currency: "INR", receipt: order.id });
      await attachRazorpayOrderId(order.id, rzpOrder.id);
      return NextResponse.json({
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        amount,
        currency: "INR",
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      });
    }

    const accessToken = await getPaypalAccessToken(paypalConfig!);
    if (!accessToken) throw new Error("PayPal auth failed");
    const totalStr = total.toFixed(2);
    const paypalRes = await fetch(`${paypalConfig!.apiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ reference_id: order.id, custom_id: order.id, amount: { currency_code: "USD", value: totalStr } }],
      }),
    });
    if (!paypalRes.ok) throw new Error(`PayPal ${paypalRes.status}: ${await paypalRes.text()}`);
    const paypalOrder = (await paypalRes.json()) as { id: string };
    await attachPaypalOrderId(order.id, paypalOrder.id);
    return NextResponse.json({ orderId: order.id, paypalOrderId: paypalOrder.id, amount: totalStr, currency: "USD" });
  } catch (err) {
    console.error("[custom-requests/pay] provider error:", err);
    await markOrderFailed(order.id).catch(() => {});
    return NextResponse.json({ error: "Payment provider error. Please try again shortly." }, { status: 500 });
  }
}
