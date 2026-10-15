import "server-only";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CATEGORIES } from "@/lib/constants";
import {
  mergeHomepage,
  mergeStoreSettings,
  type Category,
  type HomepageContent,
  type StoreSettings,
} from "@/lib/settings-defaults";

/**
 * Admin-editable configuration: store settings, homepage content (both in
 * `site_settings`), and categories (`category_order`). Cached across
 * requests and invalidated the moment an admin saves (revalidateConfig), so
 * pages stay fast but changes show up immediately.
 */
export const CONFIG_TAG = "site-config";

/** Call after any admin change to settings, homepage content, or categories. */
export function revalidateConfig() {
  revalidateTag(CONFIG_TAG);
  revalidatePath("/", "layout");
}

const fetchSetting = async (key: string): Promise<unknown> => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  if (error) return null; // e.g. table not migrated yet → defaults
  return data?.value ?? null;
};

export const getStoreSettings = unstable_cache(
  async (): Promise<StoreSettings> => mergeStoreSettings(await fetchSetting("store")),
  ["store-settings"],
  { tags: [CONFIG_TAG], revalidate: 600 }
);

export const getHomepageContent = unstable_cache(
  async (): Promise<HomepageContent> => mergeHomepage(await fetchSetting("homepage")),
  ["homepage-content"],
  { tags: [CONFIG_TAG], revalidate: 600 }
);

export async function saveSetting(key: "store" | "homepage", value: unknown): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Database isn't configured." };
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) {
    const hint = /site_settings/i.test(error.message) ? " — run the latest supabase/schema.sql in the Supabase SQL Editor first." : "";
    return { ok: false, error: error.message + hint };
  }
  revalidateConfig();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export type { Category } from "@/lib/settings-defaults";

type CategoryRow = {
  slug: string;
  rank: number;
  enabled?: boolean;
  custom_from_inr?: number | null;
  name?: string | null;
  tagline?: string | null;
  description?: string | null;
};

async function fetchCategoryRows(): Promise<CategoryRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase.from("category_order").select("*");
  if (error || !data) return [];
  return data as CategoryRow[];
}

/**
 * Every category — built-in ones (with any admin edits applied) plus ones
 * created in the admin — sorted by display rank. Includes disabled ones;
 * use getEnabledCategories() for the storefront.
 */
export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const rows = await fetchCategoryRows();
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    const builtInSlugs = new Set<string>(CATEGORIES.map((c) => c.slug));

    const builtIns: Category[] = CATEGORIES.map((c, i) => {
      const row = bySlug.get(c.slug);
      return {
        slug: c.slug,
        name: row?.name?.trim() || c.name,
        tagline: row?.tagline?.trim() || c.tagline,
        description: row?.description?.trim() || c.description,
        rank: row ? row.rank : 1000 + i,
        enabled: row?.enabled !== false,
        customFromInr: row?.custom_from_inr == null ? null : Number(row.custom_from_inr),
        builtIn: true,
      };
    });

    const created: Category[] = rows
      .filter((r) => !builtInSlugs.has(r.slug) && r.name?.trim())
      .map((r) => ({
        slug: r.slug,
        name: r.name!.trim(),
        tagline: r.tagline?.trim() ?? "",
        description: r.description?.trim() ?? "",
        rank: r.rank,
        enabled: r.enabled !== false,
        customFromInr: r.custom_from_inr == null ? null : Number(r.custom_from_inr),
        builtIn: false,
      }));

    return [...builtIns, ...created].sort((a, b) => a.rank - b.rank);
  },
  ["categories"],
  { tags: [CONFIG_TAG], revalidate: 600 }
);

export async function getEnabledCategories(): Promise<Category[]> {
  return (await getCategories()).filter((c) => c.enabled);
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  return (await getCategories()).find((c) => c.slug === slug);
}
