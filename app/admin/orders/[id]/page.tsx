"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { FulfillmentStatus, OrderRecord } from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/admin-format";
import OrderStatusBadges from "@/components/admin/OrderStatusBadges";

const FULFILLMENT_OPTIONS: FulfillmentStatus[] = ["unfulfilled", "shipped", "delivered", "cancelled"];

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus>("unfulfilled");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load order.");
        if (cancelled) return;
        const o: OrderRecord = data.order;
        setOrder(o);
        setFulfillmentStatus(o.fulfillment_status);
        setTrackingNumber(o.tracking_number ?? "");
        setCourier(o.courier ?? "");
        setAdminNotes(o.admin_notes ?? "");
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load order.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillment_status: fulfillmentStatus,
          tracking_number: trackingNumber || null,
          courier: courier || null,
          admin_notes: adminNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save changes.");
      setOrder(data.order);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse text-ink-light">Loading order…</div>;
  }

  if (loadError || !order) {
    return (
      <div>
        <Link href="/admin/orders" className="text-sm font-semibold text-pastel-dark hover:underline">
          ← Back to orders
        </Link>
        <p role="alert" className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {loadError || "Order not found."}
        </p>
      </div>
    );
  }

  const address = order.shipping_address;

  return (
    <div>
      <Link href="/admin/orders" className="text-sm font-semibold text-pastel-dark hover:underline">
        ← Back to orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">{order.customer_name}</h1>
          <p className="text-sm text-ink-light">
            Order {order.id} · placed {formatDateTime(order.created_at)}
          </p>
        </div>
        <OrderStatusBadges order={order} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Items">
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3 rounded-xl2 border border-blush-light p-3">
                  <div className="flex-1">
                    <div className="font-semibold text-ink">{item.name}</div>
                    <div className="text-sm text-ink-light">
                      Qty {item.quantity} · {formatMoney(item.unitPriceInr, order.currency)} each
                    </div>
                    {item.kind === "product" && item.phoneModel && (
                      <dl className="mt-2 text-xs text-ink-light">
                        <Row label="Phone model" value={item.phoneModel} />
                      </dl>
                    )}
                    {item.kind === "custom" && (
                      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-light">
                        <Row label="Type" value={item.customization.productType} />
                        <Row label="Mode" value={item.customization.mode} />
                        {item.customization.phoneModel && <Row label="Phone model" value={item.customization.phoneModel} />}
                        {item.customization.theme && <Row label="Theme" value={item.customization.theme} />}
                        {item.customization.style && <Row label="Style" value={item.customization.style} />}
                        {item.customization.weight && <Row label="Weight" value={item.customization.weight} />}
                        {item.customization.colour && <Row label="Colour" value={item.customization.colour} />}
                        {item.customization.note && (
                          <div className="col-span-2">
                            <span className="font-semibold">Note: </span>
                            {item.customization.note}
                          </div>
                        )}
                      </dl>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Pricing">
            <dl className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
              {order.coupon_code && (
                <Row
                  label={`Discount (${order.coupon_code})`}
                  value={`− ${formatMoney(order.discount_amount, order.currency)}`}
                />
              )}
              <Row label="Shipping" value={order.shipping_amount === 0 ? "Free" : formatMoney(order.shipping_amount, order.currency)} />
              <div className="mt-2 flex justify-between border-t border-blush-light pt-2 text-base font-bold text-ink">
                <span>Total</span>
                <span>{formatMoney(order.total_amount, order.currency)}</span>
              </div>
            </dl>
          </Section>

          <Section title="Payment">
            <dl className="space-y-1.5 text-sm">
              <Row label="Provider" value={order.payment_provider} />
              <Row label="Status" value={order.payment_status} />
              {order.razorpay_order_id && <Row label="Razorpay order" value={order.razorpay_order_id} mono />}
              {order.razorpay_payment_id && <Row label="Razorpay payment" value={order.razorpay_payment_id} mono />}
              {order.paypal_order_id && <Row label="PayPal order" value={order.paypal_order_id} mono />}
              {order.paypal_capture_id && <Row label="PayPal capture" value={order.paypal_capture_id} mono />}
            </dl>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Customer">
            <dl className="space-y-1.5 text-sm">
              <Row label="Name" value={order.customer_name} />
              <Row label="Email" value={order.email} />
              <Row label="Phone" value={order.phone || "—"} />
            </dl>
          </Section>

          <Section title="Shipping address">
            <p className="text-sm text-ink">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {address.city}, {address.state} {address.postalCode}
              <br />
              {address.country}
            </p>
          </Section>

          <Section title="Fulfillment">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-light">Status</label>
                <select
                  value={fulfillmentStatus}
                  onChange={(e) => setFulfillmentStatus(e.target.value as FulfillmentStatus)}
                  className="w-full rounded-xl2 border border-ink/15 px-3 py-2 text-sm outline-none focus:border-pastel focus:ring-2 focus:ring-pastel/30"
                >
                  {FULFILLMENT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-light">Courier</label>
                <input
                  type="text"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="e.g. Delhivery, India Post"
                  className="w-full rounded-xl2 border border-ink/15 px-3 py-2 text-sm outline-none focus:border-pastel focus:ring-2 focus:ring-pastel/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-light">Tracking number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full rounded-xl2 border border-ink/15 px-3 py-2 text-sm outline-none focus:border-pastel focus:ring-2 focus:ring-pastel/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-light">Internal notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Not shown to the customer."
                  className="w-full rounded-xl2 border border-ink/15 px-3 py-2 text-sm outline-none focus:border-pastel focus:ring-2 focus:ring-pastel/30"
                />
              </div>

              {saveError && (
                <p role="alert" className="rounded-xl2 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {saveError}
                </p>
              )}
              {saved && (
                <p className="rounded-xl2 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">Saved.</p>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-full bg-pastel px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-pastel-dark disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl2 border border-blush-light bg-white p-4 shadow-soft">
      <h2 className="mb-3 font-heading text-lg font-bold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-light">{label}</dt>
      <dd className={`text-right text-ink ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
