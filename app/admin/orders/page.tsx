"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FulfillmentStatus, OrderRecord, PaymentProvider, PaymentStatus } from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/admin-format";
import OrderStatusBadges from "@/components/admin/OrderStatusBadges";

const PAGE_SIZE = 25;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "all">("all");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider | "all">("all");
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, paymentStatus, paymentProvider, fulfillmentStatus]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
        if (paymentProvider !== "all") params.set("paymentProvider", paymentProvider);
        if (fulfillmentStatus !== "all") params.set("fulfillmentStatus", fulfillmentStatus);

        const res = await fetch(`/api/admin/orders?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load orders.");
        const data = await res.json();
        if (cancelled) return;
        setOrders(data.orders);
        setTotal(data.total);
      } catch {
        if (!cancelled) setError("Couldn't load orders. Try refreshing.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, paymentStatus, paymentProvider, fulfillmentStatus]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-ink">Orders</h1>
      <p className="mt-1 text-ink-light">{total} order{total === 1 ? "" : "s"} total.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name, email, or order ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px] flex-1 rounded-full border border-ink/15 px-4 py-2 text-sm outline-none focus:border-pastel focus:ring-2 focus:ring-pastel/30"
        />
        <Select
          value={paymentStatus}
          onChange={(v) => setPaymentStatus(v as PaymentStatus | "all")}
          options={[
            ["all", "All payment statuses"],
            ["paid", "Paid"],
            ["pending", "Pending"],
            ["failed", "Failed"],
          ]}
        />
        <Select
          value={paymentProvider}
          onChange={(v) => setPaymentProvider(v as PaymentProvider | "all")}
          options={[
            ["all", "All providers"],
            ["razorpay", "Razorpay"],
            ["paypal", "PayPal"],
          ]}
        />
        <Select
          value={fulfillmentStatus}
          onChange={(v) => setFulfillmentStatus(v as FulfillmentStatus | "all")}
          options={[
            ["all", "All fulfillment"],
            ["unfulfilled", "Unfulfilled"],
            ["shipped", "Shipped"],
            ["delivered", "Delivered"],
            ["cancelled", "Cancelled"],
          ]}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl2 border border-blush-light bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-blush-light/50 text-ink-light">
            <tr>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Placed</th>
              <th className="px-4 py-3 font-semibold">Items</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-light">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-light">
                  No orders match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              orders.map((order) => (
                <tr key={order.id} className="border-t border-blush-light/70 hover:bg-cream-light">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold text-ink hover:text-pastel-dark">
                      {order.customer_name}
                    </Link>
                    <div className="text-xs text-ink-light">{order.email}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-light">{formatDateTime(order.created_at)}</td>
                  <td className="px-4 py-3 text-ink-light">
                    {order.items.length} item{order.items.length === 1 ? "" : "s"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{formatMoney(order.total_amount, order.currency)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadges order={order} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-full border border-ink/15 px-4 py-1.5 text-sm font-semibold text-ink disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-ink-light">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-full border border-ink/15 px-4 py-1.5 text-sm font-semibold text-ink disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-pastel focus:ring-2 focus:ring-pastel/30"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}
