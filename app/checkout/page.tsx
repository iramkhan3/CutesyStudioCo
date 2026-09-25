"use client";

import { useRef, useState, type FormEvent } from "react";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useCartStore, cartSubtotalInr } from "@/lib/store/cart";
import { calculateDiscount } from "@/lib/coupons";
import { useCoupons } from "@/lib/hooks/useCoupons";
import { calculateShipping } from "@/lib/shipping";
import { COUNTRIES, CUSTOM_ORDER_TIMELINE_NOTE, PHONE_CASE_CATEGORIES, PHONE_MODELS, SITE } from "@/lib/constants";
import { formatUsdApprox } from "@/lib/pricing";
import { GiftIcon, SparkleIcon, WandIcon } from "@/components/Icons";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

type PaymentMethod = "razorpay" | "paypal";

type FormState = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

const NAME_RE = /^[\p{L}\p{M}\s.'-]{2,80}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?\d{1,3}[\s-]?)?\d{7,12}$/;
// India uses a strict 6-digit PIN (first digit 1-9, no leading zero) — that's
// checkable precisely, unlike international postal codes which vary too
// widely in format to validate tightly, so those just get a loose sanity check.
const INDIA_PINCODE_RE = /^[1-9]\d{5}$/;
const GENERIC_POSTAL_CODE_RE = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/;

function validatePostalCode(value: string, country: string): string | null {
  const trimmed = value.trim();
  if (country === "India") {
    return INDIA_PINCODE_RE.test(trimmed) ? null : "Enter a valid 6-digit PIN code (no leading 0).";
  }
  return GENERIC_POSTAL_CODE_RE.test(trimmed) ? null : "Enter a valid postal code.";
}

function validateField(key: keyof FormState, value: string, country: string): string | null {
  switch (key) {
    case "name":
      return NAME_RE.test(value.trim()) ? null : "Enter your full name.";
    case "email":
      return EMAIL_RE.test(value.trim()) ? null : "Enter a valid email address.";
    case "phone":
      return PHONE_RE.test(value.trim()) ? null : "Enter a valid phone number.";
    case "postalCode":
      return validatePostalCode(value, country);
    case "line1":
      return value.trim().length >= 4 ? null : "Enter your street address.";
    case "city":
      return value.trim().length >= 2 ? null : "Enter your city.";
    case "state":
      return value.trim().length >= 2 ? null : "Enter your state or province.";
    case "country":
      return value.trim() ? null : "Select your country.";
    default:
      return null;
  }
}

function validateForm(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  (Object.keys(form) as (keyof FormState)[]).forEach((key) => {
    if (key === "line2") return;
    const message = validateField(key, form[key], form.country);
    if (message) errors[key] = message;
  });
  return errors;
}

const PHONE_OTHER = "My phone isn't listed (type below)";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const clearCart = useCartStore((s) => s.clearCart);
  const updateItemPhoneModel = useCartStore((s) => s.updateItemPhoneModel);
  const router = useRouter();
  const [phoneModelTouched, setPhoneModelTouched] = useState<Set<string>>(new Set());

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [countrySelect, setCountrySelect] = useState("");
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  // PayPalButtons' createOrder must return the PayPal order id (a string) —
  // our own internal order id (needed later, in onApprove, to call
  // /api/paypal/capture-order and to build the confirmation-page link) is
  // stashed here instead of in state, since it's only ever read synchronously
  // within the same button click's callback chain.
  const pendingOrderIdRef = useRef<string | null>(null);

  const fieldErrors = validateForm(form);
  const hasErrors = Object.keys(fieldErrors).length > 0;

  function markTouched(key: keyof FormState) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  const coupons = useCoupons();
  // The LAUNCH50 launch offer (auto-applied, no code needed) is a domestic
  // INR incentive only — app/api/paypal/create-order excludes it server-side
  // for PayPal orders, so it's excluded here too, otherwise this preview
  // would show a discount that PayPal checkout won't actually give.
  const effectiveCoupons = paymentMethod === "paypal" ? coupons.filter((c) => !c.autoApply) : coupons;
  const subtotalInr = cartSubtotalInr(items);
  const { discount, coupon } = calculateDiscount(subtotalInr, couponCode, effectiveCoupons);
  const payableInr = Math.max(0, subtotalInr - discount);
  const shippingInr = calculateShipping(payableInr, form.country);
  const totalInr = payableInr + shippingInr;
  const hasCustomItem = items.some((i) => i.kind === "custom");
  const isInternational = !!form.country && form.country !== "India";
  const itemsNeedingPhoneModel = items.filter(
    (i): i is Extract<typeof i, { kind: "product" }> =>
      i.kind === "product" && PHONE_CASE_CATEGORIES.includes(i.category)
  );
  const missingPhoneModelIds = itemsNeedingPhoneModel.filter((i) => !i.phoneModel?.trim()).map((i) => i.id);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Shared payload builder — both /api/create-order (Razorpay) and
  // /api/paypal/create-order accept the exact same shape.
  function buildOrderPayload() {
    return {
      items: items.map((i) =>
        i.kind === "product"
          ? { kind: "product", productId: i.productId, quantity: i.quantity, phoneModel: i.phoneModel || undefined }
          : {
              kind: "custom",
              name: i.name,
              image: i.image,
              customization: i.customization,
              quantity: i.quantity,
            }
      ),
      couponCode,
      customer: { name: form.name, email: form.email, phone: form.phone },
      shippingAddress: {
        line1: form.line1,
        line2: form.line2 || undefined,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
      },
    };
  }

  // Shared pre-payment validation for both payment methods — returns false
  // (and surfaces the error/touched-field state) if the form or cart isn't
  // ready to submit.
  function validateBeforePayment(): boolean {
    setError(null);
    if (hasErrors) {
      setTouched({
        name: true,
        email: true,
        phone: true,
        line1: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      });
      setError("Please fix the highlighted fields before continuing.");
      return false;
    }
    if (items.length === 0) {
      setError("Your cart is empty.");
      return false;
    }
    if (missingPhoneModelIds.length > 0) {
      setPhoneModelTouched(new Set(missingPhoneModelIds));
      setError("Please select a phone model for every phone case in your cart.");
      return false;
    }
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!validateBeforePayment()) return;
    if (!scriptReady) {
      setError("Payment is still loading — please try again in a second.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildOrderPayload()),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong creating your order. Please try again.");
        setLoading(false);
        return;
      }

      const { orderId, razorpayOrderId, amount, currency, keyId } = data;

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: SITE.name,
        description: "Handmade decoden order",
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#D291BC" },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              setError(
                "We couldn't confirm your payment automatically. If money was deducted, please contact us with your order number."
              );
              setLoading(false);
              return;
            }
            clearCart();
            router.push(`/order-confirmation?orderId=${orderId}`);
          } catch {
            setError("We couldn't confirm your payment. Please contact us if you were charged.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.on("payment.failed", () => {
        setError("Payment failed or was declined. Please try again.");
        setLoading(false);
      });

      rzp.open();
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setLoading(false);
    }
  }

  // PayPalButtons calls this on click and expects the PayPal order id back
  // (a string) — our own order id is stashed in pendingOrderIdRef for
  // onApprove to use afterwards. Throwing aborts the PayPal flow, which is
  // exactly what we want on a validation or server error.
  async function handlePaypalCreateOrder(): Promise<string> {
    if (!validateBeforePayment()) {
      throw new Error("Checkout form isn't valid yet.");
    }
    setLoading(true);
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildOrderPayload()),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong creating your order. Please try again.");
      setLoading(false);
      throw new Error(data.error || "Failed to create PayPal order.");
    }
    pendingOrderIdRef.current = data.orderId;
    return data.paypalOrderId as string;
  }

  async function handlePaypalApprove(data: { orderID: string }) {
    const orderId = pendingOrderIdRef.current;
    if (!orderId) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }
    try {
      const captureRes = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paypalOrderId: data.orderID }),
      });
      const captureData = await captureRes.json();
      if (!captureRes.ok || !captureData.success) {
        setError(
          "We couldn't confirm your payment automatically. If money was deducted, please contact us with your order number."
        );
        setLoading(false);
        return;
      }
      clearCart();
      router.push(`/order-confirmation?orderId=${orderId}`);
    } catch {
      setError("We couldn't confirm your payment. Please contact us if you were charged.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <SparkleIcon className="h-10 w-10 text-lavender-dark" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-ink">Your cart is empty</h1>
        <p className="mt-2 text-ink/60">Add something cute before checking out.</p>
        <Link href="/shop" className="btn-primary mt-6">
          Browse the Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />

      <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">Checkout</h1>

      {hasCustomItem && (
        <div className="mt-6 flex items-start gap-3 rounded-xl2 border-2 border-pastel-dark/20 bg-pastel-dark/10 p-4 text-sm text-ink/80">
          <span className="text-lg leading-none">🎀</span>
          <p>{CUSTOM_ORDER_TIMELINE_NOTE}</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={handleSubmit} className="card space-y-5 p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Shipping Details</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full Name"
              required
              value={form.name}
              onChange={(v) => update("name", v)}
              onBlur={() => markTouched("name")}
              error={touched.name ? fieldErrors.name : undefined}
            />
            <Field
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(v) => update("email", v)}
              onBlur={() => markTouched("email")}
              error={touched.email ? fieldErrors.email : undefined}
            />
          </div>
          <Field
            label="Phone"
            required
            value={form.phone}
            onChange={(v) => update("phone", v)}
            onBlur={() => markTouched("phone")}
            error={touched.phone ? fieldErrors.phone : undefined}
          />
          <Field
            label="Address Line 1"
            required
            value={form.line1}
            onChange={(v) => update("line1", v)}
            onBlur={() => markTouched("line1")}
            error={touched.line1 ? fieldErrors.line1 : undefined}
          />
          <Field label="Address Line 2 (optional)" value={form.line2} onChange={(v) => update("line2", v)} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="City"
              required
              value={form.city}
              onChange={(v) => update("city", v)}
              onBlur={() => markTouched("city")}
              error={touched.city ? fieldErrors.city : undefined}
            />
            <Field
              label="State / Province"
              required
              value={form.state}
              onChange={(v) => update("state", v)}
              onBlur={() => markTouched("state")}
              error={touched.state ? fieldErrors.state : undefined}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Postal Code"
              required
              value={form.postalCode}
              onChange={(v) => update("postalCode", v)}
              onBlur={() => markTouched("postalCode")}
              error={touched.postalCode ? fieldErrors.postalCode : undefined}
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Country</span>
              <select
                required
                value={countrySelect}
                onChange={(e) => {
                  setCountrySelect(e.target.value);
                  update("country", e.target.value === "Other" ? "" : e.target.value);
                }}
                onBlur={() => markTouched("country")}
                className="w-full rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-pastel focus:outline-none"
              >
                <option value="" disabled>
                  Select country
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {countrySelect === "Other" && (
                <input
                  type="text"
                  required
                  placeholder="Type your country"
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  onBlur={() => markTouched("country")}
                  className="mt-2 w-full rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-pastel focus:outline-none"
                />
              )}
              {touched.country && fieldErrors.country && (
                <p className="mt-1 text-xs text-pastel-dark">{fieldErrors.country}</p>
              )}
            </label>
          </div>

          <div>
            <span className="mb-2 block font-heading text-sm font-semibold text-ink/70">
              Payment Method
            </span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setPaymentMethod("razorpay")}
                className={`card flex-1 p-4 text-left transition-transform hover:-translate-y-0.5 ${
                  paymentMethod === "razorpay" ? "ring-2 ring-pastel" : ""
                }`}
              >
                <span className="block font-heading text-sm font-semibold text-ink">
                  Card / UPI / Netbanking
                </span>
                <span className="block text-xs text-ink/60">via Razorpay</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("paypal")}
                className={`card flex-1 p-4 text-left transition-transform hover:-translate-y-0.5 ${
                  paymentMethod === "paypal" ? "ring-2 ring-pastel" : ""
                }`}
              >
                <span className="block font-heading text-sm font-semibold text-ink">PayPal</span>
                <span className="block text-xs text-ink/60">for international buyers</span>
              </button>
            </div>
            <div className="mt-3 rounded-xl2 border-2 border-lavender-dark/20 bg-lavender-light/40 p-3 text-xs leading-relaxed text-ink/70">
              <p>🇮🇳 Indian buyers: Use UPI, Cards, or Netbanking via Razorpay for the fastest checkout.</p>
              <p className="mt-1">🌍 International buyers: Use PayPal for a trusted, familiar checkout experience.</p>
            </div>
          </div>

          {error && (
            <p className="rounded-xl2 bg-blush-light p-3 text-sm text-pastel-dark">{error}</p>
          )}

          {paymentMethod === "razorpay" ? (
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Processing..." : `Pay ₹${totalInr.toFixed(2)} with Razorpay`}
            </button>
          ) : PAYPAL_CLIENT_ID ? (
            <div>
              <p className="mb-2 text-center text-xs text-ink/50">
                You&apos;ll pay approximately {formatUsdApprox(totalInr)} via PayPal
              </p>
              <PayPalScriptProvider
                options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}
              >
                <PayPalButtons
                  style={{ layout: "vertical", color: "gold", shape: "pill", label: "paypal" }}
                  disabled={loading}
                  forceReRender={[totalInr, form.country]}
                  createOrder={handlePaypalCreateOrder}
                  onApprove={handlePaypalApprove}
                  onCancel={() => setLoading(false)}
                  onError={(err) => {
                    console.error("[checkout] PayPal error:", err);
                    setError("PayPal payment failed or was cancelled. Please try again.");
                    setLoading(false);
                  }}
                />
              </PayPalScriptProvider>
            </div>
          ) : (
            <div className="rounded-xl2 border-2 border-ink/10 bg-blush-light/50 p-4 text-center text-sm text-ink/50">
              PayPal checkout is coming soon — please use Razorpay for now.
            </div>
          )}
        </form>

        <div className="card h-fit p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Order Summary</h2>
          <div className="mt-4 flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                {item.kind === "product" ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl2 bg-blush-light">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl2 bg-blush-light">
                    {item.customization.mode === "surprise" ? (
                      <GiftIcon className="h-6 w-6 text-pastel" />
                    ) : (
                      <WandIcon className="h-6 w-6 text-pastel" />
                    )}
                  </div>
                )}
                <div className="flex-1 text-sm">
                  <div className="font-heading font-semibold text-ink">{item.name}</div>
                  <div className="text-ink/50">Qty {item.quantity}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="flex items-baseline justify-end gap-1.5">
                    {item.mrpInr > item.priceInr && (
                      <span className="text-xs text-ink/40 line-through">
                        ₹{(item.mrpInr * item.quantity).toFixed(2)}
                      </span>
                    )}
                    <span className="font-semibold text-ink">
                      ₹{(item.priceInr * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  {isInternational && (
                    <div className="text-xs font-normal text-ink/40">
                      {formatUsdApprox(item.priceInr * item.quantity)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {itemsNeedingPhoneModel.map((item) => (
              <PhoneModelField
                key={`phone-${item.id}`}
                itemName={item.name}
                value={item.phoneModel ?? ""}
                onChange={(v) => updateItemPhoneModel(item.id, v)}
                touched={phoneModelTouched.has(item.id)}
                onTouch={() => setPhoneModelTouched((s) => new Set(s).add(item.id))}
              />
            ))}
          </div>
          <div className="mt-6 space-y-1 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between text-ink/60">
              <span>Subtotal</span>
              <span>
                ₹{subtotalInr.toFixed(2)}
                {isInternational && (
                  <span className="ml-1 text-xs text-ink/40">{formatUsdApprox(subtotalInr)}</span>
                )}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-pastel-dark">
                <span>Discount ({coupon?.code === "LAUNCH50" ? "Launch Offer" : coupon?.code})</span>
                <span>
                  -₹{discount.toFixed(2)}
                  {isInternational && (
                    <span className="ml-1 text-xs text-pastel-dark/60">{formatUsdApprox(discount)}</span>
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between text-ink/60">
              <span>Shipping{isInternational ? " (International)" : ""}</span>
              <span>
                {shippingInr === 0 ? (
                  "Free"
                ) : (
                  <>
                    ₹{shippingInr.toFixed(2)}
                    {isInternational && (
                      <span className="ml-1 text-xs text-ink/40">{formatUsdApprox(shippingInr)}</span>
                    )}
                  </>
                )}
              </span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-heading text-lg font-bold text-ink">
            <span>Total</span>
            <span>
              ₹{totalInr.toFixed(2)}
              {isInternational && (
                <span className="ml-1.5 text-sm font-normal text-ink/50">{formatUsdApprox(totalInr)}</span>
              )}
            </span>
          </div>
          {isInternational && (
            <p className="mt-2 text-right text-[11px] text-ink/40">
              USD shown is an approximate reference only — you&apos;ll be charged in INR.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PhoneModelField({
  itemName,
  value,
  onChange,
  touched,
  onTouch,
}: {
  itemName: string;
  value: string;
  onChange: (v: string) => void;
  touched: boolean;
  onTouch: () => void;
}) {
  const isCustom = !!value && !PHONE_MODELS.includes(value);
  const selectValue = isCustom ? PHONE_OTHER : value;
  const showError = touched && !value.trim();

  return (
    <div className={`rounded-xl2 border-2 p-3 ${showError ? "border-pastel-dark" : "border-ink/10"}`}>
      <span className="mb-1 block text-xs font-semibold text-ink/70">
        Phone model for &quot;{itemName}&quot; <span className="text-pastel-dark">*</span>
      </span>
      <select
        required
        value={selectValue}
        onChange={(e) => onChange(e.target.value === PHONE_OTHER ? "" : e.target.value)}
        onBlur={onTouch}
        className="w-full rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-pastel focus:outline-none"
      >
        <option value="" disabled>
          Select your phone model
        </option>
        {PHONE_MODELS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
        <option value={PHONE_OTHER}>{PHONE_OTHER}</option>
      </select>
      {(isCustom || selectValue === PHONE_OTHER) && (
        <input
          type="text"
          required
          placeholder="Type your phone model"
          value={isCustom ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onTouch}
          className="mt-2 w-full rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-pastel focus:outline-none"
        />
      )}
      {showError && <p className="mt-1 text-xs text-pastel-dark">Select or type a phone model.</p>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  required = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink/70">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        className={`w-full rounded-xl2 border-2 bg-white px-3 py-2 text-sm text-ink focus:outline-none ${
          error ? "border-pastel-dark" : "border-ink/10 focus:border-pastel"
        }`}
      />
      {error && <p className="mt-1 text-xs text-pastel-dark">{error}</p>}
    </label>
  );
}
