import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminCreateProduct, adminListProducts, validateProductInput, type ProductInput } from "@/lib/admin-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function GET() {
  const products = await adminListProducts();
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
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

  const result = await adminCreateProduct(body as ProductInput);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath(`/shop/${result.slug}`);

  return NextResponse.json({ product: result }, { status: 201 });
}
