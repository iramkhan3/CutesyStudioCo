import { NextResponse } from "next/server";
import {
  adminGetEmailTemplate,
  adminUpdateEmailTemplate,
  validateEmailTemplateUpdate,
  type EmailTemplateUpdate,
} from "@/lib/admin-email-templates";
import { EMAIL_TEMPLATE_KEYS, type EmailTemplateKey } from "@/lib/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

function isValidKey(key: string): key is EmailTemplateKey {
  return (EMAIL_TEMPLATE_KEYS as string[]).includes(key);
}

export async function GET(_req: Request, { params }: { params: { key: string } }) {
  if (!isValidKey(params.key)) return NextResponse.json({ error: "Unknown email template." }, { status: 404 });

  const template = await adminGetEmailTemplate(params.key);
  if (!template) return NextResponse.json({ error: "Unknown email template." }, { status: 404 });

  return NextResponse.json({ template });
}

export async function PATCH(req: Request, { params }: { params: { key: string } }) {
  if (!isValidKey(params.key)) return NextResponse.json({ error: "Unknown email template." }, { status: 404 });

  let body: Partial<EmailTemplateUpdate>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const errors = validateEmailTemplateUpdate(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: errors }, { status: 400 });
  }

  const result = await adminUpdateEmailTemplate(params.key, body as EmailTemplateUpdate);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ template: result });
}
