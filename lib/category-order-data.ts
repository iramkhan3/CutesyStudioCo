import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CATEGORIES } from "@/lib/constants";

function defaultOrder(): Record<string, number> {
  return Object.fromEntries(CATEGORIES.map((c, i) => [c.slug, i]));
}

/**
 * Category display-order ranks (lower = shown first) — DB-backed so the
 * admin can reprioritize which category appears first on the Shop page and
 * in the homepage highlight, without touching code. Falls back to
 * CATEGORIES' declared array order (phone-cases first) if the
 * `category_order` table is missing or empty.
 */
export async function getCategoryOrder(): Promise<Record<string, number>> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return defaultOrder();

  const { data, error } = await supabase.from("category_order").select("*");
  if (error || !data || data.length === 0) return defaultOrder();

  return Object.fromEntries((data as { slug: string; rank: number }[]).map((r) => [r.slug, r.rank]));
}
