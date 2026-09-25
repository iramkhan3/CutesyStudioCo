"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import type { Product } from "@/lib/data/products";
import { firstImageUrl } from "@/lib/media";
import { CartIcon, CheckCircleIcon } from "@/components/Icons";
// MinusIcon, PlusIcon were used by the commented-out quantity stepper below.

export function QuickAddButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  // Quantity stepper on the card itself is commented out below (see
  // "increase quantity" block) — quantity is still adjustable on the cart
  // page, this just keeps the thumbnail simpler. `quantity` stays fixed at
  // 1 here; uncomment the stepper block to bring per-card quantity back.
  const [quantity] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock_quantity === 0;
  // const atMax = quantity >= product.stock_quantity;

  function addToCart() {
    addItem(
      {
        kind: "product",
        id: product.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: firstImageUrl(product.images) ?? "",
        mrpInr: product.mrp_inr,
        priceInr: product.price_inr,
        category: product.category,
      },
      quantity
    );
  }

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    addToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    addToCart();
    router.push("/cart");
  }

  if (outOfStock) {
    return (
      <button
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-full bg-lavender-light px-4 py-2 font-heading text-sm font-semibold text-ink opacity-50"
      >
        Sold Out
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Per-card quantity stepper — commented out, see note above `quantity` state.
      <div className="flex items-center justify-center gap-1.5 rounded-full border border-ink/15 px-2 py-1.5">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={(e) => {
            e.preventDefault();
            setQuantity((q) => Math.max(1, q - 1));
          }}
          disabled={quantity <= 1}
          className="text-ink/70 transition-colors hover:text-pastel disabled:cursor-not-allowed disabled:opacity-30"
        >
          <MinusIcon className="h-3.5 w-3.5" />
        </button>
        <span className="w-4 text-center text-xs font-heading font-semibold">{quantity}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={(e) => {
            e.preventDefault();
            setQuantity((q) => Math.min(product.stock_quantity, q + 1));
          }}
          disabled={atMax}
          className="text-ink/70 transition-colors hover:text-pastel disabled:cursor-not-allowed disabled:opacity-30"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleAdd}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-lavender-light px-3 py-2 font-heading text-xs font-semibold text-ink transition-colors hover:bg-lavender"
        >
          {added ? (
            <>
              <CheckCircleIcon className="h-3.5 w-3.5" /> Added!
            </>
          ) : (
            <>
              <CartIcon className="h-3.5 w-3.5" /> Add
            </>
          )}
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-1 rounded-full bg-pastel px-3 py-2 font-heading text-xs font-semibold text-white transition-colors hover:bg-pastel-dark"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
