import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CUSTOM_PRODUCT_TYPES } from "@/lib/constants";

export type AdminCustomProductTypeRow = {
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

function seedDefaults(): AdminCustomProductTypeRow[] {
  return CUSTOM_PRODUCT_TYPES.map((t, i) => ({
    slug: t.slug,
    name: t.name,
    requires_phone_model: t.requiresPhoneModel,
    image: t.image,
    build_mrp_inr: t.build.mrpInr,
    build_price_inr: t.build.priceInr,
    build_price_usd: t.build.priceUsd,
    surprise_mrp_inr: t.surprise.mrpInr,
    surprise_price_inr: t.surprise.priceInr,
    surprise_price_usd: t.surprise.priceUsd,
    sort_order: i,
  }));
}

/**
 * Lists custom builder types for the admin UI. If the `custom_product_types`
 * table is missing (migration not run) or empty, returns the hardcoded
 * constant shaped the same way, so the admin page still shows something
 * sensible — saving an edit in that state will surface a clear error asking
 * for the migration instead of silently doing nothing.
 */
export async function adminListCustomTypes(): Promise<AdminCustomProductTypeRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return seedDefaults();

  const { data, error } = await supabase
    .from("custom_product_types")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return seedDefaults();
  return data as AdminCustomProductTypeRow[];
}

export type CustomTypeUpdate = {
  name: string;
  image: string;
  build_mrp_inr: number;
  build_price_inr: number;
  build_price_usd: number;
  surprise_mrp_inr: number;
  surprise_price_inr: number;
  surprise_price_usd: number;
};

export type CustomTypeValidationError = { field: string; message: string };

export function validateCustomTypeUpdate(input: Partial<CustomTypeUpdate>): CustomTypeValidationError[] {
  const errors: CustomTypeValidationError[] = [];

  if (typeof input.name !== "string" || input.name.trim().length < 2 || input.name.trim().length > 60) {
    errors.push({ field: "name", message: "Name must be 2-60 characters." });
  }
  if (typeof input.image !== "string" || !input.image.trim()) {
    errors.push({ field: "image", message: "An image is required." });
  }
  for (const field of [
    "build_mrp_inr",
    "build_price_inr",
    "build_price_usd",
    "surprise_mrp_inr",
    "surprise_price_inr",
    "surprise_price_usd",
  ] as const) {
    const value = input[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1_000_000) {
      errors.push({ field, message: "Must be a number between 0 and 1,000,000." });
    }
  }

  return errors;
}

export async function adminUpdateCustomType(
  slug: string,
  update: CustomTypeUpdate
): Promise<AdminCustomProductTypeRow | { error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Database isn't configured." };

  const { data, error } = await supabase
    .from("custom_product_types")
    .update({
      name: update.name.trim(),
      image: update.image.trim(),
      build_mrp_inr: update.build_mrp_inr,
      build_price_inr: update.build_price_inr,
      build_price_usd: update.build_price_usd,
      surprise_mrp_inr: update.surprise_mrp_inr,
      surprise_price_inr: update.surprise_price_inr,
      surprise_price_usd: update.surprise_price_usd,
    })
    .eq("slug", slug)
    .select()
    .single();

  if (error || !data) {
    return {
      error:
        error?.message ??
        "Couldn't save — the custom_product_types table may not exist yet. Run the latest supabase/schema.sql.",
    };
  }
  return data as AdminCustomProductTypeRow;
}
