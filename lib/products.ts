import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SEED_PRODUCTS, type Product } from "@/lib/data/products";
import type { CategorySlug } from "@/lib/constants";

/**
 * Product data access layer. Reads from Supabase when it's configured,
 * otherwise falls back to the local seed catalog (lib/data/products.ts) so
 * the site is browsable immediately after `npm install && npm run dev`.
 */

export async function getAllProducts(): Promise<Product[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return SEED_PRODUCTS.filter((p) => p.active);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error || !data) return SEED_PRODUCTS.filter((p) => p.active);
  return data as Product[];
}

export async function getProductsByCategory(
  category?: CategorySlug
): Promise<Product[]> {
  const all = await getAllProducts();
  if (!category) return all;
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
