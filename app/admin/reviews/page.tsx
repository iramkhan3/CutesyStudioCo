"use client";

import { useEffect, useState } from "react";
import ImageUploader from "@/components/admin/ImageUploader";
import { formatDateTime } from "@/lib/admin-format";

type ReviewStatus = "pending" | "approved" | "hidden";
type Review = {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  body: string;
  image_url: string | null;
  email: string | null;
  order_ref: string | null;
  status: ReviewStatus;
  created_at: string;
};
type Draft = Omit<Review, "id" | "created_at">;

const EMPTY: Draft = { name: "", location: "", rating: 5, body: "", image_url: null, email: "", order_ref: "", status: "approved" };
const FILTERS: { key: ReviewStatus | "all"; label: string }[] = [
  { key: "pending", label: "Needs approval" },
  { key: "approved", label: "On the site" },
  { key: "hidden", label: "Hidden" },
  { key: "all", label: "All" },
];
const STATUS_STYLE: Record<ReviewStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  hidden: "bg-ink/10 text-ink-light",
};
const input =
  "mt-1 w-full rounded-xl2 border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pastel";

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`text-lg leading-none ${n <= value ? "text-amber-400" : "text-ink/15"} ${onChange ? "cursor-pointer" : "cursor-default"}`}
          aria-label={onChange ? `${n} star${n > 1 ? "s" : ""}` : undefined}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/reviews${filter === "all" ? "" : `?status=${filter}`}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setReviews(data.reviews ?? []);
      })
      .catch(() => !cancelled && setError("Failed to load reviews."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filter, reload]);

  function startEdit(review: Review | null) {
    setError(null);
    if (review) {
      setEditingId(review.id);
      setDraft({ ...review, location: review.location ?? "", email: review.email ?? "", order_ref: review.order_ref ?? "" });
    } else {
      setEditingId("new");
      setDraft(EMPTY);
    }
  }

  async function send(method: "POST" | "PATCH" | "DELETE", id: string | null, body?: Draft) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(id ? `/api/admin/reviews/${id}` : "/api/admin/reviews", {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setEditingId(null);
      setReload((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const setStatus = (review: Review, status: ReviewStatus) => send("PATCH", review.id, { ...review, status });

  const form = (
    <div className="rounded-xl2 border-2 border-pastel-light bg-white p-5 shadow-soft">
      <h2 className="font-heading text-lg font-bold text-ink">{editingId === "new" ? "Add a review" : "Edit review"}</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-ink-light">
          Customer name
          <input value={draft.name} maxLength={60} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={input} />
        </label>
        <label className="text-xs font-semibold text-ink-light">
          City / country (optional)
          <input value={draft.location ?? ""} maxLength={60} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className={input} />
        </label>
      </div>
      <div className="mt-3 text-xs font-semibold text-ink-light">
        Rating <Stars value={draft.rating} onChange={(rating) => setDraft({ ...draft, rating })} />
      </div>
      <label className="mt-3 block text-xs font-semibold text-ink-light">
        Review
        <textarea value={draft.body} rows={4} maxLength={1500} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className={input} />
      </label>
      <div className="mt-3">
        <p className="text-xs font-semibold text-ink-light">Photo (optional)</p>
        <ImageUploader
          images={draft.image_url ? [draft.image_url] : []}
          onChange={(images) => setDraft({ ...draft, image_url: images.filter((u) => !/\.(mp4|webm|mov)$/i.test(u)).pop() ?? null })}
        />
      </div>
      <label className="mt-3 block text-xs font-semibold text-ink-light">
        Show on the site?
        <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ReviewStatus })} className={input}>
          <option value="approved">Yes — show it</option>
          <option value="pending">Not yet (needs approval)</option>
          <option value="hidden">No — hidden</option>
        </select>
      </label>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => send(editingId === "new" ? "POST" : "PATCH", editingId === "new" ? null : editingId, draft)}
          disabled={saving}
          className="rounded-full bg-pastel px-5 py-2 text-sm font-semibold text-white hover:bg-pastel-dark disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save review"}
        </button>
        <button onClick={() => setEditingId(null)} className="rounded-full px-4 py-2 text-sm text-ink-light hover:underline">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink">Reviews</h1>
          <p className="mt-1 max-w-2xl text-ink-light">
            Customers submit reviews at <a href="/review" target="_blank" className="underline">/review</a> (the &quot;Order
            delivered&quot; email links there). Approve the ones you&apos;d like on your homepage, or add reviews you received on
            WhatsApp or Instagram yourself.
          </p>
        </div>
        <button onClick={() => startEdit(null)} className="rounded-full bg-pastel px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-pastel-dark">
          + Add review
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filter === f.key ? "bg-pastel text-white" : "bg-white text-ink/70 hover:bg-blush-light"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      {editingId === "new" && <div className="mt-5">{form}</div>}
      {loading && <p className="mt-6 text-ink-light">Loading…</p>}
      {!loading && reviews.length === 0 && <p className="mt-6 text-ink-light">No reviews here.</p>}

      <ul className="mt-5 space-y-3">
        {reviews.map((review) =>
          editingId === review.id ? (
            <li key={review.id}>{form}</li>
          ) : (
            <li key={review.id} className="rounded-xl2 border border-blush-light bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-start gap-4">
                {review.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={review.image_url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={review.rating} />
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[review.status]}`}>
                      {review.status === "approved" ? "On the site" : review.status === "pending" ? "Needs approval" : "Hidden"}
                    </span>
                    <span className="text-xs text-ink-light">{formatDateTime(review.created_at)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{review.body}</p>
                  <p className="mt-2 text-xs text-ink-light">
                    <strong className="text-ink">{review.name}</strong>
                    {review.location && ` · ${review.location}`}
                    {review.order_ref && ` · order #${review.order_ref}`}
                    {review.email && ` · ${review.email}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {review.status !== "approved" && (
                    <button onClick={() => setStatus(review, "approved")} disabled={saving} className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                      Approve
                    </button>
                  )}
                  {review.status === "approved" && (
                    <button onClick={() => setStatus(review, "hidden")} disabled={saving} className="rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-blush-light">
                      Hide
                    </button>
                  )}
                  <button onClick={() => startEdit(review)} className="rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-blush-light">
                    Edit
                  </button>
                  <button
                    onClick={() => confirm(`Delete this review from ${review.name}? This can't be undone.`) && send("DELETE", review.id)}
                    disabled={saving}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
