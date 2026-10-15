import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminSetCategoryEnabled } from "@/lib/admin-category-order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  let body: { enabled?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "Enabled must be true or false." }, { status: 400 });
  }

  const result = await adminSetCategoryEnabled(params.slug, body.enabled);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed to update category." }, { status: 400 });
  }

  // Homepage highlight, shop listing/filters, and product pages all depend
  // on which categories are enabled.
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
