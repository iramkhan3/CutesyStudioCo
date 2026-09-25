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
 * All 5 email templates, DB-backed with a fallback to DEFAULT_EMAIL_TEMPLATES
 * per key (same pattern as coupons/custom-types) so a missing migration or an
 * individual missing row never breaks order emails — it just sends the
 * built-in copy for that one template until the admin edits it.
 */
export async function getEmailTemplates(): Promise<Record<EmailTemplateKey, EmailTemplate>> {
  const map = { ...DEFAULT_EMAIL_TEMPLATES };

  const supabase = getSupabaseAdmin();
  if (!supabase) return map;

  const { data, error } = await supabase.from("email_templates").select("*");
  if (error || !data) return map;

  for (const row of data as EmailTemplateRow[]) {
    if ((EMAIL_TEMPLATE_KEYS as string[]).includes(row.key)) {
      map[row.key as EmailTemplateKey] = {
        key: row.key as EmailTemplateKey,
        name: row.name,
        subject: row.subject,
        html: row.html,
        active: row.active,
      };
    }
  }

  return map;
}

export async function getEmailTemplate(key: EmailTemplateKey): Promise<EmailTemplate> {
  const all = await getEmailTemplates();
  return all[key];
}
