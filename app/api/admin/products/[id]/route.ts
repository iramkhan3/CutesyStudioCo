import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  adminDeleteProduct,
  adminGetProduct,
  adminUpdateProduct,
  validateProductInput,
  type ProductInput,
} from "@/lib/admin-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const product = await adminGetProduct(params.id);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let body: Partial<ProductInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const errors = validateProductInput(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: errors }, { status: 400 });
  }

  const before = await adminGetProduct(params.id);
  const result = await adminUpdateProduct(params.id, body as ProductInput);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath(`/shop/${result.slug}`);
  if (before && before.slug !== result.slug) revalidatePath(`/shop/${before.slug}`);

  return NextResponse.json({ product: result });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const existing = await adminGetProduct(params.id);
  const ok = await adminDeleteProduct(params.id);
  if (!ok) return NextResponse.json({ error: "Failed to delete product." }, { status: 400 });

  revalidatePath("/shop");
  revalidatePath("/");
  if (existing) revalidatePath(`/shop/${existing.slug}`);

  return NextResponse.json({ ok: true });
}
