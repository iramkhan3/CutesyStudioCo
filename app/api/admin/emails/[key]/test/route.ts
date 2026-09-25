import { NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/email";
import { buildOrderVars, SAMPLE_ORDER, EMAIL_TEMPLATE_KEYS } from "@/lib/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request, { params }: { params: { key: string } }) {
  if (!(EMAIL_TEMPLATE_KEYS as string[]).includes(params.key)) {
    return NextResponse.json({ error: "Unknown email template." }, { status: 404 });
  }

  let body: { subject?: unknown; html?: unknown; to?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.subject !== "string" || typeof body.html !== "string") {
    return NextResponse.json({ error: "Missing subject or html." }, { status: 400 });
  }
  if (typeof body.to !== "string" || !EMAIL_RE.test(body.to.trim())) {
    return NextResponse.json({ error: "Please provide a valid email address to send the test to." }, { status: 400 });
  }

  const result = await sendTestEmail(body.to.trim(), body.subject, body.html, buildOrderVars(SAMPLE_ORDER));
  if (!result.sent) {
    const message =
      result.reason === "not_configured"
        ? "Email sending isn't configured yet — RESEND_API_KEY needs to be set in your environment variables."
        : result.message
          ? `Resend rejected this send: ${result.message}`
          : "Couldn't send the test email. Check the server logs for details.";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
