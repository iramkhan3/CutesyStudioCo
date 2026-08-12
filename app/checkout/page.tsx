"use client";

import { useState, type FormEvent } from "react";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore, cartSubtotalInr } from "@/lib/store/cart";
import { calculateDiscount } from "@/lib/coupons";
import { calculateShipping } from "@/lib/shipping";
import { COUNTRIES, SITE } from "@/lib/constants";
import { GiftIcon, SparkleIcon, WandIcon } from "@/components/Icons";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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
const POSTAL_CODE_RE = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/;

function validateField(key: keyof FormState, value: string): string | null {
  switch (key) {
    case "name":
      return NAME_RE.test(value.trim()) ? null : "Enter your full name.";
    case "email":
      return EMAIL_RE.test(value.trim()) ? null : "Enter a valid email address.";
    case "phone":
      return PHONE_RE.test(value.trim()) ? null : "Enter a valid phone number.";
    case "postalCode":
      return POSTAL_CODE_RE.test(value.trim()) ? null : "Enter a valid postal code.";
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
    const message = validateField(key, form[key]);
    if (message) errors[key] = message;
  });
  return errors;
}

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const clearCart = useCartStore((s) => s.clearCart);
  const router = useRouter();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [countrySelect, setCountrySelect] = useState("");
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldErrors = validateForm(form);
  const hasErrors = Object.keys(fieldErrors).length > 0;

  function markTouched(key: keyof FormState) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  const subtotalInr = cartSubtotalInr(items);
  const { discount, coupon } = calculateDiscount(subtotalInr, couponCode);
  const shippingInr = calculateShipping(subtotalInr, form.country);
  const totalInr = Math.max(0, subtotalInr - discount) + shippingInr;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
      return;
    }
    if (!scriptReady) {
      setError("Payment is still loading — please try again in a second.");
      return;
    }
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) =>
            i.kind === "product"
              ? { kind: "product", productId: i.productId, quantity: i.quantity }
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
        }),
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

          {error && (
            <p className="rounded-xl2 bg-blush-light p-3 text-sm text-pastel-dark">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Processing..." : `Pay ₹${totalInr.toFixed(2)} with Razorpay`}
          </button>
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
                <div className="text-sm font-semibold text-ink">
                  ₹{(item.priceInr * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-1 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between text-ink/60">
              <span>Subtotal</span>
              <span>₹{subtotalInr.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-pastel-dark">
                <span>Discount ({coupon?.code === "LAUNCH50" ? "Launch Offer" : coupon?.code})</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink/60">
              <span>Shipping{form.country && form.country !== "India" ? " (International)" : ""}</span>
              <span>{shippingInr === 0 ? "Free" : `₹${shippingInr.toFixed(2)}`}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-heading text-lg font-bold text-ink">
            <span>Total</span>
            <span>₹{totalInr.toFixed(2)}</span>
          </div>
        </div>
      </div>
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
