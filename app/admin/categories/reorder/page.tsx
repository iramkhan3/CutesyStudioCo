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
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", tagline: "", description: "" });
  const [newCategory, setNewCategory] = useState<{ name: string; tagline: string; description: string } | null>(null);
  const [busy, setBusy] = useState(false);

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
  }, [reloadKey]);

  // Create / edit text / delete — each saves immediately, then reloads the list.
  async function mutate(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setReloadKey((k) => k + 1);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function startEdit(c: AdminCategoryOrderRow) {
    setEditingSlug(c.slug);
    setDraft({ name: c.name, tagline: c.tagline, description: c.description });
  }

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

  // Saves immediately (independent of the drag order's "Save order" button),
  // optimistically flipping the switch and reverting it if the save fails.
  async function handleToggle(slug: string, enabled: boolean) {
    setError(null);
    setTogglingSlug(slug);
    setCategories((prev) => prev.map((c) => (c.slug === slug ? { ...c, enabled } : c)));
    try {
      const res = await fetch(`/api/admin/categories/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update category.");
    } catch (err) {
      setCategories((prev) => prev.map((c) => (c.slug === slug ? { ...c, enabled: !enabled } : c)));
      setError(err instanceof Error ? err.message : "Failed to update category.");
    } finally {
      setTogglingSlug(null);
    }
  }

  // Custom-request "starting from" price — saved when the input loses focus.
  async function handleFromSave(slug: string, raw: string) {
    const value = raw.trim() === "" ? null : Number(raw);
    const current = categories.find((c) => c.slug === slug)?.customFromInr ?? null;
    if (value === current || (value !== null && !Number.isFinite(value))) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customFromInr: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save starting price.");
      setCategories((prev) => prev.map((c) => (c.slug === slug ? { ...c, customFromInr: value } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save starting price.");
    }
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
          <h1 className="font-heading text-3xl font-bold text-ink">Categories</h1>
          <p className="mt-1 max-w-xl text-ink-light">
            Use the switch to turn a category on or off — a disabled category, and every product in it, is hidden
            from the site instantly (the products themselves aren&apos;t changed). Drag to choose which category
            shows first on the Shop page and in the homepage highlight. Within a category, use{" "}
            <Link href="/admin/products/reorder" className="underline">
              Reorder products
            </Link>{" "}
            to put your best pieces first.
          </p>
          <p className="mt-2 max-w-xl text-sm text-ink-light">
            <strong>Custom from ₹</strong> is the &quot;starting from&quot; price per piece customers see on the{" "}
            <Link href="/custom-request" className="underline">
              custom request form
            </Link>
            , and it&apos;s pre-filled when you approve a request (× quantity). Leave blank for &quot;price on
            request&quot;. Disabled categories can&apos;t be requested.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setNewCategory(newCategory ? null : { name: "", tagline: "", description: "" })}
          className="rounded-full border-2 border-pastel-light px-5 py-2 text-sm font-semibold text-ink hover:border-pastel"
        >
          + New category
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="rounded-full bg-pastel px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-pastel-dark disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save order"}
        </button>
        </div>
      </div>

      {newCategory && (
        <div className="mt-5 rounded-xl2 border-2 border-pastel-light bg-white p-5 shadow-soft">
          <h2 className="font-heading text-lg font-bold text-ink">New category</h2>
          <CategoryTextFields value={newCategory} onChange={setNewCategory} />
          <div className="mt-3 flex gap-2">
            <button
              disabled={busy || newCategory.name.trim().length < 2}
              onClick={async () => {
                if (await mutate("/api/admin/categories", "POST", newCategory)) setNewCategory(null);
              }}
              className="rounded-full bg-pastel px-5 py-2 text-sm font-semibold text-white hover:bg-pastel-dark disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create category"}
            </button>
            <button onClick={() => setNewCategory(null)} className="rounded-full px-4 py-2 text-sm text-ink-light hover:underline">
              Cancel
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-light">
            New categories start enabled at the bottom of the list. They show in the shop once a product uses them, and
            customers can request custom pieces in them right away.
          </p>
        </div>
      )}

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
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              draggable={editingSlug !== c.slug}
              className={`flex cursor-grab flex-wrap items-center gap-3 rounded-xl2 border border-blush-light bg-white p-3 shadow-soft active:cursor-grabbing ${
                c.enabled ? "" : "opacity-60"
              }`}
            >
              <span className="w-8 text-center text-sm font-bold text-ink-light">{i + 1}</span>
              <span className="text-ink-light">⠿</span>
              <span className="min-w-0">
                <span className="block font-semibold text-ink">
                  {c.name}
                  {!c.builtIn && <span className="ml-2 rounded-full bg-lavender-light px-2 py-0.5 text-[10px] font-semibold text-ink-light">custom</span>}
                </span>
                <span className="block text-xs text-ink-light">
                  {c.productCount} active product{c.productCount === 1 ? "" : "s"}
                  {c.enabled && c.productCount === 0 && " · hidden from shop filters until it has one"}
                </span>
              </span>
              {c.slug !== "ready-to-ship" && (
                <label
                  className="ml-auto flex shrink-0 items-center gap-1 text-xs text-ink-light"
                  title="Custom requests: 'starting from' price per piece, shown on the request form and pre-filled when you approve. Blank = price on request."
                >
                  Custom from ₹
                  <input
                    key={`${c.slug}-${c.customFromInr}`}
                    type="number"
                    min={0}
                    defaultValue={c.customFromInr ?? ""}
                    placeholder="—"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onBlur={(e) => handleFromSave(c.slug, e.target.value)}
                    className="w-20 rounded-lg border border-ink/15 px-2 py-1 text-sm text-ink"
                  />
                </label>
              )}
              <label
                className={`${c.slug === "ready-to-ship" ? "ml-auto" : ""} flex shrink-0 cursor-pointer items-center gap-2`}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <span className={`text-xs font-semibold ${c.enabled ? "text-green-700" : "text-ink-light"}`}>
                  {c.enabled ? "Enabled" : "Disabled"}
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label={`${c.enabled ? "Disable" : "Enable"} ${c.name}`}
                  checked={c.enabled}
                  disabled={togglingSlug === c.slug}
                  onChange={(e) => handleToggle(c.slug, e.target.checked)}
                  className="peer sr-only"
                />
                <span className="relative h-6 w-11 rounded-full bg-ink/20 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-pastel peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-pastel peer-disabled:opacity-50" />
              </label>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => (editingSlug === c.slug ? setEditingSlug(null) : startEdit(c))}
                className="shrink-0 rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold text-ink hover:bg-blush-light"
              >
                {editingSlug === c.slug ? "Close" : "Edit"}
              </button>
              {editingSlug === c.slug && (
                <div className="basis-full cursor-default" draggable={false} onDragStart={(e) => e.preventDefault()} onMouseDown={(e) => e.stopPropagation()}>
                  <CategoryTextFields value={draft} onChange={setDraft} />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      disabled={busy || draft.name.trim().length < 2}
                      onClick={async () => {
                        if (await mutate(`/api/admin/categories/${c.slug}`, "PATCH", draft)) setEditingSlug(null);
                      }}
                      className="rounded-full bg-pastel px-5 py-2 text-sm font-semibold text-white hover:bg-pastel-dark disabled:opacity-50"
                    >
                      {busy ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => setEditingSlug(null)} className="rounded-full px-4 py-2 text-sm text-ink-light hover:underline">
                      Cancel
                    </button>
                    {!c.builtIn && (
                      <button
                        disabled={busy || c.totalProductCount > 0}
                        title={c.totalProductCount > 0 ? "Move or delete its products first" : undefined}
                        onClick={async () => {
                          if (confirm(`Delete the "${c.name}" category? This can't be undone.`)) {
                            if (await mutate(`/api/admin/categories/${c.slug}`, "DELETE")) setEditingSlug(null);
                          }
                        }}
                        className="ml-auto rounded-full px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                      >
                        Delete category
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-ink-light">
                    {c.builtIn
                      ? "Built-in category: you can rename it or switch it off, but not delete it."
                      : c.totalProductCount > 0
                        ? `Can't be deleted while ${c.totalProductCount} product(s) use it — move them to another category first.`
                        : "Not used by any product, so it can be deleted."}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function CategoryTextFields({
  value,
  onChange,
}: {
  value: { name: string; tagline: string; description: string };
  onChange: (v: { name: string; tagline: string; description: string }) => void;
}) {
  const field = "mt-1 w-full rounded-xl2 border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pastel";
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-xs font-semibold text-ink-light">
        Name
        <input value={value.name} maxLength={60} onChange={(e) => onChange({ ...value, name: e.target.value })} className={field} placeholder="e.g. Phone Grips" />
      </label>
      <label className="text-xs font-semibold text-ink-light">
        Tagline (optional)
        <input value={value.tagline} maxLength={120} onChange={(e) => onChange({ ...value, tagline: e.target.value })} className={field} placeholder="e.g. Tiny, sweet, and super grippy" />
      </label>
      <label className="text-xs font-semibold text-ink-light sm:col-span-2">
        Description (shown at the top of the shop when this category is selected)
        <textarea value={value.description} rows={3} maxLength={600} onChange={(e) => onChange({ ...value, description: e.target.value })} className={field} />
      </label>
    </div>
  );
}
