// Shared definitions for the admin-editable transactional email system.
// Not marked server-only: EMAIL_TEMPLATE_KEYS/EMAIL_TEMPLATE_VARIABLES/
// DEFAULT_EMAIL_TEMPLATES are plain static data the admin editor (a client
// component) reads directly for its sidebar + "reset to default" button,
// same pattern as CATEGORIES/CUSTOM_CASE_THEMES in lib/constants.ts.
import type { CustomRequest, OrderRecord } from "@/lib/types";
import { CATEGORIES, SITE } from "@/lib/constants";
import { whatsappLinkFor } from "@/lib/settings-defaults";

/**
 * Admin-editable store details used inside emails (Admin → Settings), passed
 * in by lib/email.ts. Defaults to the built-in values for previews/tests.
 */
export type EmailContext = {
  contactEmail: string;
  whatsappNumber: string;
  instagramHandle: string;
  categoryName?: (slug: string) => string;
};

export const DEFAULT_EMAIL_CONTEXT: EmailContext = {
  contactEmail: SITE.email,
  whatsappNumber: SITE.whatsappNumber,
  instagramHandle: SITE.instagramHandle,
};

export type EmailTemplateKey =
  | "order_confirmation"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "admin_new_order"
  | "newsletter_welcome"
  | "abandoned_cart"
  | "custom_request_received"
  | "custom_request_approved"
  | "custom_request_rejected"
  | "admin_custom_request";

export const EMAIL_TEMPLATE_KEYS: EmailTemplateKey[] = [
  "order_confirmation",
  "order_shipped",
  "order_delivered",
  "order_cancelled",
  "admin_new_order",
  "newsletter_welcome",
  "abandoned_cart",
  "custom_request_received",
  "custom_request_approved",
  "custom_request_rejected",
  "admin_custom_request",
];

/** Templates rendered with buildRequestVars (custom requests), not order vars. */
export const REQUEST_TEMPLATE_KEYS: EmailTemplateKey[] = [
  "custom_request_received",
  "custom_request_approved",
  "custom_request_rejected",
  "admin_custom_request",
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

const REVIEW_VARS = [
  { token: "review_link", description: "Link that opens an email to you, pre-filled for the customer's review of this order." },
  { token: "review_button", description: "Ready-made \"Tell us what you think\" block with the review link and Instagram tag." },
] as const;

const ABANDONED_CART_VARS = [
  { token: "resume_link", description: "Link back to the shop so the customer can finish their order." },
  { token: "whatsapp_link", description: "Link to chat with you on WhatsApp." },
] as const;

const REQUEST_VARS = [
  { token: "site_name", description: "Your shop's name." },
  { token: "site_email", description: "Your support email address." },
  { token: "customer_name", description: "The customer's full name." },
  { token: "request_id", description: "Short request reference (first 8 characters)." },
  { token: "category_name", description: "The category they asked for." },
  { token: "request_details", description: "Box with category, quantity, model/size, and their notes." },
  { token: "whatsapp_link", description: "Link to chat with you on WhatsApp." },
  { token: "shop_link", description: "Link to the shop page." },
] as const;

const REQUEST_DECISION_VARS = [
  { token: "quoted_price", description: "Your quoted total (₹, and $ for international customers)." },
  { token: "payment_link", description: "Private link where the customer pays for the approved request." },
  { token: "admin_message_block", description: "Your note to the customer (blank if you didn't write one)." },
] as const;

const ADMIN_REQUEST_VARS = [
  { token: "customer_email", description: "Customer's email." },
  { token: "customer_phone", description: "Customer's phone." },
  { token: "customer_country", description: "Customer's country." },
  { token: "admin_request_link", description: "Direct link to the request in your admin dashboard." },
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
  order_delivered: [...BASE_VARS, ...REVIEW_VARS],
  order_cancelled: BASE_VARS,
  admin_new_order: [...BASE_VARS, ...ADMIN_VARS],
  newsletter_welcome: NEWSLETTER_VARS,
  abandoned_cart: [...BASE_VARS, ...ABANDONED_CART_VARS],
  custom_request_received: REQUEST_VARS,
  custom_request_approved: [...REQUEST_VARS, ...REQUEST_DECISION_VARS],
  custom_request_rejected: [...REQUEST_VARS, ...REQUEST_DECISION_VARS],
  admin_custom_request: [...REQUEST_VARS, ...ADMIN_REQUEST_VARS],
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
      {{review_button}}
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
  abandoned_cart: {
    key: "abandoned_cart",
    name: "Abandoned checkout reminder",
    subject: "You left something cute behind 🎀",
    active: true,
    html: `${EMAIL_WRAPPER_OPEN}
      <h1 style="color:#D291BC;">Still thinking it over? 🎀</h1>
      <p>Hi {{customer_name}}, you started checking out at {{site_name}} but didn't finish — your picks are still waiting for you:</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
        {{items_table}}
      </table>
      <p>Most of our pieces are one-of-a-kind, so once they're gone, they're gone!</p>
      <p style="text-align:center; margin:24px 0;"><a href="{{resume_link}}" style="display:inline-block; padding:12px 24px; background:#D291BC; color:#ffffff; border-radius:999px; text-decoration:none; font-weight:bold;">Finish my order</a></p>
      <p>Had trouble paying, or have a question? <a href="{{whatsapp_link}}" style="color:#D291BC;">Message us on WhatsApp</a> or just reply to this email.</p>
      ${SIGNOFF}
    ${EMAIL_WRAPPER_CLOSE}`,
  },
  custom_request_received: {
    key: "custom_request_received",
    name: "Custom request: received (to customer)",
    subject: "We got your custom request 🎀 (#{{request_id}})",
    active: true,
    html: `${EMAIL_WRAPPER_OPEN}
      <h1 style="color:#D291BC;">Thank you for your request! 🎀</h1>
      <p>Hi {{customer_name}}, we've received your custom request <strong>#{{request_id}}</strong> and will review it personally.</p>
      {{request_details}}
      <p>We'll email you within 1-2 days with a price, or with any questions. Nothing is charged until you approve the price and pay.</p>
      <p>Have reference photos? <a href="{{whatsapp_link}}" style="color:#D291BC;">Send them on WhatsApp</a> with your request number.</p>
      ${SIGNOFF}
    ${EMAIL_WRAPPER_CLOSE}`,
  },
  custom_request_approved: {
    key: "custom_request_approved",
    name: "Custom request: approved (to customer)",
    subject: "Your custom request is approved! 🎀 (#{{request_id}})",
    active: true,
    html: `${EMAIL_WRAPPER_OPEN}
      <h1 style="color:#D291BC;">Good news — we can make it! 🎀</h1>
      <p>Hi {{customer_name}}, your custom request <strong>#{{request_id}}</strong> has been approved.</p>
      {{admin_message_block}}
      {{request_details}}
      <p style="font-size:18px;"><strong>Price: {{quoted_price}}</strong> <span style="color:#9B8589;">(+ shipping, calculated at payment)</span></p>
      <p style="text-align:center; margin:24px 0;"><a href="{{payment_link}}" style="display:inline-block; padding:12px 24px; background:#D291BC; color:#ffffff; border-radius:999px; text-decoration:none; font-weight:bold;">Pay &amp; confirm my order</a></p>
      <p>We start making your piece as soon as payment is confirmed. Questions? Just reply to this email or <a href="{{whatsapp_link}}" style="color:#D291BC;">message us on WhatsApp</a>.</p>
      ${SIGNOFF}
    ${EMAIL_WRAPPER_CLOSE}`,
  },
  custom_request_rejected: {
    key: "custom_request_rejected",
    name: "Custom request: not possible (to customer)",
    subject: "About your custom request (#{{request_id}})",
    active: true,
    html: `${EMAIL_WRAPPER_OPEN}
      <h1 style="color:#D291BC;">Thank you for thinking of us 💕</h1>
      <p>Hi {{customer_name}}, thank you so much for your custom request <strong>#{{request_id}}</strong>. After looking at it carefully, we're sorry to say we aren't able to take it on this time.</p>
      {{admin_message_block}}
      <p>We'd still love to make something for you — have a look at our <a href="{{shop_link}}" style="color:#D291BC;">ready-made designs</a>, or reply to this email if you'd like to adjust your request.</p>
      ${SIGNOFF}
    ${EMAIL_WRAPPER_CLOSE}`,
  },
  admin_custom_request: {
    key: "admin_custom_request",
    name: "Admin: new custom request",
    subject: "🎀 New custom request from {{customer_name}} — {{category_name}}",
    active: true,
    html: `${EMAIL_WRAPPER_OPEN}
      <h1 style="color:#D291BC;">New custom request 🎀</h1>
      <p><strong>{{customer_name}}</strong> ({{customer_email}}, {{customer_phone}}, {{customer_country}}) requested a custom <strong>{{category_name}}</strong>.</p>
      {{request_details}}
      <p><a href="{{admin_request_link}}" style="color:#D291BC;">Review &amp; approve or reject in the admin dashboard &rarr;</a></p>
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

export function buildOrderVars(order: OrderRecord, ctx: EmailContext = DEFAULT_EMAIL_CONTEXT): Record<string, string> {
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

  // On-site review form (app/review), pre-filled with the order + name.
  const reviewLink = `${SITE.url}/review?order=${order.id.slice(0, 8)}&name=${encodeURIComponent(order.customer_name.split(" ")[0] ?? "")}`;

  const trackingRow =
    order.tracking_number || order.courier
      ? `<p style="margin:16px 0; padding:12px; background:#FBEFF3; border-radius:12px;"><strong>Tracking:</strong> ${escapeHtml(order.tracking_number || "—")}${order.courier ? ` via ${escapeHtml(order.courier)}` : ""}</p>`
      : "";

  return {
    site_name: SITE.name,
    site_email: ctx.contactEmail,
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
    review_link: reviewLink,
    review_button: `<p style="margin:16px 0; padding:16px; background:#FBEFF3; border-radius:12px; text-align:center;">Loved your piece? We'd be so grateful for a review! 💕<br/><a href="${reviewLink}" style="display:inline-block; margin-top:10px; padding:10px 20px; background:#D291BC; color:#ffffff; border-radius:999px; text-decoration:none; font-weight:bold;">Tell us what you think</a><br/><span style="font-size:13px; color:#9B8589;">It takes a minute — or tag ${ctx.instagramHandle} on Instagram.</span></p>`,
    resume_link: `${SITE.url}/shop`,
    whatsapp_link: whatsappLinkFor(ctx.whatsappNumber, `Hi! I have a question about my order at ${SITE.name}.`),
  };
}

/**
 * Vars for the newsletter welcome email. `discountCode`/`discountPercent`
 * come from whichever active, manually-entered coupon is currently live (see
 * app/api/newsletter/route.ts) — auto-applied coupons need no code, so
 * they're not what a "here's a discount code" welcome email should feature.
 * Renders a blank `discount_row` if there's no such coupon right now.
 */
export function buildNewsletterVars(
  discount: { code: string; percentOff: number } | null,
  ctx: EmailContext = DEFAULT_EMAIL_CONTEXT
): Record<string, string> {
  const discountRow = discount
    ? `<p style="margin:16px 0; padding:12px; background:#FBEFF3; border-radius:12px; text-align:center;">Here's <strong>${discount.percentOff}% off</strong> your first order — use code <strong>${discount.code}</strong> at checkout.</p>`
    : "";

  return {
    site_name: SITE.name,
    site_email: ctx.contactEmail,
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

/**
 * Vars for the custom-request emails (received / approved / rejected /
 * admin notification). International customers see the $ quote alongside ₹.
 */
export function buildRequestVars(request: CustomRequest, ctx: EmailContext = DEFAULT_EMAIL_CONTEXT): Record<string, string> {
  const categoryName =
    ctx.categoryName?.(request.category) ?? CATEGORIES.find((c) => c.slug === request.category)?.name ?? request.category;
  const isInternational = request.country.trim().toLowerCase() !== "india";
  const notes = escapeHtml(request.notes).replace(/\n/g, "<br/>");

  const requestDetails = `<div style="margin:16px 0; padding:12px 16px; background:#FBEFF3; border-radius:12px;">
        <p style="margin:4px 0;"><strong>Category:</strong> ${escapeHtml(categoryName)}</p>
        <p style="margin:4px 0;"><strong>Quantity:</strong> ${request.quantity}</p>
        ${request.device_model ? `<p style="margin:4px 0;"><strong>Model / size:</strong> ${escapeHtml(request.device_model)}</p>` : ""}
        <p style="margin:4px 0;"><strong>Your notes:</strong><br/>${notes}</p>
      </div>`;

  const quotedPrice =
    request.quoted_price_inr == null
      ? ""
      : isInternational && request.quoted_price_usd != null
        ? `$${request.quoted_price_usd.toFixed(2)} (or ₹${request.quoted_price_inr.toFixed(2)} if paying in rupees)`
        : `₹${request.quoted_price_inr.toFixed(2)}`;

  const adminMessageBlock = request.admin_message?.trim()
    ? `<p style="margin:16px 0; padding:12px 16px; border-left:4px solid #D291BC; background:#FFF8FB;"><em>A note from ${escapeHtml(SITE.name)}:</em><br/>${escapeHtml(request.admin_message.trim()).replace(/\n/g, "<br/>")}</p>`
    : "";

  return {
    site_name: SITE.name,
    site_email: ctx.contactEmail,
    customer_name: escapeHtml(request.customer_name),
    customer_email: escapeHtml(request.email),
    customer_phone: escapeHtml(request.phone),
    customer_country: escapeHtml(request.country),
    request_id: request.id.slice(0, 8),
    category_name: escapeHtml(categoryName),
    request_details: requestDetails,
    quoted_price: quotedPrice,
    payment_link: `${SITE.url}/pay/${request.token}`,
    admin_message_block: adminMessageBlock,
    admin_request_link: `${SITE.url}/admin/requests/${request.id}`,
    whatsapp_link: whatsappLinkFor(ctx.whatsappNumber, `Hi! About my custom request #${request.id.slice(0, 8)}`),
    shop_link: `${SITE.url}/shop`,
  };
}

// Fixture request for the admin email editor's preview / test send.
export const SAMPLE_REQUEST: CustomRequest = {
  id: "5a3c9e10-0000-4000-8000-000000000000",
  token: "sample-token-for-preview-only",
  category: "water-bottles",
  quantity: 2,
  device_model: "750 ml steel bottle",
  notes: "Pastel pink and lilac with Cinnamoroll charms and a little bow on the lid.\nOne with the name 'Aanya', one with 'Riya'.",
  customer_name: "Aanya Sharma",
  email: "aanya@example.com",
  phone: "+91 98765 43210",
  country: "India",
  status: "approved",
  quoted_price_inr: 1499,
  quoted_price_usd: 18,
  admin_message: "Love this idea! I'll use matching pastel cream on both so they look like a set.",
  decided_at: new Date().toISOString(),
  order_id: null,
  created_at: new Date().toISOString(),
};

/** Sample vars for the admin editor's preview / test send, by template type. */
export function sampleVarsFor(key: string): Record<string, string> {
  if ((REQUEST_TEMPLATE_KEYS as string[]).includes(key)) return buildRequestVars(SAMPLE_REQUEST);
  if (key === "newsletter_welcome") return buildNewsletterVars({ code: "CUTEJOY10", percentOff: 10 });
  return buildOrderVars(SAMPLE_ORDER);
}
