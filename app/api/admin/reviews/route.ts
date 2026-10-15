import { NextResponse } from "next/server";
import { adminListReviews, createReview, validateReviewInput, type ReviewInput, type ReviewStatus } from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

const STATUSES: ReviewStatus[] = ["pending", "approved", "hidden"];

export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get("status");
  const reviews = await adminListReviews(STATUSES.includes(status as ReviewStatus) ? (status as ReviewStatus) : undefined);
  return NextResponse.json({ reviews });
}

/** Admin adds a review they received (e.g. by WhatsApp/Instagram). */
export async function POST(req: Request) {
  let body: Partial<ReviewInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const input: ReviewInput = {
    name: body.name ?? "",
    location: body.location ?? null,
    rating: Number(body.rating),
    body: body.body ?? "",
    image_url: body.image_url ?? null,
    email: body.email ?? null,
    order_ref: body.order_ref ?? null,
    status: body.status ?? "approved",
  };
  const invalid = validateReviewInput(input);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  const result = await createReview(input);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ review: result }, { status: 201 });
}
