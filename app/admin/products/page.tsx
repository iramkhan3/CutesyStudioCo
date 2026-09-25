"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/data/products";
import { CATEGORIES } from "@/lib/constants";
import { formatMoney } from "@/lib/admin-format";
import { firstImageUrl, displayThumbnailUrl } from "@/lib/media";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [activeOnly, setActiveOnly] = useState<"all" | "active" | "inactive">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function toggleActive(product: Product) {
    setTogglingId(product.id);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [product.id], active: !product.active }),
      });
      if (!res.ok) throw new Error();
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)));
    } catch {
      setError("Couldn't update that product's status. Try again.");
    } finally {
      setTogglingId(null);
    }
  }

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products");
      if (!res.ok) throw new Error("Failed to load products.");
      const data = await res.json();
      setProducts(data.products);
    } catch {
      setError("Couldn't load products. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        if (category !== "all" && p.category !== category) return false;
        if (activeOnly === "active" && !p.active) return false;
        if (activeOnly === "inactive" && p.active) return false;
        if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      });
  }, [products, category, activeOnly, search]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        for (const p of filtered) next.delete(p.id);
        return next;
      }
      const next = new Set(prev);
      for (const p of filtered) next.add(p.id);
      return next;
    });
  }

  async function handleBulkSetActive(active: boolean) {
    setBulkSaving(true);
    setBulkError(null);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk update failed.");
      setSelected(new Set());
      await loadProducts();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Bulk update failed.");
    } finally {
      setBulkSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink">Products</h1>
          <p className="mt-1 text-ink-light">{products.length} total.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/products/reorder"
            className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
          >
            Reorder
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-full bg-pastel px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-pastel-dark"
          >
            + New product
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px] flex-1 rounded-full border border-ink/15 px-4 py-2 text-sm outline-none focus:border-pastel focus:ring-2 focus:ring-pastel/30"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-pastel focus:ring-2 focus:ring-pastel/30"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={activeOnly}
          onChange={(e) => setActiveOnly(e.target.value as typeof activeOnly)}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-pastel focus:ring-2 focus:ring-pastel/30"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl2 border border-pastel bg-pastel/10 px-4 py-3">
          <span className="text-sm font-semibold text-ink">{selected.size} selected</span>
          <button
            onClick={() => handleBulkSetActive(true)}
            disabled={bulkSaving}
            className="rounded-full bg-green-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            {bulkSaving ? "Working…" : "Activate"}
          </button>
          <button
            onClick={() => handleBulkSetActive(false)}
            disabled={bulkSaving}
            className="rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-ink-dark disabled:opacity-50"
          >
            {bulkSaving ? "Working…" : "Deactivate"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm font-semibold text-ink-light hover:text-ink"
          >
            Clear selection
          </button>
          {bulkError && <span className="text-sm font-medium text-red-700">{bulkError}</span>}
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl2 border border-blush-light bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-blush-light/50 text-ink-light">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAllFiltered}
                  aria-label="Select all visible products"
                  className="h-4 w-4"
                />
              </th>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Media</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-light">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-light">
                  No products match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((p) => {
                const rawThumb = firstImageUrl(p.images);
                const thumb = rawThumb ? displayThumbnailUrl(rawThumb) : undefined;
                return (
                  <tr key={p.id} className="border-t border-blush-light/70 hover:bg-cream-light">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleOne(p.id)}
                        aria-label={`Select ${p.name}`}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl2 border border-blush-light bg-cream-light">
                          {thumb && (
                            <Image
                              src={thumb}
                              alt={p.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized={thumb.endsWith(".svg") || thumb.startsWith("/products/all/")}
                            />
                          )}
                        </div>
                        <span className="font-semibold text-ink hover:text-pastel-dark">{p.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-light">{p.category}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">{formatMoney(p.price_inr, "INR")}</div>
                      {p.mrp_inr > p.price_inr && (
                        <div className="text-xs text-ink-light line-through">{formatMoney(p.mrp_inr, "INR")}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-light">{p.stock_quantity}</td>
                    <td className="px-4 py-3 text-ink-light">
                      {p.images.length} file{p.images.length === 1 ? "" : "s"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(p)}
                        disabled={togglingId === p.id}
                        title={p.active ? "Click to deactivate" : "Click to activate"}
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold transition hover:opacity-75 disabled:opacity-50 ${
                          p.active ? "bg-green-100 text-green-800" : "bg-blush-light text-ink"
                        }`}
                      >
                        {togglingId === p.id ? "…" : p.active ? "active" : "inactive"}
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
