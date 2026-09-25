import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CUSTOM_PRODUCT_TYPES, type CustomProductType, type CustomProductTypeSlug } from "@/lib/constants";

type CustomProductTypeRow = {
  slug: string;
  name: string;
  requires_phone_model: boolean;
  image: string;
  build_mrp_inr: number;
  build_price_inr: number;
  build_price_usd: number;
  surprise_mrp_inr: number;
  surprise_price_inr: number;
  surprise_price_usd: number;
  sort_order: number;
};

function rowToType(row: CustomProductTypeRow): CustomProductType {
  return {
    slug: row.slug as CustomProductTypeSlug,
    name: row.name,
    requiresPhoneModel: row.requires_phone_model,
    image: row.image,
    build: { mrpInr: row.build_mrp_inr, priceInr: row.build_price_inr, priceUsd: row.build_price_usd },
    surprise: { mrpInr: row.surprise_mrp_inr, priceInr: row.surprise_price_inr, priceUsd: row.surprise_price_usd },
  };
}

/**
 * Custom builder product types (Phone Case, Hairbrush, etc.) — DB-backed so
 * the admin can edit pricing/name/image without a code change, but always
 * falls back to the hardcoded CUSTOM_PRODUCT_TYPES constant if the table is
 * missing (migration not run yet) or empty, so the builder — the site's main
 * focus — never breaks.
 */
export async function getCustomProductTypes(): Promise<CustomProductType[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return CUSTOM_PRODUCT_TYPES;

  const { data, error } = await supabase
    .from("custom_product_types")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return CUSTOM_PRODUCT_TYPES;
  return (data as CustomProductTypeRow[]).map(rowToType);
}
