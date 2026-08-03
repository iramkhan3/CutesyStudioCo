import "server-only";
import { Resend } from "resend";
import type { OrderRecord } from "@/lib/types";
import { SITE } from "@/lib/constants";

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

/**
 * Sends the order confirmation email via Resend. If RESEND_API_KEY isn't
 * set, this is a safe no-op (logged to the server console) — order
 * processing and payment verification never depend on email succeeding.
 *
 * TODO: once you have a Resend account + verified sending domain, set
 * RESEND_API_KEY and RESEND_FROM_EMAIL in your env vars to activate this.
 */
export async function sendOrderConfirmationEmail(order: OrderRecord) {
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL || `${SITE.name} <orders@${new URL(SITE.url).hostname}>`;

  if (!resend) {
    console.log(
      `[email] RESEND_API_KEY not set — skipping confirmation email for order ${order.id}`
    );
    return;
  }

  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;">${item.name} × ${item.quantity}</td>
          <td style="padding:8px 0; text-align:right;">₹${(item.unitPriceInr * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const discountHtml =
    order.discount_amount > 0
      ? `<tr>
          <td style="padding-top:4px; color:#B06A98;">Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}</td>
          <td style="padding-top:4px; text-align:right; color:#B06A98;">-₹${order.discount_amount.toFixed(2)}</td>
        </tr>`
      : "";

  const shippingHtml = `<tr>
          <td style="padding-top:4px;">Shipping</td>
          <td style="padding-top:4px; text-align:right;">${order.shipping_amount === 0 ? "Free" : `₹${order.shipping_amount.toFixed(2)}`}</td>
        </tr>`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #5B4B4F;">
      <h1 style="color:#D291BC;">Thank you for your order! 🎀</h1>
      <p>Hi ${order.customer_name}, your order has been received and is being lovingly prepared.</p>
      <p><strong>Order #${order.id.slice(0, 8)}</strong></p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
        ${itemsHtml}
        ${discountHtml}
        ${shippingHtml}
        <tr>
          <td style="padding-top:12px; font-weight:bold;">Total</td>
          <td style="padding-top:12px; font-weight:bold; text-align:right;">₹${order.total_amount.toFixed(2)}</td>
        </tr>
      </table>
      <p>We'll email you again once your order ships. If you have any questions, just reply to this email or reach us at ${SITE.email}.</p>
      <p style="margin-top:24px;">With love,<br/>${SITE.name}</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from,
      to: order.email,
      subject: `Your ${SITE.name} order is confirmed 🎀`,
      html,
    });
  } catch (err) {
    // Never let an email failure break checkout — just log it.
    console.error("[email] Failed to send order confirmation:", err);
  }
}
