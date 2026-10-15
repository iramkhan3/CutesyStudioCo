"use client";

import { useEffect, useState } from "react";
import type { Coupon } from "@/lib/constants";
import { useStore } from "@/components/StoreProvider";

/**
 * Client-side coupon config (for the cart/checkout discount preview and the
 * navbar's launch banner). Starts from the coupons the server rendered the
 * page with (app/layout.tsx → StoreProvider), so the first paint is already
 * correct — then refreshes once from /api/coupons in case the page was
 * served from cache. The order APIs never trust this; they always recompute
 * the discount server-side from their own authoritative fetch.
 */
export function useCoupons(): Coupon[] {
  const { coupons: initial } = useStore();
  const [coupons, setCoupons] = useState<Coupon[]>(initial);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/coupons")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.coupons) setCoupons(data.coupons);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return coupons;
}
