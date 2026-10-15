"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CustomRequest } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { formatDateTime } from "@/lib/admin-format";

const DEFAULT_REJECT_MESSAGE =
  "This one is a little outside what I can make well by hand right now, and I'd hate to send you something that isn't perfect. Thank you so much for understanding!";

export default function AdminRequestDetailPage({ params }: { params: { id: string } }) {
  const [request, setRequest] = useState<CustomRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [priceInr, setPriceInr] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [approveMessage, setApproveMessage] = useState("");
  const [rejectMessage, setRejectMessage] = useState(DEFAULT_REJECT_MESSAGE);
  const [confirmingReject, setConfirmingReject] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/admin/custom-requests/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load request.");
        if (cancelled) return;
        setRequest(data.request);
        setPriceInr(data.suggested.priceInr != null ? String(data.suggested.priceInr) : "");
        setPriceUsd(data.suggested.priceUsd != null ? String(data.suggested.priceUsd) : "");
        setApproveMessage(data.request.status === "approved" ? data.request.admin_message ?? "" : "");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load request.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function decide(body: Record<string, unknown>, successText: string) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/custom-requests/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setRequest(data.request);
      setConfirmingReject(false);
      setNotice(
        data.emailSent
          ? `${successText} The customer has been emailed.`
          : `${successText} ⚠️ The email to the customer could not be sent — check that the email template is turned on in Admin → Emails, or contact them directly.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-ink-light">Loading…</p>;
  if (!request) return <p className="text-red-700">{error ?? "Request not found."}</p>;

  const categoryName = CATEGORIES.find((c) => c.slug === request.category)?.name ?? request.category;
  const canDecide = request.status === "pending" || request.status === "approved";
  const payLink = typeof window !== "undefined" ? `${window.location.origin}/pay/${request.token}` : `/pay/${request.token}`;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/requests" className="text-sm font-semibold text-pastel-dark hover:underline">
        ← Back to requests
      </Link>

      <h1 className="mt-3 font-heading text-3xl font-bold text-ink">
        Custom {categoryName} <span className="text-lg text-ink-light">#{request.id.slice(0, 8)}</span>
      </h1>
      <p className="mt-1 text-sm text-ink-light">Received {formatDateTime(request.created_at)}</p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      {notice && <p className="mt-4 rounded-xl2 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">{notice}</p>}

      <section className="mt-6 rounded-xl2 border border-blush-light bg-white p-5 shadow-soft">
        <h2 className="font-heading text-lg font-bold text-ink">What they asked for</h2>
        <dl className="mt-3 grid grid-cols-[140px_1fr] gap-y-2 text-sm">
          <dt className="text-ink-light">Category</dt>
          <dd className="font-semibold text-ink">{categoryName}</dd>
          <dt className="text-ink-light">Quantity</dt>
          <dd className="text-ink">{request.quantity}</dd>
          {request.device_model && (
            <>
              <dt className="text-ink-light">Model / size</dt>
              <dd className="text-ink">{request.device_model}</dd>
            </>
          )}
          <dt className="text-ink-light">Notes</dt>
          <dd className="whitespace-pre-wrap text-ink">{request.notes}</dd>
        </dl>
      </section>

      <section className="mt-4 rounded-xl2 border border-blush-light bg-white p-5 shadow-soft">
        <h2 className="font-heading text-lg font-bold text-ink">Customer</h2>
        <dl className="mt-3 grid grid-cols-[140px_1fr] gap-y-2 text-sm">
          <dt className="text-ink-light">Name</dt>
          <dd className="text-ink">{request.customer_name}</dd>
          <dt className="text-ink-light">Email</dt>
          <dd>
            <a href={`mailto:${request.email}`} className="text-pastel-dark hover:underline">
              {request.email}
            </a>
          </dd>
          <dt className="text-ink-light">Phone</dt>
          <dd>
            <a
              href={`https://wa.me/${request.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pastel-dark hover:underline"
            >
              {request.phone} (WhatsApp)
            </a>
          </dd>
          <dt className="text-ink-light">Country</dt>
          <dd className="text-ink">{request.country}</dd>
        </dl>
      </section>

      <section className="mt-4 rounded-xl2 border border-blush-light bg-white p-5 shadow-soft">
        <h2 className="font-heading text-lg font-bold text-ink">Status</h2>
        {request.status === "pending" && <p className="mt-2 text-sm text-amber-800">Waiting for your decision.</p>}
        {request.status === "approved" && (
          <p className="mt-2 text-sm text-blue-800">
            Approved at ₹{request.quoted_price_inr?.toFixed(2)} / ${request.quoted_price_usd?.toFixed(2)} — waiting for the
            customer to pay. Payment link:{" "}
            <a href={payLink} target="_blank" rel="noopener noreferrer" className="break-all underline">
              {payLink}
            </a>
          </p>
        )}
        {request.status === "rejected" && <p className="mt-2 text-sm text-ink-light">Declined — the customer was emailed.</p>}
        {request.status === "paid" && (
          <p className="mt-2 text-sm text-green-800">
            Paid! 🎉{" "}
            {request.order_id && (
              <Link href={`/admin/orders/${request.order_id}`} className="font-semibold underline">
                View the order →
              </Link>
            )}
          </p>
        )}
        {request.admin_message && (
          <p className="mt-2 text-sm text-ink-light">
            Your note to them: <em>{request.admin_message}</em>
          </p>
        )}
      </section>

      {canDecide && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-xl2 border-2 border-green-200 bg-white p-5 shadow-soft">
            <h2 className="font-heading text-lg font-bold text-ink">
              {request.status === "approved" ? "Change the quote" : "Approve"}
            </h2>
            <p className="mt-1 text-xs text-ink-light">
              Total price for all {request.quantity} piece{request.quantity === 1 ? "" : "s"}, excluding shipping
              (shipping is added at payment by the normal rules). The $ price is used if they pay with PayPal.
            </p>
            <div className="mt-3 flex gap-3">
              <label className="flex-1 text-xs font-semibold text-ink-light">
                Price (₹)
                <input
                  type="number"
                  min={1}
                  value={priceInr}
                  onChange={(e) => setPriceInr(e.target.value)}
                  className="mt-1 w-full rounded-xl2 border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-pastel"
                />
              </label>
              <label className="flex-1 text-xs font-semibold text-ink-light">
                Price ($)
                <input
                  type="number"
                  min={1}
                  step={0.01}
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  className="mt-1 w-full rounded-xl2 border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-pastel"
                />
              </label>
            </div>
            <label className="mt-3 block text-xs font-semibold text-ink-light">
              Note to the customer (optional)
              <textarea
                value={approveMessage}
                onChange={(e) => setApproveMessage(e.target.value)}
                rows={3}
                placeholder="e.g. Love this idea! I'll add a matching bow on the lid."
                className="mt-1 w-full rounded-xl2 border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-pastel"
              />
            </label>
            <button
              onClick={() =>
                decide(
                  { action: "approve", priceInr: Number(priceInr), priceUsd: Number(priceUsd), message: approveMessage },
                  request.status === "approved" ? "Quote updated." : "Approved."
                )
              }
              disabled={saving || !priceInr || !priceUsd}
              className="mt-3 w-full rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : request.status === "approved" ? "Update quote & re-send email" : "Approve & email payment link"}
            </button>
          </section>

          <section className="rounded-xl2 border-2 border-red-100 bg-white p-5 shadow-soft">
            <h2 className="font-heading text-lg font-bold text-ink">Decline politely</h2>
            <p className="mt-1 text-xs text-ink-light">
              The email already thanks them warmly and points them to your ready-made designs. Edit the note below to
              explain why, or clear it.
            </p>
            <label className="mt-3 block text-xs font-semibold text-ink-light">
              Note to the customer (optional)
              <textarea
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                rows={5}
                className="mt-1 w-full rounded-xl2 border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-pastel"
              />
            </label>
            {!confirmingReject ? (
              <button
                onClick={() => setConfirmingReject(true)}
                disabled={saving}
                className="mt-3 w-full rounded-full border-2 border-red-200 px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >
                Decline request
              </button>
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => decide({ action: "reject", message: rejectMessage }, "Declined.")}
                  disabled={saving}
                  className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? "Sending…" : "Yes, decline & email"}
                </button>
                <button
                  onClick={() => setConfirmingReject(false)}
                  className="rounded-full px-4 py-2 text-sm text-ink-light hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
