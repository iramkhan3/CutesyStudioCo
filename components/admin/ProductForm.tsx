"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import type { Product } from "@/lib/data/products";
import type { ProductInput } from "@/lib/admin-products";
import ImageUploader from "@/components/admin/ImageUploader";

type FieldErrors = Record<string, string>;

export default function ProductForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Product;
  onSubmit: (input: ProductInput) => Promise<{ error?: string; fieldErrors?: { field: string; message: string }[] }>;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0].slug);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [mrpInr, setMrpInr] = useState(initial ? String(initial.mrp_inr) : "");
  const [priceInr, setPriceInr] = useState(initial ? String(initial.price_inr) : "");
  const [priceUsd, setPriceUsd] = useState(initial ? String(initial.price_usd) : "");
  const [stockQuantity, setStockQuantity] = useState(initial ? String(initial.stock_quantity) : "0");
  const [active, setActive] = useState(initial?.active ?? true);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    setSaved(false);

    const input: ProductInput = {
      name,
      slug: slug || undefined,
      category,
      description,
      mrp_inr: Number(mrpInr),
      price_inr: Number(priceInr),
      price_usd: Number(priceUsd),
      stock_quantity: Number(stockQuantity),
      active,
      images,
    };

    try {
      const result = await onSubmit(input);
      if (result.error) {
        setFormError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(Object.fromEntries(result.fieldErrors.map((f) => [f.field, f.message])));
        }
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Product images" error={fieldErrors.images}>
        <ImageUploader images={images} onChange={setImages} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={fieldErrors.name}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass(!!fieldErrors.name)}
          />
        </Field>
        <Field label="Slug (URL) — leave blank to auto-generate" error={fieldErrors.slug}>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated from name"
            className={inputClass(!!fieldErrors.slug)}
          />
        </Field>
      </div>

      <Field label="Category" error={fieldErrors.category}>
        <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className={inputClass(!!fieldErrors.category)}>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Description — short facts, not a paragraph" error={fieldErrors.description}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={400}
          placeholder="Product type, color(s), key details — e.g. &quot;Phone case. Lavender and pink. Hello Kitty and My Melody charms.&quot;"
          className={inputClass(!!fieldErrors.description)}
        />
        <p className="mt-1 text-right text-xs text-ink-light">{description.length}/400</p>
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="MRP (₹, strikethrough)" error={fieldErrors.mrp_inr}>
          <input type="number" min={0} step="0.01" value={mrpInr} onChange={(e) => setMrpInr(e.target.value)} className={inputClass(!!fieldErrors.mrp_inr)} />
        </Field>
        <Field label="Price INR (Razorpay)" error={fieldErrors.price_inr}>
          <input type="number" min={0} step="0.01" value={priceInr} onChange={(e) => setPriceInr(e.target.value)} className={inputClass(!!fieldErrors.price_inr)} />
        </Field>
        <Field label="Price USD (PayPal)" error={fieldErrors.price_usd}>
          <input type="number" min={0} step="0.01" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} className={inputClass(!!fieldErrors.price_usd)} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Stock quantity" error={fieldErrors.stock_quantity}>
          <input
            type="number"
            min={0}
            step="1"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            className={inputClass(!!fieldErrors.stock_quantity)}
          />
        </Field>
        <Field label="Status">
          <label className="flex items-center gap-2 py-2 text-sm text-ink">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
            Active (visible on the storefront)
          </label>
        </Field>
      </div>

      {formError && (
        <p role="alert" className="rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </p>
      )}
      {saved && <p className="rounded-xl2 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">Saved.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-pastel px-6 py-2.5 font-semibold text-white shadow-glow transition hover:bg-pastel-dark disabled:opacity-50"
      >
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function inputClass(hasError: boolean): string {
  return `w-full rounded-xl2 border px-4 py-2.5 text-ink outline-none focus:ring-2 focus:ring-pastel/30 ${
    hasError ? "border-red-400" : "border-ink/15 focus:border-pastel"
  }`;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-ink">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
