import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SEED_PRODUCTS, type Product } from "@/lib/data/products";
import { getCategoryOrder, getDisabledCategories } from "@/lib/category-order-data";
import { PHONE_CASE_CATEGORIES, type CategorySlug } from "@/lib/constants";
import { releaseStaleReservations } from "@/lib/orders";

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

/**
 * Thrown when Supabase is configured but the products query fails. Pages
 * let it propagate on purpose: with ISR, Next keeps serving the last good
 * cached page instead of a broken one. It must never fall back to
 * SEED_PRODUCTS — those share ids with live products but have outdated
 * prices/photos/active flags, so a brief DB hiccup would show (and could
 * sell) the wrong thing. The seed catalog is only for local dev with no DB.
 */
export class ProductsUnavailableError extends Error {
  constructor(cause: unknown) {
    super(`Products could not be loaded: ${cause instanceof Error ? cause.message : JSON.stringify(cause)}`);
    this.name = "ProductsUnavailableError";
  }
}

export async function getAllProducts(): Promise<Product[]> {
  await releaseStaleReservations();
  const [products, disabled] = await Promise.all([getAllActiveProducts(), getDisabledCategories()]);
  return products.filter((p) => !disabled.has(p.category));
}

async function getAllActiveProducts(): Promise<Product[]> {
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
    if (fallbackError || !fallbackData) throw new ProductsUnavailableError(fallbackError ?? error);
    return sortByCategoryPriority(fallbackData as Product[], categoryOrder);
  }

  return sortByCategoryPriority((data ?? []) as Product[], categoryOrder);
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
  await releaseStaleReservations();
  const [product, disabled] = await Promise.all([getActiveProductBySlug(slug), getDisabledCategories()]);
  return product && !disabled.has(product.category) ? product : null;
}

async function getActiveProductBySlug(slug: string): Promise<Product | null> {
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

  if (error) throw new ProductsUnavailableError(error);
  return (data as Product | null) ?? null;
}

/**
 * Fetches authoritative product records by id — used server-side during
 * checkout so prices/stock always come from the database, never the client.
 * Products in an admin-disabled category come back with `active: false`, so
 * the order APIs' existing availability check rejects them. Returns null if
 * the database can't be reached — checkout must then refuse, never guess.
 */
export async function getProductsByIds(ids: string[]): Promise<Product[] | null> {
  await releaseStaleReservations();
  const [products, disabled] = await Promise.all([fetchProductsByIds(ids), getDisabledCategories()]);
  if (!products) return null;
  return products.map((p) => (disabled.has(p.category) ? { ...p, active: false } : p));
}

async function fetchProductsByIds(ids: string[]): Promise<Product[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return SEED_PRODUCTS.filter((p) => ids.includes(p.id));
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("id", ids);

  if (error || !data) {
    console.error("[products] checkout product lookup failed:", error);
    return null;
  }
  return data as Product[];
}
