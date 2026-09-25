import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Product } from "@/lib/data/products";
import { CATEGORIES, type CategorySlug } from "@/lib/constants";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_CATEGORIES = new Set<string>(CATEGORIES.map((c) => c.slug));

export function isValidCategory(value: unknown): value is CategorySlug {
  return typeof value === "string" && VALID_CATEGORIES.has(value);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Generates a unique slug from a name, appending -2, -3, ... on collision.
 * `excludeId` lets an edit keep its own existing slug without colliding with
 * itself. Admin-only (server-only) — never exposed to the storefront.
 */
async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const base = slugify(name) || "product";
  if (!supabase) return base;

  let candidate = base;
  let suffix = 2;
  for (;;) {
    let query = supabase.from("products").select("id").eq("slug", candidate).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query;
    if (!data || data.length === 0) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

// Every product field the admin can set, exactly as stored — distinct from
// the storefront's read-only Product type so a bad admin payload can't ever
// silently coerce into a value the storefront wasn't expecting.
export type ProductInput = {
  name: string;
  slug?: string;
  category: CategorySlug;
  description: string;
  mrp_inr: number;
  price_inr: number;
  price_usd: number;
  images: string[];
  stock_quantity: number;
  active: boolean;
};

export type ProductValidationError = { field: string; message: string };

export function validateProductInput(input: Partial<ProductInput>): ProductValidationError[] {
  const errors: ProductValidationError[] = [];

  if (typeof input.name !== "string" || input.name.trim().length < 2 || input.name.trim().length > 120) {
    errors.push({ field: "name", message: "Name must be 2-120 characters." });
  }
  // Short fact-style descriptions only (product type, color, notable
  // details) — not marketing paragraphs. 400 chars is a structural cap, not
  // just a suggestion, to keep the catalog scannable.
  if (typeof input.description !== "string" || input.description.trim().length < 10 || input.description.trim().length > 400) {
    errors.push({ field: "description", message: "Description must be 10-400 characters — short facts, not a paragraph." });
  }
  if (!isValidCategory(input.category)) {
    errors.push({ field: "category", message: "Choose a valid category." });
  }
  for (const [field, label] of [
    ["mrp_inr", "MRP (INR)"],
    ["price_inr", "Price (INR)"],
    ["price_usd", "Price (USD)"],
  ] as const) {
    const value = input[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1_000_000) {
      errors.push({ field, message: `${label} must be a number between 0 and 1,000,000.` });
    }
  }
  if (
    typeof input.stock_quantity !== "number" ||
    !Number.isInteger(input.stock_quantity) ||
    input.stock_quantity < 0 ||
    input.stock_quantity > 100_000
  ) {
    errors.push({ field: "stock_quantity", message: "Stock must be a whole number between 0 and 100,000." });
  }
  if (!Array.isArray(input.images) || input.images.length === 0 || input.images.some((i) => typeof i !== "string" || !i.trim())) {
    errors.push({ field: "images", message: "At least one image is required." });
  }
  if (typeof input.active !== "boolean") {
    errors.push({ field: "active", message: "Active must be true or false." });
  }
  if (input.slug !== undefined && (typeof input.slug !== "string" || input.slug.length > 100)) {
    errors.push({ field: "slug", message: "Slug is invalid." });
  }

  return errors;
}

export async function adminListProducts(): Promise<Product[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Product[];
}

/** Active products in current display order, for the drag-to-reorder admin UI. */
export async function adminListProductsForReorder(): Promise<Product[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    // sort_order column missing (migration not re-run yet) — fall back so
    // the reorder page still loads, just without a meaningful starting order.
    const { data: fallbackData } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });
    return (fallbackData as Product[]) ?? [];
  }

  return (data as Product[]) ?? [];
}

/** Assigns sequential sort_order values (0, 1, 2, ...) matching the given id order. */
export async function adminReorderProducts(orderedIds: string[]): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Database isn't configured." };

  const validIds = orderedIds.filter((id) => UUID_RE.test(id));
  if (validIds.length === 0) return { ok: false, error: "No products to reorder." };

  for (let i = 0; i < validIds.length; i++) {
    const { error } = await supabase.from("products").update({ sort_order: i }).eq("id", validIds[i]);
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function adminBulkSetActive(ids: string[], active: boolean): Promise<Product[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase || ids.length === 0) return [];

  const validIds = ids.filter((id) => UUID_RE.test(id));
  if (validIds.length === 0) return [];

  const { data, error } = await supabase.from("products").update({ active }).in("id", validIds).select();
  if (error || !data) return [];
  return data as Product[];
}

export async function adminGetProduct(id: string): Promise<Product | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !UUID_RE.test(id)) return null;

  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as Product;
}

export async function adminCreateProduct(input: ProductInput): Promise<Product | { error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Database isn't configured." };

  const slug = input.slug?.trim() ? slugify(input.slug) : await generateUniqueSlug(input.name);

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name.trim(),
      slug,
      category: input.category,
      description: input.description.trim(),
      mrp_inr: input.mrp_inr,
      price_inr: input.price_inr,
      price_usd: input.price_usd,
      images: input.images,
      stock_quantity: input.stock_quantity,
      active: input.active,
    })
    .select()
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create product." };
  return data as Product;
}

export async function adminUpdateProduct(id: string, input: ProductInput): Promise<Product | { error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Database isn't configured." };
  if (!UUID_RE.test(id)) return { error: "Invalid product id." };

  const before = await adminGetProduct(id);
  const slug = input.slug?.trim() ? slugify(input.slug) : await generateUniqueSlug(input.name, id);

  const { data, error } = await supabase
    .from("products")
    .update({
      name: input.name.trim(),
      slug,
      category: input.category,
      description: input.description.trim(),
      mrp_inr: input.mrp_inr,
      price_inr: input.price_inr,
      price_usd: input.price_usd,
      images: input.images,
      stock_quantity: input.stock_quantity,
      active: input.active,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to update product." };

  if (before) {
    const removedImages = before.images.filter((url) => !input.images.includes(url));
    if (removedImages.length > 0) await deleteProductStorageFiles(removedImages);
  }

  return data as Product;
}

const STORAGE_PUBLIC_URL_RE = /\/storage\/v1\/object\/public\/product-images\/(.+)$/;

/**
 * Best-effort cleanup of this product's uploaded files in the
 * `product-images` bucket. Only matches our own bucket's public URL shape —
 * a product using a local /public asset or an external image URL is simply
 * left alone, nothing to clean up there.
 */
async function deleteProductStorageFiles(images: string[]): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const paths = images
    .map((url) => url.match(STORAGE_PUBLIC_URL_RE)?.[1])
    .filter((path): path is string => Boolean(path));
  // Each upload also has a `<name>-thumb.<ext>` companion (see
  // app/api/admin/upload/route.ts) — remove() silently ignores paths that
  // don't exist, so this is safe even for images uploaded before thumbnails
  // existed.
  const thumbPaths = paths.map((p) => p.replace(/(\.[a-zA-Z0-9]+)$/, "-thumb$1"));

  const allPaths = [...paths, ...thumbPaths];
  if (allPaths.length > 0) {
    await supabase.storage.from("product-images").remove(allPaths);
  }
}

export async function adminDeleteProduct(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !UUID_RE.test(id)) return false;

  const existing = await adminGetProduct(id);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return false;

  if (existing) {
    // Not awaited-critical to the delete succeeding — a failed cleanup here
    // just leaves an orphaned file, not a broken product deletion.
    await deleteProductStorageFiles(existing.images);
  }

  return true;
}
