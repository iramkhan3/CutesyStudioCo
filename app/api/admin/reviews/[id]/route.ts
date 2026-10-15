import { NextResponse } from "next/server";
import { adminDeleteReview, adminUpdateReview, validateReviewInput, type ReviewInput } from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Full update (edit text/photo, or approve/hide via `status`). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  let body: ReviewInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const input: ReviewInput = { ...body, rating: Number(body.rating) };
  const invalid = validateReviewInput(input);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  const result = await adminUpdateReview(params.id, input);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ review: result });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const ok = await adminDeleteReview(params.id);
  if (!ok) return NextResponse.json({ error: "Failed to delete review." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
