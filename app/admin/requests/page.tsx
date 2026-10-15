"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CustomRequest, CustomRequestStatus } from "@/lib/types";
import { categoryLabel, useAdminCategories } from "@/components/admin/useAdminCategories";
import { formatDateTime } from "@/lib/admin-format";

const STATUS_STYLES: Record<CustomRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-ink/10 text-ink-light",
  paid: "bg-green-100 text-green-800",
};

const STATUS_LABELS: Record<CustomRequestStatus, string> = {
  pending: "Needs review",
  approved: "Approved — awaiting payment",
  rejected: "Rejected",
  paid: "Paid",
};

const FILTERS: (CustomRequestStatus | "all")[] = ["pending", "approved", "paid", "rejected", "all"];


export default function AdminRequestsPage() {
  const categories = useAdminCategories();
  const categoryName = (slug: string) => categoryLabel(categories, slug);
  const [status, setStatus] = useState<CustomRequestStatus | "all">("pending");
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/custom-requests${status === "all" ? "" : `?status=${status}`}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load requests.");
        if (!cancelled) setRequests(data.requests);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load requests.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-ink">Custom requests</h1>
      <p className="mt-1 max-w-2xl text-ink-light">
        Requests from the &quot;Request a custom piece&quot; form, for any category. Open one to approve it with a
        price (the customer gets an email with a payment link) or to politely decline it.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatus(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              status === f ? "bg-pastel text-white" : "bg-white text-ink/70 hover:bg-blush-light"
            }`}
          >
            {f === "all" ? "All" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      {loading && <p className="mt-6 text-ink-light">Loading…</p>}

      {!loading && !error && (
        <div className="mt-6 overflow-x-auto rounded-xl2 border border-blush-light bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-blush-light/50 text-ink-light">
              <tr>
                <th className="px-4 py-3 font-semibold">Received</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Qty</th>
                <th className="px-4 py-3 font-semibold">Request</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-light">
                    No requests here.
                  </td>
                </tr>
              )}
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-blush-light/70 hover:bg-blush-light/20">
                  <td className="px-4 py-3 text-ink-light">
                    <Link href={`/admin/requests/${r.id}`} className="block">
                      {formatDateTime(r.created_at)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/requests/${r.id}`} className="block">
                      <span className="block font-semibold text-ink">{r.customer_name}</span>
                      <span className="block text-xs text-ink-light">{r.country}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink">{categoryName(r.category)}</td>
                  <td className="px-4 py-3 text-ink">{r.quantity}</td>
                  <td className="max-w-xs px-4 py-3 text-ink-light">
                    <Link href={`/admin/requests/${r.id}`} className="line-clamp-2">
                      {r.notes}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
