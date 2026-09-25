// Shared definitions for the admin-editable transactional email system.
// Not marked server-only: EMAIL_TEMPLATE_KEYS/EMAIL_TEMPLATE_VARIABLES/
// DEFAULT_EMAIL_TEMPLATES are plain static data the admin editor (a client
// component) reads directly for its sidebar + "reset to default" button,
// same pattern as CATEGORIES/CUSTOM_CASE_THEMES in lib/constants.ts.
import type { OrderRecord } from "@/lib/types";
import { SITE } from "@/lib/constants";

export type EmailTemplateKey =
  | "order_confirmation"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "admin_new_order"
  | "newsletter_welcome";

export const EMAIL_TEMPLATE_KEYS: EmailTemplateKey[] = [
  "order_confirmation",
  "order_shipped",
  "order_delivered",
  "order_cancelled",
  "admin_new_order",
  "newsletter_welcome",
];

export type EmailTemplate = {
  key: EmailTemplateKey;
  name: string;
  subject: string;
  html: string;
  active: boolean;
};

const BASE_VARS = [
  { token: "site_name", description: "Your shop's name." },
  { token: "site_email", description: "Your support email address." },
  { token: "customer_name", description: "The customer's full name." },
  { token: "order_id", description: "Short order reference (first 8 characters)." },
  { token: "order_date", description: "Date the order was placed." },
  { token: "items_table", description: "Table rows listing each item, quantity, and price." },
  { token: "subtotal", description: "Subtotal before discount and shipping." },
  { token: "discount_row", description: "Discount line (blank if no coupon was used)." },
  { token: "shipping_row", description: "Shipping line — shows the amount or \"Free\"." },
  { token: "total", description: "Final total charged." },
  { token: "shipping_address", description: "Formatted shipping address." },
] as const;

const TRACKING_VARS = [
  { token: "tracking_number", description: "The tracking number, if one was entered." },
  { token: "courier", description: "The courier/carrier name, if one was entered." },
  { token: "tracking_row", description: "Pre-formatted tracking block (blank if nothing was entered)." },
] as const;

const ADMIN_VARS = [
  { token: "admin_order_link", description: "Direct link to this order in your admin dashboard." },
] as const;

const NEWSLETTER_VARS = [
  { token: "site_name", description: "Your shop's name." },
  { token: "site_email", description: "Your support email address." },
  { token: "shop_link", description: "Link to the shop page." },
  { token: "discount_row", description: "A callout with a discount code, if one is currently active (blank otherwise)." },
] as const;

export const EMAIL_TEMPLATE_VARIABLES: Record<EmailTemplateKey, readonly { token: string; description: string }[]> = {
  order_confirmation: BASE_VARS,
  order_shipped: [...BASE_VARS, ...TRACKING_VARS],
  order_delivered: BASE_VARS,
  order_cancelled: BASE_VARS,
  admin_new_order: [...BASE_VARS, ...ADMIN_VARS],
  newsletter_welcome: NEWSLETTER_VARS,
};

const EMAIL_WRAPPER_OPEN = `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #5B4B4F;">`;
const EMAIL_WRAPPER_CLOSE = `</div>`;
const SIGNOFF = `<p style="margin-top:24px;">With love,<br/>{{site_name}}</p>`;

export const DEFAULT_EMAIL_TEMPLATES: Record<EmailTemplateKey, EmailTemplate> = {
  order_confirmation: {
    key: "order_confirmation",
    name: "Order confirmation",
    subject: "Your {{site_name}} order is confirmed 🎀",
    active: true,
    html: `${EMAIL_WRAPPER_OPEN}
      <h1 style="color:#D291BC;">Thank you for your order! 🎀</h1>
      <p>Hi {{customer_name}}, your order has been received and is being lovingly prepared.</p>
      <p><strong>Order #{{order_id}}</strong> &middot; {{order_date}}</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
        {{items_table}}
        {{discount_row}}
        {{shipping_row}}
        <tr>
          <td style="padding-top:12px; font-weight:bold;">Total</td>
          <td style="padding-top:12px; font-weight:bold; text-align:right;">{{total}}</td>
        </tr>
      </table>
      <p><strong>Shipping to:</strong><br/>{{shipping_address}}</p>
      <p>We'll email you again once your order ships. If you have any questions, just reply to this email or reach us at {{site_email}}.</p>
      ${SIGNOFF}
    ${EMAIL_WRAPPER_CLOSE}`,
  },
  order_shipped: {
    key: "order_shipped",
    name: "Order shipped",
    subject: "Your {{site_name}} order has shipped! 📦",
    active: true,
    html: `${EMAIL_WRAPPER_OPEN}
      <h1 style="color:#D291BC;">Your order is on its way! 📦</h1>
      <p>Hi {{customer_name}}, your order <strong>#{{order_id}}</strong> has shipped and is headed your way.</p>
      {{tracking_row}}
      <p><strong>Shipping to:</strong><br/>{{shipping_address}}</p>
      <p>We'll let you know once it's delivered too. Questions? Just reply to this email or reach us at {{site_email}}.</p>
      ${SIGNOFF}
    ${EMAIL_WRAPPER_CLOSE}`,
  },
  order_delivered: {
    key: "order_delivered",
    name: "Order delivered",
    subject: "Your {{site_name}} order has arrived! 🎀",
    active: true,
    html: `${EMAIL_WRAPPER_OPEN}
      <h1 style="color:#D291BC;">Your order has arrived! 🎀</h1>
      <p>Hi {{customer_name}}, order <strong>#{{order_id}}</strong> has been marked delivered — we hope it made your day a little cuter!</p>
      <p>If anything about your order isn't right, just reply to this email or reach us at {{site_email}} and we'll sort it out.</p>
      ${SIGNOFF}
    ${EMAIL_WRAPPER_CLOSE}`,
  },
  order_cancelled: {
    key: "order_cancelled",
    name: "Order cancelled",
    subject: "Your {{site_name}} order was cancelled",
    active: true,
    html: `${EMAIL_WRAPPER_OPEN}
      <h1 style="color:#D291BC;">Your order was cancelled</h1>
      <p>Hi {{customer_name}}, order <strong>#{{order_id}}</strong> has been cancelled.</p>
      <p>If you didn't expect this or have any questions, just reply to this email or reach us at {{site_email}}.</p>
      ${SIGNOFF}
    ${EMAIL_WRAPPER_CLOSE}`,
  },
  admin_new_order: {
    key: "admin_new_order",
    name: "Admin: new order notification",
    subject: "🎀 New order from {{customer_name}} — {{total}}",
    active: true,
    html: `${EMAIL_WRAPPER_OPEN}
      <h1 style="color:#D291BC;">New order! 🎀</h1>
      <p><strong>{{customer_name}}</strong> just placed order #{{order_id}} for <strong>{{total}}</strong>.</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
        {{items_table}}
        {{discount_row}}
        {{shipping_row}}
        <tr>
          <td style="padding-top:12px; font-weight:bold;">Total</td>
          <td style="padding-top:12px; font-weight:bold; text-align:right;">{{total}}</td>
        </tr>
      </table>
      <p><strong>Ship to:</strong><br/>{{shipping_address}}</p>
      <p><a href="{{admin_order_link}}" style="color:#D291BC;">View in admin dashboard &rarr;</a></p>
    ${EMAIL_WRAPPER_CLOSE}`,
  },
  newsletter_welcome: {
    key: "newsletter_welcome",
    name: "Newsletter: welcome",
    subject: "Welcome to {{site_name}}! 🎀",
    active: true,
    html: `${EMAIL_WRAPPER_OPEN}
      <h1 style="color:#D291BC;">You're on the list! 🎀</h1>
      <p>Hi there, thanks for joining the {{site_name}} newsletter — you'll be first to hear about new drops, restocks, and sneak peeks before anyone else.</p>
      {{discount_row}}
      <p><a href="{{shop_link}}" style="color:#D291BC;">Browse the shop &rarr;</a></p>
      <p>Questions any time? Just reply to this email or reach us at {{site_email}}.</p>
      ${SIGNOFF}
    ${EMAIL_WRAPPER_CLOSE}`,
  },
};

/**
 * Replaces every {{token}} in `text` with the matching value from `vars`.
 * An unmatched token is replaced with an empty string rather than left
 * visible — admin edits are checked against the live preview/test-send
 * before saving, so customers never see a raw {{typo}}.
 */
export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, token: string) => vars[token] ?? "");
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildOrderVars(order: OrderRecord): Record<string, string> {
  const symbol = order.currency === "USD" ? "$" : "₹";

  const itemsTable = order.items
    .map((item) => {
      const modelNote =
        item.kind === "product" && item.phoneModel
          ? ` <span style="color:#9B8589;">(${escapeHtml(item.phoneModel)})</span>`
          : "";
      return `<tr>
          <td style="padding:8px 0;">${escapeHtml(item.name)} × ${item.quantity}${modelNote}</td>
          <td style="padding:8px 0; text-align:right;">${symbol}${(item.unitPriceInr * item.quantity).toFixed(2)}</td>
        </tr>`;
    })
    .join("");

  const discountRow =
    order.discount_amount > 0
      ? `<tr>
          <td style="padding-top:4px; color:#B06A98;">Discount${order.coupon_code ? ` (${escapeHtml(order.coupon_code)})` : ""}</td>
          <td style="padding-top:4px; text-align:right; color:#B06A98;">-${symbol}${order.discount_amount.toFixed(2)}</td>
        </tr>`
      : "";

  const shippingRow = `<tr>
          <td style="padding-top:4px;">Shipping</td>
          <td style="padding-top:4px; text-align:right;">${order.shipping_amount === 0 ? "Free" : `${symbol}${order.shipping_amount.toFixed(2)}`}</td>
        </tr>`;

  const address = order.shipping_address;
  const shippingAddress = [address.line1, address.line2, `${address.city}, ${address.state} ${address.postalCode}`, address.country]
    .filter(Boolean)
    .map((line) => escapeHtml(line as string))
    .join("<br/>");

  const trackingRow =
    order.tracking_number || order.courier
      ? `<p style="margin:16px 0; padding:12px; background:#FBEFF3; border-radius:12px;"><strong>Tracking:</strong> ${escapeHtml(order.tracking_number || "—")}${order.courier ? ` via ${escapeHtml(order.courier)}` : ""}</p>`
      : "";

  return {
    site_name: SITE.name,
    site_email: SITE.email,
    customer_name: order.customer_name,
    order_id: order.id.slice(0, 8),
    order_date: new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" }),
    items_table: itemsTable,
    subtotal: `${symbol}${order.subtotal.toFixed(2)}`,
    discount_row: discountRow,
    shipping_row: shippingRow,
    total: `${symbol}${order.total_amount.toFixed(2)}`,
    shipping_address: shippingAddress,
    tracking_number: order.tracking_number ?? "",
    courier: order.courier ?? "",
    tracking_row: trackingRow,
    admin_order_link: `${SITE.url}/admin/orders/${order.id}`,
  };
}

/**
 * Vars for the newsletter welcome email. `discountCode`/`discountPercent`
 * come from whichever active, manually-entered coupon is currently live (see
 * app/api/newsletter/route.ts) — auto-applied coupons need no code, so
 * they're not what a "here's a discount code" welcome email should feature.
 * Renders a blank `discount_row` if there's no such coupon right now.
 */
export function buildNewsletterVars(discount: { code: string; percentOff: number } | null): Record<string, string> {
  const discountRow = discount
    ? `<p style="margin:16px 0; padding:12px; background:#FBEFF3; border-radius:12px; text-align:center;">Here's <strong>${discount.percentOff}% off</strong> your first order — use code <strong>${discount.code}</strong> at checkout.</p>`
    : "";

  return {
    site_name: SITE.name,
    site_email: SITE.email,
    shop_link: `${SITE.url}/shop`,
    discount_row: discountRow,
  };
}

// Fixture order used for the admin editor's live preview and "send test
// email" — lets the maker see/test a template without needing a real order.
export const SAMPLE_ORDER: OrderRecord = {
  id: "00000000-1111-2222-3333-444444444444",
  customer_name: "Priya Sharma",
  email: "priya@example.com",
  phone: "+91 98765 43210",
  shipping_address: {
    line1: "12 Rose Garden Lane",
    line2: "Flat 4B",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "India",
  },
  items: [
    {
      kind: "product",
      productId: "sample-1",
      slug: "sample-case",
      name: "Strawberry Milk Phone Case",
      image: "",
      unitPriceInr: 599,
      quantity: 1,
      phoneModel: "iPhone 15",
    },
    {
      kind: "product",
      productId: "sample-2",
      slug: "sample-mirror",
      name: "Bubblegum Bow Mirror",
      image: "",
      unitPriceInr: 199,
      quantity: 2,
    },
  ],
  subtotal: 997,
  coupon_code: "LAUNCH50",
  discount_amount: 100,
  shipping_amount: 0,
  total_amount: 897,
  currency: "INR",
  payment_status: "paid",
  payment_provider: "razorpay",
  razorpay_order_id: "order_sample123",
  razorpay_payment_id: "pay_sample123",
  paypal_order_id: null,
  paypal_capture_id: null,
  fulfillment_status: "shipped",
  tracking_number: "SF123456789IN",
  courier: "Delhivery",
  admin_notes: null,
  created_at: new Date().toISOString(),
};
