"use client";

import { useEffect, useState } from "react";
import type { AdminCouponRow } from "@/lib/admin-coupons";

type FormState = { percent_off: string; min_purchase_inr: string; active: boolean; auto_apply: boolean };

function toForm(row: AdminCouponRow): FormState {
  return {
    percent_off: String(row.percent_off),
    min_purchase_inr: String(row.min_purchase_inr),
    active: row.active,
    auto_apply: row.auto_apply,
  };
}

function CouponRow({ row, onSaved, onDeleted }: { row: AdminCouponRow; onSaved: (r: AdminCouponRow) => void; onDeleted: (code: string) => void }) {
  const [form, setForm] = useState<FormState>(toForm(row));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/coupons/${row.code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          percent_off: Number(form.percent_off),
          min_purchase_inr: Number(form.min_purchase_inr),
          active: form.active,
          auto_apply: form.auto_apply,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      onSaved(data.coupon);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/coupons/${row.code}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete.");
      onDeleted(row.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
      setDeleting(false);
    }
  }

  return (
    <tr className="border-t border-blush-light/70">
      <td className="px-4 py-3 font-mono font-semibold text-ink">{row.code}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={100}
            value={form.percent_off}
            onChange={(e) => setForm((f) => ({ ...f, percent_off: e.target.value }))}
            className="w-16 rounded-lg border border-ink/15 px-2 py-1 text-sm"
          />
          <span className="text-ink-light">%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="text-ink-light">₹</span>
          <input
            type="number"
            min={0}
            value={form.min_purchase_inr}
            onChange={(e) => setForm((f) => ({ ...f, min_purchase_inr: e.target.value }))}
            className="w-20 rounded-lg border border-ink/15 px-2 py-1 text-sm"
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4" />
      </td>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={form.auto_apply}
          onChange={(e) => setForm((f) => ({ ...f, auto_apply: e.target.checked }))}
          className="h-4 w-4"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-pastel px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-pastel-dark disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {!confirmingDelete ? (
            <button onClick={() => setConfirmingDelete(true)} className="text-xs font-semibold text-red-700 hover:underline">
              Delete
            </button>
          ) : (
            <>
              <button onClick={handleDelete} disabled={deleting} className="text-xs font-semibold text-red-700 hover:underline">
                {deleting ? "…" : "Confirm"}
              </button>
              <button onClick={() => setConfirmingDelete(false)} className="text-xs text-ink-light hover:underline">
                Cancel
              </button>
            </>
          )}
        </div>
        {error && <p className="mt-1 text-xs font-medium text-red-700">{error}</p>}
      </td>
    </tr>
  );
}

function NewCouponForm({ onCreated }: { onCreated: (r: AdminCouponRow) => void }) {
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState("10");
  const [minPurchase, setMinPurchase] = useState("0");
  const [autoApply, setAutoApply] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          percent_off: Number(percentOff),
          min_purchase_inr: Number(minPurchase),
          active: true,
          auto_apply: autoApply,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create coupon.");
      onCreated(data.coupon);
      setCode("");
      setPercentOff("10");
      setMinPurchase("0");
      setAutoApply(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create coupon.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl2 border border-blush-light bg-white p-5 shadow-soft">
      <h2 className="font-heading text-lg font-bold text-ink">New coupon</h2>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-light">Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SUMMER20"
            className="w-40 rounded-xl2 border border-ink/15 px-3 py-2 text-sm font-mono outline-none focus:border-pastel"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-light">% off</label>
          <input type="number" min={1} max={100} value={percentOff} onChange={(e) => setPercentOff(e.target.value)} className="w-20 rounded-xl2 border border-ink/15 px-3 py-2 text-sm outline-none focus:border-pastel" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-light">Min purchase (₹)</label>
          <input type="number" min={0} value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} className="w-28 rounded-xl2 border border-ink/15 px-3 py-2 text-sm outline-none focus:border-pastel" />
        </div>
        <label className="mb-2 flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={autoApply} onChange={(e) => setAutoApply(e.target.checked)} className="h-4 w-4" />
          Auto-apply sitewide
        </label>
        <button
          onClick={handleCreate}
          disabled={saving || !code}
          className="rounded-full bg-pastel px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-pastel-dark disabled:opacity-50"
        >
          {saving ? "Creating…" : "+ Create coupon"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}
      {autoApply && (
        <p className="mt-2 text-xs text-amber-700">
          Note: if another coupon is already set to auto-apply, having two active at once means whichever the code
          logic finds first gets used — turn the old one off if you mean to replace it.
        </p>
      )}
    </div>
  );
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/coupons");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load coupons.");
        if (!cancelled) setCoupons(data.coupons);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load coupons.");
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
      <h1 className="font-heading text-3xl font-bold text-ink">Coupons</h1>
      <p className="mt-1 max-w-2xl text-ink-light">
        Manage discount codes. &quot;Auto-apply&quot; means it&apos;s applied to every order automatically with no
        code needed (like the sitewide launch offer) — turn a coupon&apos;s &quot;Active&quot; off to disable it
        entirely, including auto-apply.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {loading && <p className="mt-6 text-ink-light">Loading…</p>}

      {!loading && (
        <div className="mt-6 overflow-x-auto rounded-xl2 border border-blush-light bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-blush-light/50 text-ink-light">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">% Off</th>
                <th className="px-4 py-3 font-semibold">Min Purchase</th>
                <th className="px-4 py-3 font-semibold">Active</th>
                <th className="px-4 py-3 font-semibold">Auto-apply</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-light">
                    No coupons yet — the site falls back to the built-in defaults until you add one, or until the
                    supabase/schema.sql coupons migration is run.
                  </td>
                </tr>
              )}
              {coupons.map((c) => (
                <CouponRow
                  key={c.code}
                  row={c}
                  onSaved={(updated) => setCoupons((prev) => prev.map((p) => (p.code === updated.code ? updated : p)))}
                  onDeleted={(code) => setCoupons((prev) => prev.filter((p) => p.code !== code))}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewCouponForm onCreated={(created) => setCoupons((prev) => [...prev, created])} />
    </div>
  );
}
