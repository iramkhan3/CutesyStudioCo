"use client";

import { useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { SITE } from "@/lib/constants";
import { useStore } from "@/components/StoreProvider";
import { calculateShipping, calculateShippingUsd } from "@/lib/shipping";
import { calculateDiscount } from "@/lib/coupons";
import { useCoupons } from "@/lib/hooks/useCoupons";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Props = {
  token: string;
  customerName: string;
  email: string;
  phone: string;
  defaultCountry: string;
  priceInr: number;
  priceUsd: number | null;
};

const inputClass =
  "mt-1 w-full rounded-xl2 border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-pastel";

/**
 * Payment step for an approved custom request. Collects the shipping
 * address, shows shipping + total, and pays via Razorpay (₹) or PayPal ($)
 * through /api/custom-requests/<token>/pay — which prices everything
 * server-side from the maker's quote — then the standard verify/capture
 * routes, exactly like the normal checkout.
 */
export function PayForRequest({ token, customerName, email, phone, defaultCountry, priceInr, priceUsd }: Props) {
  const router = useRouter();
  const { settings, countries: COUNTRIES } = useStore();
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: COUNTRIES.includes(defaultCountry) ? defaultCountry : "India",
  });
  const isInternational = address.country !== "India";
  const [method, setMethod] = useState<"razorpay" | "paypal">(isInternational && priceUsd ? "paypal" : "razorpay");
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingOrderIdRef = useRef<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState<string | null>(null);

  // Only codes the customer types — the launch offer never auto-applies to a
  // quoted price. The server re-checks everything (custom-requests/.../pay).
  const coupons = useCoupons().filter((c) => !c.autoApply);
  const usd = method === "paypal" && priceUsd != null;
  const subtotal = usd ? priceUsd! : priceInr;
  const { discount, coupon, error: couponError } = calculateDiscount(
    subtotal,
    couponCode,
    coupons,
    usd ? subtotal * settings.shipping.usdInrRate : subtotal
  );
  const payable = Math.round(Math.max(0, subtotal - discount) * 100) / 100;
  const shipping = usd
    ? calculateShippingUsd(payable, address.country, coupon, settings.shipping)
    : calculateShipping(payable, address.country, coupon, settings.shipping);
  const total = Math.round((payable + shipping) * 100) / 100;

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponCode(code);
    setCouponInput("");
    setError(null);
  }
  const fmt = (n: number) => (usd ? `$${n.toFixed(2)}` : `₹${n.toFixed(2)}`);

  function addressComplete(): boolean {
    if (!address.line1.trim() || !address.city.trim() || !address.state.trim() || !address.postalCode.trim()) {
      setError("Please complete your shipping address.");
      return false;
    }
    setError(null);
    return true;
  }

  async function startPayment(provider: "razorpay" | "paypal") {
    const res = await fetch(`/api/custom-requests/${token}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, shippingAddress: address, couponCode: coupon?.code ?? null }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Couldn't start the payment. Please try again.");
    return data;
  }

  async function payWithRazorpay() {
    if (!addressComplete()) return;
    if (!scriptReady || !window.Razorpay) {
      setError("Payment is still loading — please try again in a second.");
      return;
    }
    setLoading(true);
    try {
      const { orderId, razorpayOrderId, amount, currency, keyId } = await startPayment("razorpay");
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: SITE.name,
        description: "Custom handmade order",
        prefill: { name: customerName, email, contact: phone },
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
              setError("We couldn't confirm your payment automatically. If money was deducted, please contact us.");
              setLoading(false);
              return;
            }
            router.push(`/order-confirmation?orderId=${orderId}`);
          } catch {
            setError("We couldn't confirm your payment. Please contact us if you were charged.");
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.on("payment.failed", () => {
        setError("Payment failed or was declined. Please try again.");
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function paypalCreateOrder(): Promise<string> {
    if (!addressComplete()) throw new Error("Address incomplete.");
    setLoading(true);
    try {
      const data = await startPayment("paypal");
      pendingOrderIdRef.current = data.orderId;
      return data.paypalOrderId as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start PayPal.");
      setLoading(false);
      throw err;
    }
  }

  async function paypalApprove(data: { orderID: string }) {
    const orderId = pendingOrderIdRef.current;
    if (!orderId) return;
    try {
      const res = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paypalOrderId: data.orderID }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setError("We couldn't confirm your payment automatically. If money was deducted, please contact us.");
        setLoading(false);
        return;
      }
      router.push(`/order-confirmation?orderId=${orderId}`);
    } catch {
      setError("We couldn't confirm your payment. Please contact us if you were charged.");
      setLoading(false);
    }
  }

  const set = (key: keyof typeof address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddress((a) => ({ ...a, [key]: e.target.value }));

  return (
    <div className="card p-6 sm:p-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptReady(true)} />

      <h2 className="font-heading text-xl font-bold text-ink">Shipping address</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-ink sm:col-span-2">
          Address line 1
          <input value={address.line1} onChange={set("line1")} className={inputClass} autoComplete="address-line1" />
        </label>
        <label className="block text-sm font-semibold text-ink sm:col-span-2">
          Address line 2 (optional)
          <input value={address.line2} onChange={set("line2")} className={inputClass} autoComplete="address-line2" />
        </label>
        <label className="block text-sm font-semibold text-ink">
          City
          <input value={address.city} onChange={set("city")} className={inputClass} autoComplete="address-level2" />
        </label>
        <label className="block text-sm font-semibold text-ink">
          State / region
          <input value={address.state} onChange={set("state")} className={inputClass} autoComplete="address-level1" />
        </label>
        <label className="block text-sm font-semibold text-ink">
          {address.country === "India" ? "PIN code" : "Postal code"}
          <input value={address.postalCode} onChange={set("postalCode")} className={inputClass} autoComplete="postal-code" />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Country
          <select value={address.country} onChange={set("country")} className={inputClass}>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h2 className="mt-8 font-heading text-xl font-bold text-ink">Payment method</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMethod("razorpay")}
          className={`card p-4 text-left ${method === "razorpay" ? "ring-2 ring-pastel" : ""}`}
        >
          <span className="block font-heading text-sm font-semibold text-ink">Card / UPI / Netbanking</span>
          <span className="block text-xs text-ink/60">Pay in ₹ via Razorpay</span>
        </button>
        {priceUsd != null && PAYPAL_CLIENT_ID && (
          <button
            type="button"
            onClick={() => setMethod("paypal")}
            className={`card p-4 text-left ${method === "paypal" ? "ring-2 ring-pastel" : ""}`}
          >
            <span className="block font-heading text-sm font-semibold text-ink">PayPal</span>
            <span className="block text-xs text-ink/60">Pay in $ — best for international buyers</span>
          </button>
        )}
      </div>

      <div className="mt-6">
        {couponCode ? (
          <div className="flex items-center justify-between gap-3 rounded-xl2 border border-ink/10 bg-white px-4 py-2.5 text-sm">
            <span className={coupon ? "font-semibold text-pastel-dark" : "text-red-700"}>
              {coupon ? `🎉 ${coupon.code} applied` : couponError}
            </span>
            <button
              type="button"
              onClick={() => setCouponCode(null)}
              className="shrink-0 font-semibold text-ink/60 hover:text-pastel"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="block text-sm font-semibold text-ink">
            Coupon code (optional)
            <div className="mt-1 flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyCoupon();
                  }
                }}
                placeholder="Enter code"
                className={`${inputClass.replace("mt-1 ", "")} uppercase`}
                maxLength={40}
              />
              <button type="button" onClick={applyCoupon} className="btn-secondary shrink-0 px-5">
                Apply
              </button>
            </div>
          </label>
        )}
      </div>

      <dl className="mt-4 space-y-1 rounded-xl2 bg-blush-light/50 p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink/70">Your custom piece (quoted)</dt>
          <dd className="text-ink">{fmt(subtotal)}</dd>
        </div>
        {discount > 0 && coupon && (
          <div className="flex justify-between text-pastel-dark">
            <dt>Discount ({coupon.code})</dt>
            <dd>-{fmt(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-ink/70">Shipping to {address.country}</dt>
          <dd className="text-ink">{shipping === 0 ? "Free" : fmt(shipping)}</dd>
        </div>
        <div className="flex justify-between border-t border-ink/10 pt-2 font-heading text-lg font-bold">
          <dt className="text-ink">Total</dt>
          <dd className="text-pastel-dark">{fmt(total)}</dd>
        </div>
      </dl>

      {error && (
        <p role="alert" className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6">
        {method === "razorpay" ? (
          <button onClick={payWithRazorpay} disabled={loading} className="btn-primary w-full">
            {loading ? "Opening payment…" : `Pay ${fmt(total)}`}
          </button>
        ) : (
          PAYPAL_CLIENT_ID && (
            <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}>
              <PayPalButtons
                style={{ layout: "vertical", color: "gold", shape: "pill", label: "paypal" }}
                disabled={loading}
                forceReRender={[address.country, total, coupon?.code]}
                createOrder={paypalCreateOrder}
                onApprove={paypalApprove}
                onCancel={() => setLoading(false)}
                onError={() => {
                  setError("PayPal payment failed or was cancelled. Please try again.");
                  setLoading(false);
                }}
              />
            </PayPalScriptProvider>
          )
        )}
      </div>
    </div>
  );
}
