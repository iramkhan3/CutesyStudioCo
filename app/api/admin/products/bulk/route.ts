import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminBulkSetActive } from "@/lib/admin-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

type BulkBody = { ids?: unknown; active?: unknown };

export async function PATCH(req: Request) {
  let body: BulkBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0 || body.ids.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "No products selected." }, { status: 400 });
  }
  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  if (body.ids.length > 500) {
    return NextResponse.json({ error: "Too many products selected at once (max 500)." }, { status: 400 });
  }

  const updated = await adminBulkSetActive(body.ids as string[], body.active);

  revalidatePath("/shop");
  revalidatePath("/");
  for (const product of updated) {
    revalidatePath(`/shop/${product.slug}`);
  }

  return NextResponse.json({ ok: true, updated: updated.length });
}
