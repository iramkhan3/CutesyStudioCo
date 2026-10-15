import { NextResponse } from "next/server";
import { createCustomRequest, getCustomRequestCategories } from "@/lib/custom-requests";
import { sendCustomRequestReceivedEmails } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?\d{1,3}[\s-]?)?[\d\s-]{7,15}$/;
const NAME_RE = /^[\p{L}\p{M}\s.'-]{2,80}$/u;

type Body = {
  category?: unknown;
  quantity?: unknown;
  deviceModel?: unknown;
  notes?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  country?: unknown;
  // Honeypot: a hidden field real visitors never fill in.
  website?: unknown;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Public: a customer submits a custom request (no payment yet). */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Bots that fill every field get a fake success and nothing is saved.
  if (str(body.website)) return NextResponse.json({ ok: true });

  const categories = await getCustomRequestCategories();
  const category = categories.find((c) => c.slug === str(body.category));
  const quantity = Number(body.quantity);
  const notes = str(body.notes);
  const name = str(body.name);
  const email = str(body.email);
  const phone = str(body.phone);
  const country = str(body.country);
  const deviceModel = str(body.deviceModel) || null;

  if (!category) return NextResponse.json({ error: "Please choose what you'd like made." }, { status: 400 });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
    return NextResponse.json({ error: "Quantity must be between 1 and 500." }, { status: 400 });
  }
  if (category.slug === "phone-cases" && !deviceModel) {
    return NextResponse.json({ error: "Please tell us your phone model." }, { status: 400 });
  }
  if (deviceModel && deviceModel.length > 120) {
    return NextResponse.json({ error: "Model / size is too long." }, { status: 400 });
  }
  if (notes.length < 20 || notes.length > 2000) {
    return NextResponse.json(
      { error: "Please describe what you'd like in at least 20 characters (up to 2000)." },
      { status: 400 }
    );
  }
  if (!NAME_RE.test(name)) return NextResponse.json({ error: "Please provide your full name." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  if (!PHONE_RE.test(phone)) return NextResponse.json({ error: "Please provide a valid phone number." }, { status: 400 });
  if (!country || country.length > 60) return NextResponse.json({ error: "Please choose your country." }, { status: 400 });

  const result = await createCustomRequest({
    category: category.slug,
    quantity,
    deviceModel,
    notes,
    customerName: name,
    email,
    phone,
    country,
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  // Best-effort: the request is saved either way, and shows in the admin.
  await sendCustomRequestReceivedEmails(result).catch((err) =>
    console.error("[custom-requests] notification emails failed:", err)
  );

  return NextResponse.json({ ok: true, requestId: result.id.slice(0, 8) });
}
