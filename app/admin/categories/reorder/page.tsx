"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AdminCategoryOrderRow } from "@/lib/admin-category-order";

export default function ReorderCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const dragIndex = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/categories/reorder");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load categories.");
        if (!cancelled) setCategories(data.categories);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load categories.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, overIndex: number) {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === overIndex) return;

    setCategories((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(overIndex, 0, moved);
      return next;
    });
    dragIndex.current = overIndex;
    setDirty(true);
  }

  function handleDragEnd() {
    dragIndex.current = null;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedSlugs: categories.map((c) => c.slug) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save order.");
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save order.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link href="/admin/products" className="text-sm font-semibold text-pastel-dark hover:underline">
        ← Back to products
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink">Reorder categories</h1>
          <p className="mt-1 max-w-xl text-ink-light">
            Drag to choose which category shows first on the Shop page and in the homepage highlight — phone cases
            lead by default. Within a category, use{" "}
            <Link href="/admin/products/reorder" className="underline">
              Reorder products
            </Link>{" "}
            to put your best pieces first.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="rounded-full bg-pastel px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-pastel-dark disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save order"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      {saved && <p className="mt-4 rounded-xl2 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">Order saved.</p>}
      {dirty && !saved && (
        <p className="mt-4 rounded-xl2 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Unsaved changes — click &quot;Save order&quot; to make this live.
        </p>
      )}

      {loading && <p className="mt-6 text-ink-light">Loading…</p>}

      {!loading && categories.length > 0 && (
        <ol className="mt-6 space-y-2">
          {categories.map((c, i) => (
            <li
              key={c.slug}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className="flex cursor-grab items-center gap-3 rounded-xl2 border border-blush-light bg-white p-3 shadow-soft active:cursor-grabbing"
            >
              <span className="w-8 text-center text-sm font-bold text-ink-light">{i + 1}</span>
              <span className="text-ink-light">⠿</span>
              <span className="font-semibold text-ink">{c.name}</span>
              <span className="ml-auto text-xs text-ink-light">{c.slug}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
