import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CATEGORIES } from "@/lib/constants";

export type AdminCategoryOrderRow = { slug: string; name: string; rank: number };

function defaults(): AdminCategoryOrderRow[] {
  return CATEGORIES.map((c, i) => ({ slug: c.slug, name: c.name, rank: i }));
}

/** Lists categories in current display-priority order, for the admin reorder UI. */
export async function adminListCategoryOrder(): Promise<AdminCategoryOrderRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return defaults();

  const { data, error } = await supabase.from("category_order").select("*").order("rank", { ascending: true });
  if (error || !data || data.length === 0) return defaults();

  const nameBySlug = new Map<string, string>(CATEGORIES.map((c) => [c.slug, c.name]));
  return (data as { slug: string; rank: number }[]).map((r) => ({
    slug: r.slug,
    name: nameBySlug.get(r.slug) ?? r.slug,
    rank: r.rank,
  }));
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
