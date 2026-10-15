import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendAbandonedCartEmail } from "@/lib/email";
import type { OrderRecord } from "@/lib/types";

// Only remind about checkouts at least this old (give people a chance to
// finish on their own) and no older than this (stale reminders feel spammy).
const MIN_AGE_HOURS = 1;
const MAX_AGE_DAYS = 3;

export type AbandonedCartRunResult = { checked: number; sent: number; skipped: number };

/**
 * Emails a one-time "you left something behind" reminder for checkouts that
 * were started (an order was created when the customer clicked Pay) but
 * never paid. Skips an email if:
 *  - that customer has a paid order placed at/after the abandoned one,
 *  - a reminder already went to them for any order in the window,
 *  - none of the abandoned products are still available (sold out/hidden).
 * Each order is claimed (abandoned_reminder_sent_at set) before sending, so
 * overlapping runs can't double-send.
 */
export async function sendAbandonedCartReminders(): Promise<AbandonedCartRunResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { checked: 0, sent: 0, skipped: 0 };

  const now = Date.now();
  const newest = new Date(now - MIN_AGE_HOURS * 3600_000).toISOString();
  const oldest = new Date(now - MAX_AGE_DAYS * 86400_000).toISOString();

  const { data: candidates, error } = await supabase
    .from("orders")
    .select("*")
    .in("payment_status", ["pending", "failed"])
    .is("abandoned_reminder_sent_at", null)
    .gte("created_at", oldest)
    .lte("created_at", newest)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load abandoned checkouts: ${error.message}`);

  const orders = (candidates ?? []) as OrderRecord[];
  const result: AbandonedCartRunResult = { checked: orders.length, sent: 0, skipped: 0 };
  const handledEmails = new Set<string>();

  for (const order of orders) {
    const email = order.email.trim().toLowerCase();
    // Newest first, so only each customer's most recent abandoned checkout.
    if (handledEmails.has(email)) {
      result.skipped++;
      continue;
    }
    handledEmails.add(email);

    const [{ count: paidSince }, { count: remindedRecently }] = await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .ilike("email", email)
        .eq("payment_status", "paid")
        .gte("created_at", order.created_at),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .ilike("email", email)
        .gte("abandoned_reminder_sent_at", oldest),
    ]);
    if ((paidSince ?? 0) > 0 || (remindedRecently ?? 0) > 0) {
      result.skipped++;
      continue;
    }

    const availableItems = await stillAvailableItems(order);
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

    const sendResult = await sendAbandonedCartEmail({ ...order, items: availableItems });
    if (sendResult.sent) result.sent++;
    else result.skipped++;
  }

  return result;
}

/** Custom pieces are always makeable; products must still be active and in stock. */
async function stillAvailableItems(order: OrderRecord): Promise<OrderRecord["items"]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const productIds = order.items.filter((i) => i.kind === "product").map((i) => i.productId);
  if (productIds.length === 0) return order.items;

  const { data } = await supabase.from("products").select("id, active, stock_quantity").in("id", productIds);
  const available = new Set(
    ((data ?? []) as { id: string; active: boolean; stock_quantity: number }[])
      .filter((p) => p.active && p.stock_quantity > 0)
      .map((p) => p.id)
  );
  return order.items.filter((i) => i.kind === "custom" || available.has(i.productId));
}
