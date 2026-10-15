import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CATEGORIES } from "@/lib/constants";
import { getCategories, revalidateConfig, type Category } from "@/lib/settings";

export type AdminCategoryOrderRow = Category & {
  // Active products in this category (regardless of the category's own on/off).
  productCount: number;
  // All products in this category, active or not — a category can only be
  // deleted when this is 0.
  totalProductCount: number;
};

const MIGRATION_HINT = " — run the latest supabase/schema.sql in the Supabase SQL Editor first.";
const isBuiltIn = (slug: string) => CATEGORIES.some((c) => c.slug === slug);

/** Every category in display order, with product counts, for Admin → Categories. */
export async function adminListCategoryOrder(): Promise<AdminCategoryOrderRow[]> {
  const categories = await getCategories();
  const supabase = getSupabaseAdmin();
  const active = new Map<string, number>();
  const total = new Map<string, number>();
  if (supabase) {
    const { data } = await supabase.from("products").select("category, active");
    for (const p of (data ?? []) as { category: string; active: boolean }[]) {
      total.set(p.category, (total.get(p.category) ?? 0) + 1);
      if (p.active) active.set(p.category, (active.get(p.category) ?? 0) + 1);
    }
  }
  return categories.map((c) => ({ ...c, productCount: active.get(c.slug) ?? 0, totalProductCount: total.get(c.slug) ?? 0 }));
}

/** Updates (or creates) a category's row with the given fields. */
async function upsertCategoryFields(slug: string, fields: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Database isn't configured." };

  const { data: existing } = await supabase.from("category_order").select("slug").eq("slug", slug).maybeSingle();
  let error;
  if (existing) {
    ({ error } = await supabase.from("category_order").update(fields).eq("slug", slug));
  } else {
    const current = await getCategories();
    const rank = current.find((c) => c.slug === slug)?.rank ?? Math.max(0, ...current.map((c) => c.rank)) + 1;
    ({ error } = await supabase.from("category_order").insert({ slug, rank, ...fields }));
  }
  if (error) return { ok: false, error: error.message + (/column|schema cache/i.test(error.message) ? MIGRATION_HINT : "") };
  revalidateConfig();
  return { ok: true };
}

async function exists(slug: string) {
  return (await getCategories()).some((c) => c.slug === slug);
}

/** Assigns sequential rank values (0, 1, 2, ...) matching the given slug order. */
export async function adminReorderCategories(orderedSlugs: string[]): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Database isn't configured." };

  const known = new Set((await getCategories()).map((c) => c.slug));
  const validSlugs = orderedSlugs.filter((slug) => known.has(slug));
  if (validSlugs.length === 0) return { ok: false, error: "No categories to reorder." };

  for (let i = 0; i < validSlugs.length; i++) {
    const { error } = await supabase.from("category_order").upsert({ slug: validSlugs[i], rank: i }, { onConflict: "slug" });
    if (error) return { ok: false, error: error.message };
  }
  revalidateConfig();
  return { ok: true };
}

/** Turns a category on/off on the storefront (see getDisabledCategories). */
export async function adminSetCategoryEnabled(slug: string, enabled: boolean) {
  if (!(await exists(slug))) return { ok: false, error: "Unknown category." };
  return upsertCategoryFields(slug, { enabled });
}

/** Sets a category's "starting from" price for custom requests (null clears it). */
export async function adminSetCategoryCustomFrom(slug: string, customFromInr: number | null) {
  if (!(await exists(slug))) return { ok: false, error: "Unknown category." };
  return upsertCategoryFields(slug, { custom_from_inr: customFromInr });
}

export type CategoryTextInput = { name: string; tagline: string; description: string };

export function validateCategoryText(input: Partial<CategoryTextInput>): string | null {
  if (typeof input.name !== "string" || input.name.trim().length < 2 || input.name.trim().length > 60) {
    return "Name must be 2–60 characters.";
  }
  if (typeof input.tagline !== "string" || input.tagline.length > 120) return "Tagline must be at most 120 characters.";
  if (typeof input.description !== "string" || input.description.length > 600) return "Description must be at most 600 characters.";
  return null;
}

/** Renames / re-describes a category (built-in or created). */
export async function adminUpdateCategoryText(slug: string, input: CategoryTextInput) {
  if (!(await exists(slug))) return { ok: false, error: "Unknown category." };
  return upsertCategoryFields(slug, {
    name: input.name.trim(),
    tagline: input.tagline.trim(),
    description: input.description.trim(),
  });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

/** Creates a new category at the end of the list (enabled). */
export async function adminCreateCategory(input: CategoryTextInput): Promise<{ ok: boolean; error?: string; slug?: string }> {
  const base = slugify(input.name);
  if (!base) return { ok: false, error: "Name needs at least one letter or number." };
  // "made-to-order" is the shop's virtual tab for empty categories (CategoryFilter).
  const taken = new Set([...(await getCategories()).map((c) => c.slug), "made-to-order"]);
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;

  const result = await upsertCategoryFields(slug, {
    name: input.name.trim(),
    tagline: input.tagline.trim(),
    description: input.description.trim(),
    enabled: true,
  });
  return { ...result, slug };
}

/**
 * Deletes a category created in the admin, only if no product (active or
 * not) uses it. Built-in categories can be renamed or disabled, not deleted.
 */
export async function adminDeleteCategory(slug: string): Promise<{ ok: boolean; error?: string }> {
  if (isBuiltIn(slug)) return { ok: false, error: "Built-in categories can't be deleted — disable it instead." };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Database isn't configured." };

  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category", slug);
  if ((count ?? 0) > 0) {
    return { ok: false, error: `${count} product${count === 1 ? " still uses" : "s still use"} this category — move them first, or disable it instead.` };
  }
  const { error } = await supabase.from("category_order").delete().eq("slug", slug);
  if (error) return { ok: false, error: error.message };
  revalidateConfig();
  return { ok: true };
}
