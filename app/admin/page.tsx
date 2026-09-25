"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { OrderRecord } from "@/lib/types";
import type { OrderStats } from "@/lib/orders";
import { formatDateTime, formatMoney } from "@/lib/admin-format";
import OrderStatusBadges from "@/components/admin/OrderStatusBadges";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revalidating, setRevalidating] = useState(false);
  const [revalidated, setRevalidated] = useState(false);

  async function handleRevalidate() {
    setRevalidating(true);
    setRevalidated(false);
    try {
      await fetch("/api/admin/revalidate", { method: "POST" });
      setRevalidated(true);
      setTimeout(() => setRevalidated(false), 3000);
    } finally {
      setRevalidating(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/orders?page=1"),
        ]);
        if (!statsRes.ok || !ordersRes.ok) throw new Error("Failed to load dashboard data.");
        const statsData = await statsRes.json();
        const ordersData = await ordersRes.json();
        if (cancelled) return;
        setStats(statsData.stats);
        setRecentOrders((ordersData.orders as OrderRecord[]).slice(0, 8));
      } catch {
        if (!cancelled) setError("Couldn't load the dashboard. Try refreshing.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink">Dashboard</h1>
          <p className="mt-1 text-ink-light">A snapshot of what needs your attention right now.</p>
        </div>
        <div className="text-right">
          <button
            onClick={handleRevalidate}
            disabled={revalidating}
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white disabled:opacity-50"
          >
            {revalidating ? "Refreshing…" : "Refresh storefront cache"}
          </button>
          {revalidated && <p className="mt-1 text-xs font-medium text-green-700">Done — changes are now live.</p>}
          <p className="mt-1 max-w-[220px] text-xs text-ink-light">
            Use this after editing product data directly in Supabase/DBeaver — the site otherwise catches up on its own
            within 5 minutes.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl2 bg-blush-light" />
          ))}
        </div>
      ) : stats ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Orders today" value={String(stats.todayCount)} />
          <StatTile
            label="Needs shipping"
            value={String(stats.unfulfilledCount)}
            highlight={stats.unfulfilledCount > 0}
          />
          <StatTile
            label="Payment pending"
            value={String(stats.pendingCount)}
            highlight={stats.pendingCount > 0}
          />
          <StatTile label="Paid, last 30 days" value={String(stats.last30dPaidCount)} />
          <StatTile
            label="Revenue (30d, INR)"
            value={formatMoney(stats.paidRevenueInr30d, "INR")}
          />
          <StatTile
            label="Revenue (30d, USD)"
            value={formatMoney(stats.paidRevenueUsd30d, "USD")}
          />
        </div>
      ) : null}

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-ink">Recent orders</h2>
        <Link href="/admin/orders" className="text-sm font-semibold text-pastel-dark hover:underline">
          View all orders →
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl2 border border-blush-light bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-blush-light/50 text-ink-light">
            <tr>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Placed</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {!loading && recentOrders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-light">
                  No orders yet.
                </td>
              </tr>
            )}
            {recentOrders.map((order) => (
              <tr key={order.id} className="border-t border-blush-light/70 hover:bg-cream-light">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold text-ink hover:text-pastel-dark">
                    {order.customer_name}
                  </Link>
                  <div className="text-xs text-ink-light">{order.email}</div>
                </td>
                <td className="px-4 py-3 text-ink-light">{formatDateTime(order.created_at)}</td>
                <td className="px-4 py-3 font-semibold text-ink">{formatMoney(order.total_amount, order.currency)}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadges order={order} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl2 border p-4 shadow-soft ${
        highlight ? "border-pastel bg-pastel/10" : "border-blush-light bg-white"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-light">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink">{value}</div>
    </div>
  );
}
