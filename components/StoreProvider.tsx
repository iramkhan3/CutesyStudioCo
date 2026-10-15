"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  DEFAULT_STORE_SETTINGS,
  countriesFor,
  whatsappLinkFor,
  type StoreSettings,
} from "@/lib/settings-defaults";
import { COUPONS, type Coupon } from "@/lib/constants";

type StoreContextValue = {
  settings: StoreSettings;
  // Checkout country dropdown, derived from the admin's shipping zones.
  countries: string[];
  whatsappLink: (message?: string) => string;
  // Active coupons as of this page render — lets the launch banner and the
  // cart preview render correctly on first paint (no flash of stale offers).
  coupons: Coupon[];
};

const StoreContext = createContext<StoreContextValue>({
  settings: DEFAULT_STORE_SETTINGS,
  countries: countriesFor(DEFAULT_STORE_SETTINGS.shipping),
  whatsappLink: (message) => whatsappLinkFor(DEFAULT_STORE_SETTINGS.whatsappNumber, message),
  coupons: Object.values(COUPONS).filter((c) => c.active),
});

/**
 * Hands the admin-editable store settings (Admin → Settings), loaded once
 * on the server in app/layout.tsx, to client components — the cart and
 * checkout shipping preview, contact links, etc. The server never trusts
 * these client copies: order routes re-read settings themselves.
 */
export function StoreProvider({
  settings,
  coupons,
  children,
}: {
  settings: StoreSettings;
  coupons: Coupon[];
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      settings,
      countries: countriesFor(settings.shipping),
      whatsappLink: (message?: string) => whatsappLinkFor(settings.whatsappNumber, message),
      coupons,
    }),
    [settings, coupons]
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  return useContext(StoreContext);
}
