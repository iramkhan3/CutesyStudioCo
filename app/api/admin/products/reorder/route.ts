import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminListProductsForReorder, adminReorderProducts } from "@/lib/admin-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function GET() {
  const products = await adminListProductsForReorder();
  return NextResponse.json({ products });
}

export async function PATCH(req: Request) {
  let body: { orderedIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!Array.isArray(body.orderedIds) || body.orderedIds.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "Invalid order list." }, { status: 400 });
  }
  if (body.orderedIds.length === 0 || body.orderedIds.length > 500) {
    return NextResponse.json({ error: "Order list must have 1-500 items." }, { status: 400 });
  }

  const result = await adminReorderProducts(body.orderedIds as string[]);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed to save order." }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/shop");

  return NextResponse.json({ ok: true });
}
