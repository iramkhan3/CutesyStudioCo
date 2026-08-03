import { FREE_SHIPPING_THRESHOLD_INR, SHIPPING_FLAT_RATE_INR } from "@/lib/constants";

/**
 * Domestic (India) flat-rate shipping, waived above the free-shipping
 * threshold. Evaluated against the pre-discount subtotal — shared by the
 * cart/checkout preview (client) and the order API (server, authoritative).
 */
export function calculateShipping(subtotalInr: number): number {
  if (subtotalInr >= FREE_SHIPPING_THRESHOLD_INR) return 0;
  return SHIPPING_FLAT_RATE_INR;
}
