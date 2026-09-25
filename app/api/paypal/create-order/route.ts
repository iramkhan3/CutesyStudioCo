import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/products";
import { getPaypalConfig, getPaypalAccessToken } from "@/lib/paypal";
import { createPendingOrder, attachPaypalOrderId } from "@/lib/orders";
import { calculateDiscount } from "@/lib/coupons";
import { getCoupons } from "@/lib/coupons-data";
import { calculateShippingUsd } from "@/lib/shipping";
import { getCustomProductTypes } from "@/lib/custom-types";
import { PHONE_CASE_CATEGORIES } from "@/lib/constants";
import type { CustomProductType } from "@/lib/constants";
import { firstImageUrl } from "@/lib/media";
import type { CustomCaseSelection, OrderItemSnapshot, ShippingAddress } from "@/lib/types";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?\d{1,3}[\s-]?)?\d{7,12}$/;
// India uses a strict 6-digit PIN (no leading 0) — checkable precisely.
// International postal codes vary too widely in format for a tight check.
const INDIA_PINCODE_RE = /^[1-9]\d{5}$/;
const GENERIC_POSTAL_CODE_RE = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/;
const NAME_RE = /^[\p{L}\p{M}\s.'-]{2,80}$/u;

function isValidPostalCode(value: string, country: string): boolean {
  return country === "India" ? INDIA_PINCODE_RE.test(value) : GENERIC_POSTAL_CODE_RE.test(value);
}

type RequestItem =
  | { kind: "product"; productId: string; quantity: number; phoneModel?: string }
  | { kind: "custom"; name: string; image: string; customization: CustomCaseSelection; quantity: number };

type RequestBody = {
  items?: RequestItem[];
  couponCode?: string | null;
  customer?: { name: string; email: string; phone: string };
  shippingAddress?: ShippingAddress;
};

// Kept in sync with app/api/create-order/route.ts's isValidCustomization —
// same validation rules, just re-declared here so this route doesn't depend
// on the Razorpay route module.
function isValidCustomization(c: unknown, customTypes: CustomProductType[]): c is CustomCaseSelection {
  if (!c || typeof c !== "object") return false;
  const custom = c as CustomCaseSelection;
  const type = customTypes.find((t) => t.slug === custom.productType);
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
  const customTypes = await getCustomProductTypes();

  // --- basic input validation (identical to the Razorpay route) ---------
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
  if (
    !shippingAddress?.postalCode?.trim() ||
    !isValidPostalCode(shippingAddress.postalCode.trim(), shippingAddress.country.trim())
  ) {
    return NextResponse.json({ error: "Please provide a valid postal code." }, { status: 400 });
  }
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return NextResponse.json({ error: "Invalid item in cart." }, { status: 400 });
    }
    if (item.kind === "product" && !item.productId) {
      return NextResponse.json({ error: "Invalid item in cart." }, { status: 400 });
    }
    if (item.kind === "custom" && !isValidCustomization(item.customization, customTypes)) {
      return NextResponse.json({ error: "Your custom case is missing some details." }, { status: 400 });
    }
  }

  // --- authoritative USD pricing/stock from the database, never the client --
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
      // price_usd is a newer column — if Supabase hasn't had the latest
      // supabase/schema.sql re-run yet, a product row may be missing it
      // (undefined, not 0). Fail closed with a friendly message rather than
      // silently charging $0 or NaN.
      if (!product.price_usd || product.price_usd <= 0) {
        return NextResponse.json(
          { error: "PayPal checkout isn't fully configured yet — please contact us directly and we'll sort it out." },
          { status: 503 }
        );
      }
      if (PHONE_CASE_CATEGORIES.includes(product.category) && !item.phoneModel?.trim()) {
        return NextResponse.json(
          { error: `Please select a phone model for "${product.name}".` },
          { status: 400 }
        );
      }
      orderItems.push({
        kind: "product",
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: firstImageUrl(product.images) ?? "",
        unitPriceInr: product.price_usd,
        quantity: item.quantity,
        phoneModel: item.phoneModel?.trim() || undefined,
      });
    } else {
      const type = customTypes.find((t) => t.slug === item.customization.productType)!;
      const unitPriceUsd =
        item.customization.mode === "surprise" ? type.surprise.priceUsd : type.build.priceUsd;
      orderItems.push({
        kind: "custom",
        name: item.name,
        image: item.image,
        unitPriceInr: unitPriceUsd,
        quantity: item.quantity,
        customization: item.customization,
      });
    }
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.unitPriceInr * i.quantity, 0);

  // --- coupon (authoritative — recomputed here, never trusts a client amount) --
  // calculateDiscount() is pure percentage math against whatever amount is
  // passed in, so it works fine against a USD subtotal too. The one caveat:
  // CUTEJOY30's minPurchaseInr (₹500) is an INR-denominated threshold and
  // isn't converted here — a manually-entered coupon's minimum purchase gate
  // may behave oddly for USD orders.
  //
  // Auto-applied coupons (currently the LAUNCH50 launch offer) are excluded
  // entirely for PayPal/USD orders — that promo is a domestic (INR) launch
  // incentive only, not meant for international buyers. Filtering it out of
  // the list passed to calculateDiscount blocks both the auto-apply and a
  // customer manually typing the same code.
  const coupons = (await getCoupons()).filter((c) => !c.autoApply);
  const { discount, coupon, error: couponError } = calculateDiscount(subtotal, couponCode, coupons);
  if (couponCode && couponCode.trim() && !coupon) {
    return NextResponse.json({ error: couponError || "That coupon code isn't valid." }, { status: 400 });
  }

  const payableAmount = Math.max(0, subtotal - discount);
  const shippingAmount = calculateShippingUsd(payableAmount, shippingAddress.country);
  const totalAmount = payableAmount + shippingAmount;

  if (totalAmount < 1) {
    return NextResponse.json({ error: "Order total is below the minimum payable amount." }, { status: 400 });
  }

  // --- backend readiness checks ------------------------------------------
  const paypalConfig = getPaypalConfig();
  if (!paypalConfig) {
    return NextResponse.json(
      { error: "PayPal checkout isn't fully configured yet — please contact us directly and we'll sort it out." },
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
    currency: "USD",
    paymentProvider: "paypal",
  });

  if (!order) {
    return NextResponse.json(
      { error: "PayPal checkout isn't fully configured yet — please contact us directly and we'll sort it out." },
      { status: 503 }
    );
  }

  const accessToken = await getPaypalAccessToken(paypalConfig);
  if (!accessToken) {
    return NextResponse.json({ error: "Payment provider error. Please try again shortly." }, { status: 500 });
  }

  try {
    const totalStr = totalAmount.toFixed(2);
    const paypalRes = await fetch(`${paypalConfig.apiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order.id,
            custom_id: order.id,
            amount: { currency_code: "USD", value: totalStr },
          },
        ],
      }),
    });

    if (!paypalRes.ok) {
      const errBody = await paypalRes.text();
      console.error("[paypal/create-order] PayPal API error:", paypalRes.status, errBody);
      return NextResponse.json({ error: "Payment provider error. Please try again shortly." }, { status: 500 });
    }

    const paypalOrder = (await paypalRes.json()) as { id: string };
    await attachPaypalOrderId(order.id, paypalOrder.id);

    return NextResponse.json({
      orderId: order.id,
      paypalOrderId: paypalOrder.id,
      amount: totalStr,
      currency: "USD",
    });
  } catch (err) {
    console.error("[paypal/create-order] error:", err);
    return NextResponse.json({ error: "Payment provider error. Please try again shortly." }, { status: 500 });
  }
}
