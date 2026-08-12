/**
 * Whole-number discount percentage for an MRP-vs-price display. Returns 0
 * when there's no real discount (mrp <= price) so callers can just check
 * `percent > 0` before rendering a badge.
 */
export function discountPercent(mrpInr: number, priceInr: number): number {
  if (mrpInr <= priceInr || mrpInr <= 0) return 0;
  return Math.round(((mrpInr - priceInr) / mrpInr) * 100);
}
