import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  FulfillmentStatus,
  OrderItemSnapshot,
  OrderRecord,
  PaymentProvider,
  PaymentStatus,
  ShippingAddress,
} from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * fulfillment_status / tracking_number / courier / admin_notes are newer
 * columns (added for the admin dashboard). Until supabase/schema.sql's
 * migration for them is re-run, a row fetched via `select("*")` simply won't
 * have them (undefined, not null) — fill in safe defaults rather than let
 * `undefined` leak into the UI as "unfulfilled" rendering as blank/crashing.
 */
function normalizeOrder(row: Record<string, unknown>): OrderRecord {
  return {
    ...row,
    fulfillment_status: (row.fulfillment_status as FulfillmentStatus | undefined) ?? "unfulfilled",
    tracking_number: (row.tracking_number as string | null | undefined) ?? null,
    courier: (row.courier as string | null | undefined) ?? null,
    admin_notes: (row.admin_notes as string | null | undefined) ?? null,
  } as OrderRecord;
}

export async function createPendingOrder(input: {
  customerName: string;
  email: string;
  phone: string | null;
  shippingAddress: ShippingAddress;
  items: OrderItemSnapshot[];
  subtotal: number;
  couponCode: string | null;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  currency?: "INR" | "USD";
  paymentProvider?: PaymentProvider;
}): Promise<OrderRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const baseRow = {
    customer_name: input.customerName,
    email: input.email,
    phone: input.phone,
    shipping_address: input.shippingAddress,
    items: input.items,
    subtotal: input.subtotal,
    coupon_code: input.couponCode,
    discount_amount: input.discountAmount,
    shipping_amount: input.shippingAmount,
    total_amount: input.totalAmount,
    currency: input.currency ?? "INR",
    payment_status: "pending",
  };

  const { data, error } = await supabase
    .from("orders")
    .insert({ ...baseRow, payment_provider: input.paymentProvider ?? "razorpay" })
    .select()
    .single();

  if (!error && data) return data as OrderRecord;

  // `payment_provider` is a newer column (added for PayPal) — if
  // supabase/schema.sql's migration for it hasn't been re-run yet on this
  // database, PostgREST rejects the insert. It reports this differently
  // depending on context: "42703" (Postgres' own "column does not exist")
  // or "PGRST204" (PostgREST's schema-cache "could not find column" for an
  // insert) — check both. Fall back to the base insert (omitting that
  // column) so the already-working Razorpay flow never breaks because of an
  // unrelated pending migration. A genuine PayPal order still needs that
  // column though, so it correctly keeps failing (-> null -> friendly 503)
  // until the migration runs.
  const isMissingColumn = ["42703", "PGRST204"].includes(
    (error as { code?: string } | null)?.code ?? ""
  );
  if (isMissingColumn && (!input.paymentProvider || input.paymentProvider === "razorpay")) {
    const retry = await supabase.from("orders").insert(baseRow).select().single();
    if (!retry.error && retry.data) return retry.data as OrderRecord;
  }

  return null;
}

export async function attachRazorpayOrderId(orderId: string, razorpayOrderId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("orders").update({ razorpay_order_id: razorpayOrderId }).eq("id", orderId);
}

export async function attachPaypalOrderId(orderId: string, paypalOrderId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("orders").update({ paypal_order_id: paypalOrderId }).eq("id", orderId);
}

/**
 * Marks an order paid, but only transitions it out of "pending" — both the
 * client-side post-payment callback (app/api/verify-payment) and the
 * Razorpay webhook (app/api/webhooks/razorpay) call this for the same
 * payment, since either one can be the one that actually arrives (a flaky
 * network can drop the client round trip, which is exactly why the webhook
 * exists as a backstop). The `.eq("payment_status", "pending")` guard makes
 * whichever call arrives second a no-op instead of double-decrementing stock
 * or sending duplicate emails — `alreadyPaid: true` tells the caller to skip
 * those side effects rather than treating it as a failure.
 */
export async function markOrderPaid(
  orderId: string,
  razorpayPaymentId: string
): Promise<{ order: OrderRecord; alreadyPaid: boolean } | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .update({ payment_status: "paid", razorpay_payment_id: razorpayPaymentId })
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .select()
    .single();

  if (!error && data) return { order: data as OrderRecord, alreadyPaid: false };

  // No row matched the "pending" guard — most likely the other caller (client
  // round trip vs. webhook) already marked it paid first. Confirm that before
  // treating it as a real failure.
  const existing = await getOrderById(orderId);
  if (existing && existing.payment_status === "paid") return { order: existing, alreadyPaid: true };
  return null;
}

export async function markOrderPaidPaypal(orderId: string, paypalCaptureId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .update({ payment_status: "paid", paypal_capture_id: paypalCaptureId })
    .eq("id", orderId)
    .select()
    .single();

  if (error || !data) return null;
  return data as OrderRecord;
}

export async function markOrderFailed(orderId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("orders").update({ payment_status: "failed" }).eq("id", orderId);
}

export async function getOrderById(orderId: string): Promise<OrderRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  if (!UUID_RE.test(orderId)) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeOrder(data);
}

/** Looks up an order by the Razorpay order id attached to it in create-order — used by the webhook, which only knows Razorpay's ids, not ours. */
export async function getOrderByRazorpayOrderId(razorpayOrderId: string): Promise<OrderRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeOrder(data);
}

// ---------------------------------------------------------------------------
// Admin dashboard — listing, stats, and fulfillment updates. All of this is
// only ever reached through /api/admin/* routes, which middleware.ts gates
// behind a signed admin session cookie.
// ---------------------------------------------------------------------------

export type OrderListFilters = {
  search?: string;
  paymentStatus?: PaymentStatus | "all";
  paymentProvider?: PaymentProvider | "all";
  fulfillmentStatus?: FulfillmentStatus | "all";
  page?: number;
  pageSize?: number;
};

export type OrderListResult = {
  orders: OrderRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listOrders(filters: OrderListFilters = {}): Promise<OrderListResult> {
  const page = Math.max(1, Math.floor(filters.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Math.floor(filters.pageSize ?? 25) || 25));

  const supabase = getSupabaseAdmin();
  if (!supabase) return { orders: [], total: 0, page, pageSize };

  let query = supabase.from("orders").select("*", { count: "exact" });

  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    query = query.eq("payment_status", filters.paymentStatus);
  }
  if (filters.paymentProvider && filters.paymentProvider !== "all") {
    query = query.eq("payment_provider", filters.paymentProvider);
  }
  if (filters.fulfillmentStatus && filters.fulfillmentStatus !== "all") {
    query = query.eq("fulfillment_status", filters.fulfillmentStatus);
  }
  if (filters.search && filters.search.trim()) {
    // `,` and `(` `)` are PostgREST's own delimiters inside `.or()` — strip
    // them from user input so an unusual search term degrades to a slightly
    // looser match instead of throwing a query-parse error.
    const term = filters.search.trim().replace(/[(),]/g, "");
    const orParts = [`customer_name.ilike.%${term}%`, `email.ilike.%${term}%`];
    if (UUID_RE.test(term)) orParts.push(`id.eq.${term}`);
    if (term) query = query.or(orParts.join(","));
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error || !data) return { orders: [], total: 0, page, pageSize };

  return { orders: data.map(normalizeOrder), total: count ?? 0, page, pageSize };
}

export type OrderStats = {
  todayCount: number;
  pendingCount: number;
  unfulfilledCount: number;
  last30dPaidCount: number;
  paidRevenueInr30d: number;
  paidRevenueUsd30d: number;
};

export async function getOrderStats(): Promise<OrderStats> {
  const empty: OrderStats = {
    todayCount: 0,
    pendingCount: 0,
    unfulfilledCount: 0,
    last30dPaidCount: 0,
    paidRevenueInr30d: 0,
    paidRevenueUsd30d: 0,
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) return empty;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [todayRes, pendingRes, unfulfilledRes, recentPaidRes] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", startOfToday.toISOString()),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "pending"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "paid")
      .eq("fulfillment_status", "unfulfilled"),
    supabase
      .from("orders")
      .select("total_amount, currency")
      .eq("payment_status", "paid")
      .gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

  const recentPaid = recentPaidRes.data ?? [];
  const paidRevenueInr30d = recentPaid
    .filter((o) => o.currency === "INR")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const paidRevenueUsd30d = recentPaid
    .filter((o) => o.currency === "USD")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  return {
    todayCount: todayRes.count ?? 0,
    pendingCount: pendingRes.count ?? 0,
    unfulfilledCount: unfulfilledRes.count ?? 0,
    last30dPaidCount: recentPaid.length,
    paidRevenueInr30d,
    paidRevenueUsd30d,
  };
}

export type OrderFulfillmentUpdate = {
  fulfillment_status?: FulfillmentStatus;
  tracking_number?: string | null;
  courier?: string | null;
  admin_notes?: string | null;
};

export async function updateOrderFulfillment(
  orderId: string,
  updates: OrderFulfillmentUpdate
): Promise<OrderRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  if (!UUID_RE.test(orderId)) return null;

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select()
    .single();

  if (error || !data) return null;
  return normalizeOrder(data);
}

/**
 * Best-effort stock decrement after a successful payment. Not run inside a
 * DB transaction with the order update — for a small handmade shop with low
 * concurrent order volume this is an acceptable tradeoff, but if you scale
 * up, move this into a Postgres RPC function that decrements atomically.
 */
export async function decrementStock(items: OrderItemSnapshot[]) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  for (const item of items) {
    if (item.kind !== "product") continue;

    const { data } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", item.productId)
      .maybeSingle();

    if (data) {
      const newQty = Math.max(0, data.stock_quantity - item.quantity);
      await supabase.from("products").update({ stock_quantity: newQty }).eq("id", item.productId);
    }
  }
}
