"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";
import type { ProductInput } from "@/lib/admin-products";

export default function NewProductPage() {
  const router = useRouter();

  async function handleSubmit(input: ProductInput) {
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Failed to create product.", fieldErrors: data.fieldErrors };
    router.push(`/admin/products/${data.product.id}`);
    return {};
  }

  return (
    <div>
      <Link href="/admin/products" className="text-sm font-semibold text-pastel-dark hover:underline">
        ← Back to products
      </Link>
      <h1 className="mt-3 font-heading text-3xl font-bold text-ink">New product</h1>
      <div className="mt-6 max-w-2xl">
        <ProductForm onSubmit={handleSubmit} submitLabel="Create product" />
      </div>
    </div>
  );
}
