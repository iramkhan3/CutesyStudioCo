import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminSetCategoryCustomFrom, adminSetCategoryEnabled } from "@/lib/admin-category-order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  let body: { enabled?: unknown; customFromInr?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let result;
  if ("customFromInr" in body) {
    // Custom-request "starting from" price: a number ≥ 0, or null to clear.
    const value = body.customFromInr;
    if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
      return NextResponse.json({ error: "Starting price must be 0 or more (or blank)." }, { status: 400 });
    }
    result = await adminSetCategoryCustomFrom(params.slug, value === null ? null : Math.round(value * 100) / 100);
  } else if (typeof body.enabled === "boolean") {
    result = await adminSetCategoryEnabled(params.slug, body.enabled);
  } else {
    return NextResponse.json({ error: "Enabled must be true or false." }, { status: 400 });
  }
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed to update category." }, { status: 400 });
  }

  // Homepage highlight, shop listing/filters, and product pages all depend
  // on which categories are enabled.
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
