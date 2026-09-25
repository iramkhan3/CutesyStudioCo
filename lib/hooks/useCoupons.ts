"use client";

import { useEffect, useState } from "react";
import { COUPONS, type Coupon } from "@/lib/constants";

const FALLBACK: Coupon[] = Object.values(COUPONS).filter((c) => c.active);

/**
 * Client-side coupon config (for the cart/checkout discount preview and the
 * navbar's launch banner). Starts from the same fallback values used
 * server-side (see lib/coupons-data.ts) so there's no loading flash in the
 * common case where the DB hasn't diverged from them — silently updates once
 * the real fetch resolves. The order APIs never trust this; they always
 * recompute the discount server-side from their own authoritative fetch.
 */
export function useCoupons(): Coupon[] {
  const [coupons, setCoupons] = useState<Coupon[]>(FALLBACK);

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
