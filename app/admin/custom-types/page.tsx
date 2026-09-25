"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { AdminCustomProductTypeRow } from "@/lib/admin-custom-types";
import ImageUploader from "@/components/admin/ImageUploader";

type FormState = {
  name: string;
  image: string;
  build_mrp_inr: string;
  build_price_inr: string;
  build_price_usd: string;
  surprise_mrp_inr: string;
  surprise_price_inr: string;
  surprise_price_usd: string;
};

function toFormState(row: AdminCustomProductTypeRow): FormState {
  return {
    name: row.name,
    image: row.image,
    build_mrp_inr: String(row.build_mrp_inr),
    build_price_inr: String(row.build_price_inr),
    build_price_usd: String(row.build_price_usd),
    surprise_mrp_inr: String(row.surprise_mrp_inr),
    surprise_price_inr: String(row.surprise_price_inr),
    surprise_price_usd: String(row.surprise_price_usd),
  };
}

function TypeCard({ row }: { row: AdminCustomProductTypeRow }) {
  const [form, setForm] = useState<FormState>(toFormState(row));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  function field<K extends keyof FormState>(key: K) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/custom-types/${row.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          image: form.image,
          build_mrp_inr: Number(form.build_mrp_inr),
          build_price_inr: Number(form.build_price_inr),
          build_price_usd: Number(form.build_price_usd),
          surprise_mrp_inr: Number(form.surprise_mrp_inr),
          surprise_price_inr: Number(form.surprise_price_inr),
          surprise_price_usd: Number(form.surprise_price_usd),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        if (data.fieldErrors) {
          setFieldErrors(Object.fromEntries(data.fieldErrors.map((f: { field: string; message: string }) => [f.field, f.message])));
        }
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl2 border px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-pastel/30 ${
      hasError ? "border-red-400" : "border-ink/15 focus:border-pastel"
    }`;

  return (
    <div className="rounded-xl2 border border-blush-light bg-white p-5 shadow-soft">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl2 border border-blush-light bg-cream-light">
          {form.image && (
            <Image src={form.image} alt={form.name} fill sizes="64px" className="object-cover" unoptimized />
          )}
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold text-ink-light">Display name</label>
          <input value={form.name} onChange={(e) => field("name")(e.target.value)} className={inputClass(!!fieldErrors.name)} />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-semibold text-ink-light">Reference image</label>
        <ImageUploader images={form.image ? [form.image] : []} onChange={(imgs) => field("image")(imgs[0] ?? "")} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-light">Build Your Own</h4>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-xs text-ink-light">MRP (₹)</label>
              <input type="number" min={0} step="0.01" value={form.build_mrp_inr} onChange={(e) => field("build_mrp_inr")(e.target.value)} className={inputClass(!!fieldErrors.build_mrp_inr)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-light">Price INR</label>
              <input type="number" min={0} step="0.01" value={form.build_price_inr} onChange={(e) => field("build_price_inr")(e.target.value)} className={inputClass(!!fieldErrors.build_price_inr)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-light">Price USD</label>
              <input type="number" min={0} step="0.01" value={form.build_price_usd} onChange={(e) => field("build_price_usd")(e.target.value)} className={inputClass(!!fieldErrors.build_price_usd)} />
            </div>
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-light">Surprise Me</h4>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-xs text-ink-light">MRP (₹)</label>
              <input type="number" min={0} step="0.01" value={form.surprise_mrp_inr} onChange={(e) => field("surprise_mrp_inr")(e.target.value)} className={inputClass(!!fieldErrors.surprise_mrp_inr)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-light">Price INR</label>
              <input type="number" min={0} step="0.01" value={form.surprise_price_inr} onChange={(e) => field("surprise_price_inr")(e.target.value)} className={inputClass(!!fieldErrors.surprise_price_inr)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-light">Price USD</label>
              <input type="number" min={0} step="0.01" value={form.surprise_price_usd} onChange={(e) => field("surprise_price_usd")(e.target.value)} className={inputClass(!!fieldErrors.surprise_price_usd)} />
            </div>
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-xs font-medium text-red-700">{error}</p>}
      {saved && <p className="mt-3 text-xs font-medium text-green-700">Saved.</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-full bg-pastel px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-pastel-dark disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

export default function AdminCustomTypesPage() {
  const [types, setTypes] = useState<AdminCustomProductTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/custom-types");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load.");
        if (!cancelled) setTypes(data.types);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
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
      <h1 className="font-heading text-3xl font-bold text-ink">Custom builder pricing</h1>
      <p className="mt-1 max-w-2xl text-ink-light">
        Edit the price, name, and reference image for each type in the &quot;Build Your Own&quot; / &quot;Surprise
        Me&quot; builder on the homepage. Changes go live immediately — no code or redeploy needed.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {loading && <p className="mt-6 text-ink-light">Loading…</p>}

      {!loading && types.length > 0 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {types.map((t) => (
            <TypeCard key={t.slug} row={t} />
          ))}
        </div>
      )}
    </div>
  );
}
