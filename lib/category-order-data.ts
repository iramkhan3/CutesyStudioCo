import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CATEGORIES } from "@/lib/constants";

function defaultOrder(): Record<string, number> {
  return Object.fromEntries(CATEGORIES.map((c, i) => [c.slug, i]));
}

type CategoryOrderRow = { slug: string; rank: number; enabled?: boolean };

async function fetchRows(): Promise<CategoryOrderRow[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase.from("category_order").select("*");
  if (error || !data || data.length === 0) return null;
  return data as CategoryOrderRow[];
}

/**
 * Category display-order ranks (lower = shown first) — DB-backed so the
 * admin can reprioritize which category appears first on the Shop page and
 * in the homepage highlight, without touching code. Falls back to
 * CATEGORIES' declared array order (phone-cases first) if the
 * `category_order` table is missing or empty.
 */
export async function getCategoryOrder(): Promise<Record<string, number>> {
  const rows = await fetchRows();
  if (!rows) return defaultOrder();
  return Object.fromEntries(rows.map((r) => [r.slug, r.rank]));
}

/**
 * Slugs the admin has switched off (category_order.enabled = false). Their
 * products disappear from the storefront and can't be checked out — see
 * lib/products.ts. A missing row, or a DB where the `enabled` column hasn't
 * been migrated yet, counts as enabled.
 */
export async function getDisabledCategories(): Promise<Set<string>> {
  const rows = await fetchRows();
  if (!rows) return new Set();
  return new Set(rows.filter((r) => r.enabled === false).map((r) => r.slug));
}
