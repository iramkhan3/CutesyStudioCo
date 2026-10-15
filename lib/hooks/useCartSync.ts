"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import type { CartLineItem } from "@/lib/types";
import type { CartRefreshCustomType, CartRefreshProduct } from "@/app/api/cart/route";

/**
 * Brings the saved (browser) cart up to date with the store on page load:
 * current prices, names, images and categories; quantities capped to stock;
 * sold-out, hidden or deleted items removed. Returns short notices
 * describing anything that changed, for the page to show.
 */
export function useCartSync(): string[] {
  const [notices, setNotices] = useState<string[]>([]);

  useEffect(() => {
    const { items } = useCartStore.getState();
    if (items.length === 0) return;
    let cancelled = false;

    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: items.filter((i) => i.kind === "product").map((i) => i.productId) }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { products: CartRefreshProduct[]; customTypes: CartRefreshCustomType[] } | null) => {
        if (cancelled || !data) return;
        // Re-read: the cart may have changed while the request was in flight.
        const current = useCartStore.getState().items;
        const { items: next, notices } = reconcile(current, data.products, data.customTypes);
        if (notices.length > 0) {
          useCartStore.setState({ items: next });
          setNotices(notices);
        } else if (JSON.stringify(next) !== JSON.stringify(current)) {
          useCartStore.setState({ items: next }); // silent updates (e.g. category, image)
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return notices;
}

function reconcile(
  items: CartLineItem[],
  products: CartRefreshProduct[],
  customTypes: CartRefreshCustomType[]
): { items: CartLineItem[]; notices: string[] } {
  const notices: string[] = [];
  const next: CartLineItem[] = [];

  for (const item of items) {
    if (item.kind === "product") {
      const p = products.find((x) => x.id === item.productId);
      if (!p || !p.available) {
        notices.push(`"${item.name}" is no longer available, so we removed it from your cart.`);
        continue;
      }
      let quantity = item.quantity;
      if (quantity > p.stock) {
        quantity = p.stock;
        notices.push(`Only ${p.stock} left of "${p.name}" — we updated the quantity.`);
      }
      if (p.priceInr !== item.priceInr) {
        notices.push(`The price of "${p.name}" is now ₹${p.priceInr.toLocaleString("en-IN")}.`);
      }
      next.push({ ...item, slug: p.slug, name: p.name, image: p.image || item.image, mrpInr: p.mrpInr, priceInr: p.priceInr, category: p.category, quantity });
    } else {
      const t = customTypes.find((x) => x.slug === item.customization.productType);
      if (!t) {
        notices.push(`"${item.name}" can't be made right now, so we removed it from your cart.`);
        continue;
      }
      const pricing = item.customization.mode === "surprise" ? t.surprise : t.build;
      if (pricing.priceInr !== item.priceInr) {
        notices.push(`The price of "${item.name}" is now ₹${pricing.priceInr.toLocaleString("en-IN")}.`);
      }
      next.push({ ...item, mrpInr: pricing.mrpInr, priceInr: pricing.priceInr });
    }
  }
  return { items: next, notices };
}
