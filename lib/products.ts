import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SEED_PRODUCTS, type Product } from "@/lib/data/products";
import { getCategoryOrder } from "@/lib/category-order-data";
import { PHONE_CASE_CATEGORIES, type CategorySlug } from "@/lib/constants";

/**
 * Product data access layer. Reads from Supabase when it's configured,
 * otherwise falls back to the local seed catalog (lib/data/products.ts) so
 * the site is browsable immediately after `npm install && npm run dev`.
 */

/**
 * Groups products by category-priority (admin-configurable, phone-cases
 * first by default — see lib/category-order-data.ts), preserving each
 * product's existing relative order (sort_order/created_at) within its
 * category. Array.prototype.sort is stable, so this is a plain single pass.
 */
function sortByCategoryPriority(products: Product[], categoryOrder: Record<string, number>): Product[] {
  return [...products].sort((a, b) => {
    const rankA = categoryOrder[a.category] ?? Number.MAX_SAFE_INTEGER;
    const rankB = categoryOrder[b.category] ?? Number.MAX_SAFE_INTEGER;
    return rankA - rankB;
  });
}

export async function getAllProducts(): Promise<Product[]> {
  const supabase = getSupabaseAdmin();
  const categoryOrder = await getCategoryOrder();

  if (!supabase) return sortByCategoryPriority(SEED_PRODUCTS.filter((p) => p.active), categoryOrder);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  // `sort_order` is a newer column — if it's missing on this DB (migration
  // not re-run yet), PostgREST rejects the `order` clause referencing it.
  // Fall back to the previous created_at-only ordering rather than erroring.
  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });
    if (fallbackError || !fallbackData) return sortByCategoryPriority(SEED_PRODUCTS.filter((p) => p.active), categoryOrder);
    return sortByCategoryPriority(fallbackData as Product[], categoryOrder);
  }

  if (!data) return sortByCategoryPriority(SEED_PRODUCTS.filter((p) => p.active), categoryOrder);
  return sortByCategoryPriority(data as Product[], categoryOrder);
}

export async function getProductsByCategory(
  category?: CategorySlug
): Promise<Product[]> {
  const all = await getAllProducts();
  if (!category) return all;
  // "Phone Cases" also covers "ready-to-ship" (Existing Designs) — most
  // finished, ready-to-ship pieces are phone cases too, just pre-made rather
  // than built to order, and customers browsing "Phone Cases" expect to see
  // all of them, not just the ones categorized as build-to-order.
  if (category === "phone-cases") {
    return all.filter((p) => PHONE_CASE_CATEGORIES.includes(p.category));
  }
  return all.filter((p) => p.category === category);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return SEED_PRODUCTS.find((p) => p.slug === slug && p.active) ?? null;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) {
    return SEED_PRODUCTS.find((p) => p.slug === slug && p.active) ?? null;
  }
  return data as Product;
}

/**
 * Fetches authoritative product records by id — used server-side during
 * checkout so prices/stock always come from the database, never the client.
 */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return SEED_PRODUCTS.filter((p) => ids.includes(p.id));
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("id", ids);

  if (error || !data) {
    return SEED_PRODUCTS.filter((p) => ids.includes(p.id));
  }
  return data as Product[];
}
