import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  DEFAULT_EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_KEYS,
  type EmailTemplate,
  type EmailTemplateKey,
} from "@/lib/email-templates";

type EmailTemplateRow = {
  key: string;
  name: string;
  subject: string;
  html: string;
  active: boolean;
};

/**
 * Lists all 5 templates for the admin UI, always in EMAIL_TEMPLATE_KEYS
 * order. Any key missing from the DB (migration not run, or a row deleted)
 * falls back to its built-in default so the admin page always shows all 5.
 */
export async function adminListEmailTemplates(): Promise<EmailTemplate[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return EMAIL_TEMPLATE_KEYS.map((k) => DEFAULT_EMAIL_TEMPLATES[k]);

  const { data, error } = await supabase.from("email_templates").select("*");
  if (error || !data) return EMAIL_TEMPLATE_KEYS.map((k) => DEFAULT_EMAIL_TEMPLATES[k]);

  const byKey = new Map((data as EmailTemplateRow[]).map((r) => [r.key, r]));
  return EMAIL_TEMPLATE_KEYS.map((k) => {
    const row = byKey.get(k);
    if (!row) return DEFAULT_EMAIL_TEMPLATES[k];
    return { key: k, name: row.name, subject: row.subject, html: row.html, active: row.active };
  });
}

export async function adminGetEmailTemplate(key: EmailTemplateKey): Promise<EmailTemplate | null> {
  if (!(EMAIL_TEMPLATE_KEYS as string[]).includes(key)) return null;
  const all = await adminListEmailTemplates();
  return all.find((t) => t.key === key) ?? null;
}

export type EmailTemplateUpdate = { subject: string; html: string; active: boolean };
export type EmailTemplateValidationError = { field: string; message: string };

export function validateEmailTemplateUpdate(input: Partial<EmailTemplateUpdate>): EmailTemplateValidationError[] {
  const errors: EmailTemplateValidationError[] = [];

  if (typeof input.subject !== "string" || !input.subject.trim() || input.subject.length > 200) {
    errors.push({ field: "subject", message: "Subject is required (max 200 characters)." });
  }
  if (typeof input.html !== "string" || !input.html.trim() || input.html.length > 20000) {
    errors.push({ field: "html", message: "Email body is required (max 20,000 characters)." });
  }
  if (typeof input.active !== "boolean") {
    errors.push({ field: "active", message: "Active must be true or false." });
  }

  return errors;
}

/**
 * Templates are seeded by the supabase/schema.sql migration (fixed 5 keys,
 * no admin-driven create/delete) — this is an UPDATE-only op, same shape as
 * adminUpdateCustomType.
 */
export async function adminUpdateEmailTemplate(
  key: EmailTemplateKey,
  update: EmailTemplateUpdate
): Promise<EmailTemplate | { error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Database isn't configured." };

  const { data, error } = await supabase
    .from("email_templates")
    .update({
      subject: update.subject.trim(),
      html: update.html,
      active: update.active,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key)
    .select()
    .single();

  if (error || !data) {
    return {
      error:
        error?.message ??
        "Couldn't save — the email_templates table may not exist yet. Run the latest supabase/schema.sql.",
    };
  }

  return { key: data.key, name: data.name, subject: data.subject, html: data.html, active: data.active };
}
