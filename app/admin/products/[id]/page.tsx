"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";
import type { Product } from "@/lib/data/products";
import type { ProductInput } from "@/lib/admin-products";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/admin/products/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load product.");
        if (!cancelled) setProduct(data.product);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load product.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleSubmit(input: ProductInput) {
    const res = await fetch(`/api/admin/products/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Failed to save product.", fieldErrors: data.fieldErrors };
    setProduct(data.product);
    return {};
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/products/${params.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product.");
      router.push("/admin/products");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete product.");
      setDeleting(false);
    }
  }

  if (loading) return <div className="animate-pulse text-ink-light">Loading product…</div>;

  if (loadError || !product) {
    return (
      <div>
        <Link href="/admin/products" className="text-sm font-semibold text-pastel-dark hover:underline">
          ← Back to products
        </Link>
        <p role="alert" className="mt-4 rounded-xl2 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {loadError || "Product not found."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/products" className="text-sm font-semibold text-pastel-dark hover:underline">
        ← Back to products
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold text-ink">{product.name}</h1>
        <p className="text-sm text-ink-light">/shop/{product.slug}</p>
      </div>

      <div className="mt-6 max-w-2xl">
        <ProductForm initial={product} onSubmit={handleSubmit} submitLabel="Save changes" />
      </div>

      <div className="mt-10 max-w-2xl rounded-xl2 border border-red-200 bg-red-50/50 p-4">
        <h2 className="font-heading text-lg font-bold text-red-900">Danger zone</h2>
        <p className="mt-1 text-sm text-red-800">
          Deleting a product removes it permanently. Past orders that included it keep their own saved record — they
          won&apos;t be affected. If you just want to stop selling it, toggle &quot;Active&quot; off above instead.
        </p>
        {deleteError && <p className="mt-2 text-sm font-medium text-red-700">{deleteError}</p>}
        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="mt-3 rounded-full border border-red-400 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            Delete this product
          </button>
        ) : (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm font-semibold text-red-900">Are you sure?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete permanently"}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
