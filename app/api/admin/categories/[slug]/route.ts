import { NextResponse } from "next/server";
import {
  adminDeleteCategory,
  adminSetCategoryCustomFrom,
  adminSetCategoryEnabled,
  adminUpdateCategoryText,
  validateCategoryText,
} from "@/lib/admin-category-order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

/**
 * One of: { enabled: boolean } | { customFromInr: number | null } |
 * { name, tagline, description }. Every change refreshes the storefront
 * immediately (revalidateConfig in lib/admin-category-order.ts).
 */
export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  let body: { enabled?: unknown; customFromInr?: unknown; name?: unknown; tagline?: unknown; description?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let result;
  if ("customFromInr" in body) {
    const value = body.customFromInr;
    if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
      return NextResponse.json({ error: "Starting price must be 0 or more (or blank)." }, { status: 400 });
    }
    result = await adminSetCategoryCustomFrom(params.slug, value === null ? null : Math.round(value * 100) / 100);
  } else if ("name" in body) {
    const input = { name: body.name, tagline: body.tagline ?? "", description: body.description ?? "" } as {
      name: string;
      tagline: string;
      description: string;
    };
    const invalid = validateCategoryText(input);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    result = await adminUpdateCategoryText(params.slug, input);
  } else if (typeof body.enabled === "boolean") {
    result = await adminSetCategoryEnabled(params.slug, body.enabled);
  } else {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  if (!result.ok) return NextResponse.json({ error: result.error ?? "Failed to update category." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { slug: string } }) {
  const result = await adminDeleteCategory(params.slug);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
