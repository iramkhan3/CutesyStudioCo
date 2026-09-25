import { NextResponse } from "next/server";
import { renderTemplate, buildOrderVars, SAMPLE_ORDER, EMAIL_TEMPLATE_KEYS } from "@/lib/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function POST(req: Request, { params }: { params: { key: string } }) {
  if (!(EMAIL_TEMPLATE_KEYS as string[]).includes(params.key)) {
    return NextResponse.json({ error: "Unknown email template." }, { status: 404 });
  }

  let body: { subject?: unknown; html?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.subject !== "string" || typeof body.html !== "string") {
    return NextResponse.json({ error: "Missing subject or html." }, { status: 400 });
  }

  const vars = buildOrderVars(SAMPLE_ORDER);
  return NextResponse.json({
    subject: renderTemplate(body.subject, vars),
    html: renderTemplate(body.html, vars),
  });
}
