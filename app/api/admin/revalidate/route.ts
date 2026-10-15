import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminListProducts } from "@/lib/admin-products";
import { revalidateConfig } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

/**
 * Forces the storefront's cached pages (ISR, revalidate = 300s) to refresh
 * immediately. Needed whenever product data changes *outside* the admin
 * product API routes — e.g. a bulk edit via DBeaver/Supabase directly —
 * since only those routes call revalidatePath() on their own. Safe to call
 * any time; worst case it's a no-op refresh.
 */
export async function POST() {
  const products = await adminListProducts();

  // Also drops cached settings/categories/homepage content/reviews, in case
  // any of those were edited directly in Supabase too.
  revalidateConfig();
  revalidatePath("/");
  revalidatePath("/shop");
  for (const product of products) {
    revalidatePath(`/shop/${product.slug}`);
  }

  return NextResponse.json({ ok: true, pagesRevalidated: products.length + 2 });
}
