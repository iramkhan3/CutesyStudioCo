import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendAbandonedCartEmail } from "@/lib/email";
import type { OrderItemSnapshot, OrderRecord } from "@/lib/types";

// Only remind about checkouts at least this old (give people a chance to
// finish on their own) and no older than this (stale reminders feel spammy).
const MIN_AGE_HOURS = 1;
const MAX_AGE_DAYS = 3;
// Saved checkout emails that never turned into an order are deleted after this.
const LEAD_RETENTION_DAYS = 30;

export type AbandonedCartRunResult = { checked: number; sent: number; skipped: number };

type Lead = {
  email: string;
  name: string | null;
  country: string | null;
  items: OrderItemSnapshot[];
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Emails a one-time "you left something behind" reminder for abandoned
 * checkouts, from two sources:
 *  1. orders — the customer clicked Pay but never paid;
 *  2. checkout_leads — they typed their email at checkout but never even
 *     clicked Pay (saved in the background by app/api/checkout-leads).
 * At most one reminder per email per window. Skipped if the customer has
 * paid for an order since, was already reminded, or every item has sold
 * out / been hidden (sold-out items are dropped from the email). Each source
 * row is claimed before sending, so overlapping runs can't double-send.
 */
export async function sendAbandonedCartReminders(): Promise<AbandonedCartRunResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { checked: 0, sent: 0, skipped: 0 };

  const now = Date.now();
  const newest = new Date(now - MIN_AGE_HOURS * 3600_000).toISOString();
  const oldest = new Date(now - MAX_AGE_DAYS * 86400_000).toISOString();

  const { data: orderRows, error } = await supabase
    .from("orders")
    .select("*")
    .in("payment_status", ["pending", "failed"])
    .is("abandoned_reminder_sent_at", null)
    .gte("created_at", oldest)
    .lte("created_at", newest)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load abandoned checkouts: ${error.message}`);

  // checkout_leads may not exist yet (schema.sql not re-run) — then skip it.
  const { data: leadRows } = await supabase
    .from("checkout_leads")
    .select("*")
    .is("reminder_sent_at", null)
    .gte("updated_at", oldest)
    .lte("updated_at", newest)
    .order("updated_at", { ascending: false });

  const orders = (orderRows ?? []) as OrderRecord[];
  const leads = (leadRows ?? []) as Lead[];
  const result: AbandonedCartRunResult = { checked: orders.length + leads.length, sent: 0, skipped: 0 };
  const handledEmails = new Set<string>();

  // Has this person paid since `since`, or already had a reminder recently?
  async function shouldSkip(email: string, since: string): Promise<boolean> {
    const [{ count: paidSince }, { count: remindedOrder }, { count: remindedLead }] = await Promise.all([
      supabase!.from("orders").select("id", { count: "exact", head: true }).ilike("email", email).eq("payment_status", "paid").gte("created_at", since),
      supabase!.from("orders").select("id", { count: "exact", head: true }).ilike("email", email).gte("abandoned_reminder_sent_at", oldest),
      supabase!.from("checkout_leads").select("email", { count: "exact", head: true }).eq("email", email).gte("reminder_sent_at", oldest),
    ]);
    return (paidSince ?? 0) > 0 || (remindedOrder ?? 0) > 0 || (remindedLead ?? 0) > 0;
  }

  // 1. Orders (they got as far as clicking Pay) — newest first per email.
  for (const order of orders) {
    const email = order.email.trim().toLowerCase();
    if (handledEmails.has(email)) {
      result.skipped++;
      continue;
    }
    handledEmails.add(email);

    if (await shouldSkip(email, order.created_at)) {
      result.skipped++;
      continue;
    }
    const availableItems = await stillAvailableItems(order.items);
    if (availableItems.length === 0) {
      result.skipped++;
      continue;
    }
    const { data: claimed } = await supabase
      .from("orders")
      .update({ abandoned_reminder_sent_at: new Date().toISOString() })
      .eq("id", order.id)
      .is("abandoned_reminder_sent_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) {
      result.skipped++;
      continue;
    }
    // Also mark their saved checkout email, so it isn't reminded separately.
    await supabase.from("checkout_leads").update({ reminder_sent_at: new Date().toISOString() }).eq("email", email);

    const sent = await sendAbandonedCartEmail({ ...order, items: availableItems });
    if (sent.sent) result.sent++;
    else result.skipped++;
  }

  // 2. Saved checkout emails that never became an order.
  for (const lead of leads) {
    const email = lead.email.trim().toLowerCase();
    if (handledEmails.has(email)) {
      result.skipped++;
      continue;
    }
    handledEmails.add(email);

    // Any order (paid or not) placed after they typed their email means the
    // order path above already covers them, or they bought.
    const { count: orderedSince } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .ilike("email", email)
      .gte("created_at", lead.created_at);
    if ((orderedSince ?? 0) > 0 || (await shouldSkip(email, lead.created_at))) {
      result.skipped++;
      continue;
    }
    const availableItems = await stillAvailableItems(lead.items ?? []);
    if (availableItems.length === 0) {
      result.skipped++;
      continue;
    }
    const { data: claimed } = await supabase
      .from("checkout_leads")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("email", lead.email)
      .is("reminder_sent_at", null)
      .select("email")
      .maybeSingle();
    if (!claimed) {
      result.skipped++;
      continue;
    }

    const sent = await sendAbandonedCartEmail(leadAsOrder(lead, availableItems));
    if (sent.sent) result.sent++;
    else result.skipped++;
  }

  // Privacy: don't keep saved checkout emails around forever.
  await supabase
    .from("checkout_leads")
    .delete()
    .lt("updated_at", new Date(now - LEAD_RETENTION_DAYS * 86400_000).toISOString());

  return result;
}

/** Shapes a saved checkout email like an order, for the reminder email template. */
function leadAsOrder(lead: Lead, items: OrderItemSnapshot[]): OrderRecord {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    customer_name: lead.name?.trim() || "there",
    email: lead.email,
    phone: null,
    shipping_address: { line1: "", city: "", state: "", postalCode: "", country: lead.country ?? "" },
    items,
    subtotal: items.reduce((sum, i) => sum + i.unitPriceInr * i.quantity, 0),
    coupon_code: null,
    discount_amount: 0,
    shipping_amount: 0,
    total_amount: 0,
    currency: "INR",
    payment_status: "pending",
    payment_provider: "razorpay",
    razorpay_order_id: null,
    razorpay_payment_id: null,
    paypal_order_id: null,
    paypal_capture_id: null,
    fulfillment_status: "unfulfilled",
    tracking_number: null,
    courier: null,
    admin_notes: null,
    created_at: lead.created_at,
  };
}

/** Custom pieces are always makeable; products must still be active and in stock. */
async function stillAvailableItems(items: OrderItemSnapshot[]): Promise<OrderItemSnapshot[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const productIds = items.filter((i) => i.kind === "product").map((i) => i.productId);
  if (productIds.length === 0) return items;

  const { data } = await supabase.from("products").select("id, active, stock_quantity").in("id", productIds);
  const available = new Set(
    ((data ?? []) as { id: string; active: boolean; stock_quantity: number }[])
      .filter((p) => p.active && p.stock_quantity > 0)
      .map((p) => p.id)
  );
  return items.filter((i) => i.kind === "custom" || available.has(i.productId));
}
