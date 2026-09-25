import "server-only";
import { Resend } from "resend";
import type { OrderRecord } from "@/lib/types";
import { SITE } from "@/lib/constants";
import { getEmailTemplate } from "@/lib/email-templates-data";
import { renderTemplate, buildOrderVars, buildNewsletterVars, type EmailTemplateKey } from "@/lib/email-templates";

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || `${SITE.name} <orders@${new URL(SITE.url).hostname}>`;
}

type SendResult = { sent: boolean; reason?: "inactive" | "not_configured" | "send_failed"; message?: string };

/**
 * Looks up the given template (DB-backed, admin-editable), renders it
 * against `vars`, and sends it via Resend. A no-op (logged, not thrown) if
 * the template is turned off, or if RESEND_API_KEY isn't set — order
 * processing and payment verification must never depend on email succeeding.
 */
async function sendTemplatedEmail(key: EmailTemplateKey, to: string, vars: Record<string, string>): Promise<SendResult> {
  const template = await getEmailTemplate(key);
  if (!template.active) {
    console.log(`[email] "${key}" is turned off in the admin — skipping send to ${to}.`);
    return { sent: false, reason: "inactive" };
  }

  const resend = getResendClient();
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not set — skipping "${key}" email to ${to}.`);
    return { sent: false, reason: "not_configured" };
  }

  try {
    // The Resend SDK does NOT throw on API-level failures (e.g. an
    // unverified sending domain) — it resolves normally with an `error`
    // field instead. Missing this check previously made every send look
    // successful even when Resend outright rejected it (403s included).
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: renderTemplate(template.subject, vars),
      html: renderTemplate(template.html, vars),
    });
    if (error) {
      console.error(`[email] Resend rejected "${key}" to ${to}:`, error);
      return { sent: false, reason: "send_failed", message: error.message };
    }
    return { sent: true };
  } catch (err) {
    console.error(`[email] Failed to send "${key}" to ${to}:`, err);
    return { sent: false, reason: "send_failed" };
  }
}

export async function sendOrderConfirmationEmail(order: OrderRecord) {
  return sendTemplatedEmail("order_confirmation", order.email, buildOrderVars(order));
}

export async function sendOrderShippedEmail(order: OrderRecord) {
  return sendTemplatedEmail("order_shipped", order.email, buildOrderVars(order));
}

export async function sendOrderDeliveredEmail(order: OrderRecord) {
  return sendTemplatedEmail("order_delivered", order.email, buildOrderVars(order));
}

export async function sendOrderCancelledEmail(order: OrderRecord) {
  return sendTemplatedEmail("order_cancelled", order.email, buildOrderVars(order));
}

export async function sendAdminNewOrderNotification(order: OrderRecord) {
  return sendTemplatedEmail("admin_new_order", SITE.email, buildOrderVars(order));
}

export async function sendNewsletterWelcomeEmail(email: string, discount: { code: string; percentOff: number } | null) {
  return sendTemplatedEmail("newsletter_welcome", email, buildNewsletterVars(discount));
}

/**
 * Sends an unsaved draft (subject/html straight from the admin editor, not
 * the saved DB row) to a chosen address using sample order data — lets the
 * maker check a template in a real inbox before saving. Ignores the
 * template's active flag on purpose (you should be able to test something
 * that's currently turned off).
 */
export async function sendTestEmail(
  to: string,
  subject: string,
  html: string,
  vars: Record<string, string>
): Promise<SendResult> {
  const resend = getResendClient();
  if (!resend) return { sent: false, reason: "not_configured" };

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject: `[Test] ${renderTemplate(subject, vars)}`,
      html: renderTemplate(html, vars),
    });
    if (error) {
      console.error("[email] Resend rejected test send:", error);
      return { sent: false, reason: "send_failed", message: error.message };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] Test send failed:", err);
    return { sent: false, reason: "send_failed" };
  }
}
