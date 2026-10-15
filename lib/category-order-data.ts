import "server-only";
import { getCategories } from "@/lib/settings";

/**
 * Category display-order ranks (lower = shown first), admin-configurable in
 * Admin → Categories. Thin wrapper over getCategories() (lib/settings.ts),
 * which falls back to CATEGORIES' declared order if the table is empty.
 */
export async function getCategoryOrder(): Promise<Record<string, number>> {
  return Object.fromEntries((await getCategories()).map((c) => [c.slug, c.rank]));
}

/**
 * Slugs the admin has switched off. Their products disappear from the
 * storefront and can't be checked out — see lib/products.ts.
 */
export async function getDisabledCategories(): Promise<Set<string>> {
  return new Set((await getCategories()).filter((c) => !c.enabled).map((c) => c.slug));
}
