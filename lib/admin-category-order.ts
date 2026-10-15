import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CATEGORIES } from "@/lib/constants";

export type AdminCategoryOrderRow = {
  slug: string;
  name: string;
  rank: number;
  enabled: boolean;
  // Active products in this category (regardless of the category's own on/off).
  productCount: number;
  // "Starting from" price (per piece) for custom requests; null = price on request.
  customFromInr: number | null;
};

/**
 * Lists every category in current display-priority order, for the admin
 * categories page. Categories missing from the `category_order` table (e.g.
 * newly added in lib/constants.ts) are appended at the end, enabled.
 */
export async function adminListCategoryOrder(): Promise<AdminCategoryOrderRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return CATEGORIES.map((c, i) => ({ slug: c.slug, name: c.name, rank: i, enabled: true, productCount: 0, customFromInr: null }));

  const [{ data: rows }, { data: products }] = await Promise.all([
    supabase.from("category_order").select("*"),
    supabase.from("products").select("category").eq("active", true),
  ]);

  const rowBySlug = new Map((rows ?? []).map((r: { slug: string; rank: number; enabled?: boolean; custom_from_inr?: number | null }) => [r.slug, r]));
  const counts = new Map<string, number>();
  for (const p of (products ?? []) as { category: string }[]) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);

  return CATEGORIES.map((c, i) => {
    const row = rowBySlug.get(c.slug);
    return {
      slug: c.slug,
      name: c.name,
      rank: row ? row.rank : 1000 + i,
      enabled: row?.enabled !== false,
      productCount: counts.get(c.slug) ?? 0,
      customFromInr: row?.custom_from_inr == null ? null : Number(row.custom_from_inr),
    };
  }).sort((a, b) => a.rank - b.rank);
}

/** Assigns sequential rank values (0, 1, 2, ...) matching the given slug order. */
export async function adminReorderCategories(orderedSlugs: string[]): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Database isn't configured." };

  const validSlugs = orderedSlugs.filter((slug) => CATEGORIES.some((c) => c.slug === slug));
  if (validSlugs.length === 0) return { ok: false, error: "No categories to reorder." };

  for (let i = 0; i < validSlugs.length; i++) {
    const { error } = await supabase.from("category_order").upsert({ slug: validSlugs[i], rank: i }, { onConflict: "slug" });
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}

/** Turns a category on/off on the storefront (see getDisabledCategories). */
export async function adminSetCategoryEnabled(slug: string, enabled: boolean): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Database isn't configured." };
  if (!CATEGORIES.some((c) => c.slug === slug)) return { ok: false, error: "Unknown category." };

  const { data: existing } = await supabase.from("category_order").select("slug").eq("slug", slug).maybeSingle();
  const { error } = existing
    ? await supabase.from("category_order").update({ enabled }).eq("slug", slug)
    : await supabase
        .from("category_order")
        .insert({ slug, rank: CATEGORIES.findIndex((c) => c.slug === slug) + 1000, enabled });

  if (error) {
    // Most likely cause: the `enabled` column migration hasn't been run yet.
    const hint = /enabled/i.test(error.message) ? " — run the latest supabase/schema.sql in the Supabase SQL Editor first." : "";
    return { ok: false, error: error.message + hint };
  }
  return { ok: true };
}

/** Sets a category's "starting from" price for custom requests (null clears it). */
export async function adminSetCategoryCustomFrom(slug: string, customFromInr: number | null): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Database isn't configured." };
  if (!CATEGORIES.some((c) => c.slug === slug)) return { ok: false, error: "Unknown category." };

  const { data: existing } = await supabase.from("category_order").select("slug").eq("slug", slug).maybeSingle();
  const { error } = existing
    ? await supabase.from("category_order").update({ custom_from_inr: customFromInr }).eq("slug", slug)
    : await supabase
        .from("category_order")
        .insert({ slug, rank: CATEGORIES.findIndex((c) => c.slug === slug) + 1000, custom_from_inr: customFromInr });
  if (error) {
    const hint = /custom_from_inr/i.test(error.message) ? " — run the latest supabase/schema.sql in the Supabase SQL Editor first." : "";
    return { ok: false, error: error.message + hint };
  }
  return { ok: true };
}
