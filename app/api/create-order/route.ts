import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/products";
import { getRazorpayClient } from "@/lib/razorpay";
import { createPendingOrder, attachRazorpayOrderId } from "@/lib/orders";
import { calculateDiscount } from "@/lib/coupons";
import { calculateShipping } from "@/lib/shipping";
import { CUSTOM_PRODUCT_TYPES } from "@/lib/constants";
import type { CustomCaseSelection, OrderItemSnapshot, ShippingAddress } from "@/lib/types";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts an optional country code (+91, 91, 0) followed by a 10-digit
// Indian mobile number, or a generic 7-15 digit international number so we
// don't block legitimate international customers.
const PHONE_RE = /^(\+?\d{1,3}[\s-]?)?\d{7,12}$/;
const POSTAL_CODE_RE = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/;
const NAME_RE = /^[\p{L}\p{M}\s.'-]{2,80}$/u;

type RequestItem =
  | { kind: "product"; productId: string; quantity: number }
  | { kind: "custom"; name: string; image: string; customization: CustomCaseSelection; quantity: number };

type RequestBody = {
  items?: RequestItem[];
  couponCode?: string | null;
  customer?: { name: string; email: string; phone: string };
  shippingAddress?: ShippingAddress;
};

function isValidCustomization(c: unknown): c is CustomCaseSelection {
  if (!c || typeof c !== "object") return false;
  const custom = c as CustomCaseSelection;
  const type = CUSTOM_PRODUCT_TYPES.find((t) => t.slug === custom.productType);
  if (!type) return false;

  if (custom.mode === "surprise") {
    return (
      typeof custom.note === "string" &&
      custom.note.trim().length >= 20 &&
      custom.note.trim().length <= 500
    );
  }
  if (custom.mode === "build") {
    return (
      (!type.requiresPhoneModel || !!custom.phoneModel?.trim()) &&
      !!custom.theme?.trim() &&
      !!custom.style?.trim() &&
      !!custom.weight?.trim() &&
      !!custom.colour?.trim() &&
      typeof custom.note === "string" &&
      custom.note.length <= 500
    );
  }
  return false;
}

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { items, couponCode, customer, shippingAddress } = body;

  // --- basic input validation ------------------------------------------
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }
  if (!customer?.name?.trim() || !NAME_RE.test(customer.name.trim())) {
    return NextResponse.json({ error: "Please provide your full name." }, { status: 400 });
  }
  if (!customer?.email?.trim() || !EMAIL_RE.test(customer.email.trim())) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }
  if (!customer?.phone?.trim() || !PHONE_RE.test(customer.phone.trim())) {
    return NextResponse.json({ error: "Please provide a valid phone number." }, { status: 400 });
  }
  if (
    !shippingAddress?.line1?.trim() ||
    !shippingAddress?.city?.trim() ||
    !shippingAddress?.state?.trim() ||
    !shippingAddress?.country?.trim()
  ) {
    return NextResponse.json({ error: "Please complete your shipping address." }, { status: 400 });
  }
  if (!shippingAddress?.postalCode?.trim() || !POSTAL_CODE_RE.test(shippingAddress.postalCode.trim())) {
    return NextResponse.json({ error: "Please provide a valid postal code." }, { status: 400 });
  }
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return NextResponse.json({ error: "Invalid item in cart." }, { status: 400 });
    }
    if (item.kind === "product" && !item.productId) {
      return NextResponse.json({ error: "Invalid item in cart." }, { status: 400 });
    }
    if (item.kind === "custom" && !isValidCustomization(item.customization)) {
      return NextResponse.json({ error: "Your custom case is missing some details." }, { status: 400 });
    }
  }

  // --- authoritative pricing/stock from the database, never the client --
  const productIds = items.filter((i) => i.kind === "product").map((i) => i.productId);
  const products = productIds.length ? await getProductsByIds(productIds) : [];

  const orderItems: OrderItemSnapshot[] = [];
  for (const item of items) {
    if (item.kind === "product") {
      const product = products.find((p) => p.id === item.productId);
      if (!product || !product.active) {
        return NextResponse.json({ error: "One of the items in your cart is no longer available." }, { status: 400 });
      }
      if (item.quantity > product.stock_quantity) {
        return NextResponse.json(
          { error: `Sorry, only ${product.stock_quantity} left of "${product.name}".` },
          { status: 400 }
        );
      }
      orderItems.push({
        kind: "product",
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        unitPriceInr: product.price_inr,
        quantity: item.quantity,
      });
    } else {
      // Custom item pricing is fixed by product type + mode — never trust a
      // client-sent price. isValidCustomization() above already confirmed
      // productType matches a known type, so this lookup can't miss.
      const type = CUSTOM_PRODUCT_TYPES.find((t) => t.slug === item.customization.productType)!;
      const unitPriceInr =
        item.customization.mode === "surprise" ? type.surprise.priceInr : type.build.priceInr;
      orderItems.push({
        kind: "custom",
        name: item.name,
        image: item.image,
        unitPriceInr,
        quantity: item.quantity,
        customization: item.customization,
      });
    }
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.unitPriceInr * i.quantity, 0);

  // --- coupon (authoritative — recomputed here, never trusts a client amount) --
  const { discount, coupon, error: couponError } = calculateDiscount(subtotal, couponCode);
  if (couponCode && couponCode.trim() && !coupon) {
    return NextResponse.json({ error: couponError || "That coupon code isn't valid." }, { status: 400 });
  }

  const payableAmount = Math.max(0, subtotal - discount);
  const shippingAmount = calculateShipping(payableAmount, shippingAddress.country);
  const totalAmount = payableAmount + shippingAmount;

  const amountInPaise = Math.round(totalAmount * 100);
  if (amountInPaise < 100) {
    return NextResponse.json({ error: "Order total is below the minimum payable amount." }, { status: 400 });
  }

  // --- backend readiness checks ------------------------------------------
  const razorpay = getRazorpayClient();
  if (!razorpay) {
    return NextResponse.json(
      { error: "Direct checkout isn't fully configured yet — please contact us directly and we'll sort it out." },
      { status: 503 }
    );
  }

  const order = await createPendingOrder({
    customerName: customer.name.trim(),
    email: customer.email.trim(),
    phone: customer.phone.trim(),
    shippingAddress,
    items: orderItems,
    subtotal,
    couponCode: coupon?.code ?? null,
    discountAmount: discount,
    shippingAmount,
    totalAmount,
  });

  if (!order) {
    return NextResponse.json(
      { error: "Direct checkout isn't fully configured yet — please contact us directly and we'll sort it out." },
      { status: 503 }
    );
  }

  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order.id,
    });

    await attachRazorpayOrderId(order.id, razorpayOrder.id);

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[create-order] Razorpay error:", err);
    return NextResponse.json({ error: "Payment provider error. Please try again shortly." }, { status: 500 });
  }
}
