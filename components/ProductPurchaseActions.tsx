"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import type { Product } from "@/lib/data/products";
import { CartIcon, MinusIcon, PlusIcon } from "@/components/Icons";

export function ProductPurchaseActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const outOfStock = product.stock_quantity === 0;

  function handleAddToCart() {
    addItem(
      {
        kind: "product",
        id: product.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        priceInr: product.price_inr,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/cart");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="font-heading text-sm font-semibold text-ink/70">Quantity</span>
        <div className="flex items-center gap-3 rounded-full border-2 border-ink/10 bg-white px-3 py-1.5">
          <button
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="rounded-full p-1 text-ink/70 hover:bg-blush-light"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <span className="w-6 text-center font-heading font-semibold">{quantity}</span>
          <button
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(product.stock_quantity || 1, q + 1))}
            className="rounded-full p-1 text-ink/70 hover:bg-blush-light"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {outOfStock ? (
        <span className="pill-tag w-fit bg-ink/10 text-ink/60">Currently sold out</span>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={handleAddToCart} className="btn-secondary flex-1">
            <CartIcon className="h-4 w-4" /> {added ? "Added to Cart!" : "Add to Cart"}
          </button>
          <button onClick={handleBuyNow} className="btn-primary flex-1">
            Buy Now
          </button>
        </div>
      )}
    </div>
  );
}
