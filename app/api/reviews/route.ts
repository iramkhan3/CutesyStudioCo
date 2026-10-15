import { NextResponse } from "next/server";
import { createReview, validateReviewInput } from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/**
 * Public: a customer submits a review from /review. Always saved as
 * "pending" — it only appears on the site after the maker approves it in
 * Admin → Reviews.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (str(body.website)) return NextResponse.json({ ok: true }); // honeypot

  const input = {
    name: str(body.name),
    location: str(body.location) || null,
    rating: Number(body.rating),
    body: str(body.body),
    image_url: null,
    email: str(body.email) || null,
    order_ref: str(body.orderRef) || null,
    status: "pending" as const,
  };
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return NextResponse.json({ error: "Please enter a valid email (or leave it blank)." }, { status: 400 });
  }
  const invalid = validateReviewInput(input);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const result = await createReview(input);
  if ("error" in result) return NextResponse.json({ error: "We couldn't save your review — please try again." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
