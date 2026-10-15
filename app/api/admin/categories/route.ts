import { NextResponse } from "next/server";
import { adminCreateCategory, adminListCategoryOrder, validateCategoryText } from "@/lib/admin-category-order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function GET() {
  return NextResponse.json({ categories: await adminListCategoryOrder() });
}

/** Creates a new category: { name, tagline?, description? }. */
export async function POST(req: Request) {
  let body: { name?: unknown; tagline?: unknown; description?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const input = { name: body.name, tagline: body.tagline ?? "", description: body.description ?? "" } as {
    name: string;
    tagline: string;
    description: string;
  };
  const invalid = validateCategoryText(input);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const result = await adminCreateCategory(input);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, slug: result.slug }, { status: 201 });
}
