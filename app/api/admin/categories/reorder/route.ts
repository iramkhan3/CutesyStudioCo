import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminListCategoryOrder, adminReorderCategories } from "@/lib/admin-category-order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function GET() {
  const categories = await adminListCategoryOrder();
  return NextResponse.json({ categories });
}

export async function PATCH(req: Request) {
  let body: { orderedSlugs?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!Array.isArray(body.orderedSlugs) || body.orderedSlugs.some((s) => typeof s !== "string")) {
    return NextResponse.json({ error: "Invalid order list." }, { status: 400 });
  }

  const result = await adminReorderCategories(body.orderedSlugs as string[]);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed to save order." }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/shop");

  return NextResponse.json({ ok: true });
}
