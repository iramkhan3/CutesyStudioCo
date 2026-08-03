"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import type { Product } from "@/lib/data/products";
import { CartIcon, CheckCircleIcon } from "@/components/Icons";

export function QuickAddButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(
      {
        kind: "product",
        id: product.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        priceUsd: product.price_usd,
        priceInr: product.price_inr,
      },
      1
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      onClick={handleAdd}
      disabled={product.stock_quantity === 0}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-lavender-light px-4 py-2 font-heading text-sm font-semibold text-ink transition-colors hover:bg-lavender disabled:cursor-not-allowed disabled:opacity-50"
    >
      {product.stock_quantity === 0 ? (
        "Sold Out"
      ) : added ? (
        <>
          <CheckCircleIcon className="h-4 w-4" /> Added!
        </>
      ) : (
        <>
          <CartIcon className="h-4 w-4" /> Add to Cart
        </>
      )}
    </button>
  );
}
