import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminUpdateCustomType, validateCustomTypeUpdate, type CustomTypeUpdate } from "@/lib/admin-custom-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  let body: Partial<CustomTypeUpdate>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const errors = validateCustomTypeUpdate(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: errors }, { status: 400 });
  }

  const result = await adminUpdateCustomType(params.slug, body as CustomTypeUpdate);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // The custom builder is rendered server-side on the homepage — force it to
  // pick up the new pricing immediately rather than waiting for the 300s ISR window.
  revalidatePath("/");

  return NextResponse.json({ type: result });
}
