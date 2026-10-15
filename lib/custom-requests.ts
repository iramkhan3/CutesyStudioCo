import "server-only";
import { randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getCategory, getEnabledCategories, getStoreSettings } from "@/lib/settings";
import type { CustomRequest, CustomRequestStatus } from "@/lib/types";

/**
 * "Request a custom piece" — available for every enabled category (except
 * "ready-to-ship", which is a stock status, not something you request).
 * Lifecycle: pending → approved (maker quotes a total price) | rejected →
 * paid (customer pays via /pay/<token>, which creates a normal order).
 * Separate from the pay-now custom builder (CUSTOM_PRODUCT_TYPES), which
 * stays as-is.
 */

export type CustomRequestCategory = { slug: string; name: string; fromInr: number | null };

const NUMERIC = ["quantity", "quoted_price_inr", "quoted_price_usd"] as const;

function normalize(row: Record<string, unknown>): CustomRequest {
  const r = { ...row } as Record<string, unknown>;
  for (const key of NUMERIC) if (r[key] != null) r[key] = Number(r[key]);
  return r as unknown as CustomRequest;
}

export async function categoryName(slug: string): Promise<string> {
  return (await getCategory(slug))?.name ?? slug;
}

/** Categories customers can request a custom piece in, with "starting from" prices. */
export async function getCustomRequestCategories(): Promise<CustomRequestCategory[]> {
  return (await getEnabledCategories())
    .filter((c) => c.slug !== "ready-to-ship")
    .map((c) => ({ slug: c.slug, name: c.name, fromInr: c.customFromInr }));
}

export type NewCustomRequestInput = {
  category: string;
  quantity: number;
  deviceModel: string | null;
  notes: string;
  customerName: string;
  email: string;
  phone: string;
  country: string;
};

const MAX_OPEN_REQUESTS_PER_EMAIL = 5;

export async function createCustomRequest(
  input: NewCustomRequestInput
): Promise<CustomRequest | { error: string; status: number }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Custom requests aren't available right now — please message us instead.", status: 503 };

  // Light spam guard: cap how many undecided requests one email can have.
  const { count } = await supabase
    .from("custom_requests")
    .select("id", { count: "exact", head: true })
    .ilike("email", input.email)
    .eq("status", "pending");
  if ((count ?? 0) >= MAX_OPEN_REQUESTS_PER_EMAIL) {
    return {
      error: "You already have several requests waiting for review — we'll get back to you on those first!",
      status: 429,
    };
  }

  const { data, error } = await supabase
    .from("custom_requests")
    .insert({
      token: randomBytes(24).toString("base64url"),
      category: input.category,
      quantity: input.quantity,
      device_model: input.deviceModel,
      notes: input.notes,
      customer_name: input.customerName,
      email: input.email,
      phone: input.phone,
      country: input.country,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[custom-requests] insert failed:", error);
    return { error: "We couldn't save your request — please try again in a moment.", status: 503 };
  }
  return normalize(data);
}

export async function getCustomRequestByToken(token: string): Promise<CustomRequest | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !token || token.length < 20) return null;
  const { data } = await supabase.from("custom_requests").select("*").eq("token", token).maybeSingle();
  return data ? normalize(data) : null;
}

export async function adminGetCustomRequest(id: string): Promise<CustomRequest | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase.from("custom_requests").select("*").eq("id", id).maybeSingle();
  return data ? normalize(data) : null;
}

export async function adminListCustomRequests(status?: CustomRequestStatus): Promise<CustomRequest[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  let query = supabase.from("custom_requests").select("*").order("created_at", { ascending: false }).limit(200);
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return (data ?? []).map(normalize);
}

export async function adminCountPendingRequests(): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("custom_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

/** Suggested USD quote for an INR amount (admin's $/₹ rate, rounded up to $0.50). */
export async function suggestUsd(inr: number): Promise<number> {
  const { shipping } = await getStoreSettings();
  return Math.ceil((inr / shipping.usdInrRate) * 2) / 2;
}

/**
 * Approves a pending request with a quote (or updates the quote of an
 * approved-but-unpaid one). Returns the updated row, or an error.
 */
export async function adminApproveCustomRequest(
  id: string,
  quote: { priceInr: number; priceUsd: number; message: string | null }
): Promise<CustomRequest | { error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Database isn't configured." };

  const { data, error } = await supabase
    .from("custom_requests")
    .update({
      status: "approved",
      quoted_price_inr: quote.priceInr,
      quoted_price_usd: quote.priceUsd,
      admin_message: quote.message,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", ["pending", "approved"])
    .select()
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "This request can't be approved any more (it's already rejected or paid)." };
  return normalize(data);
}

export async function adminRejectCustomRequest(id: string, message: string | null): Promise<CustomRequest | { error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Database isn't configured." };

  const { data, error } = await supabase
    .from("custom_requests")
    .update({ status: "rejected", admin_message: message, decided_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["pending", "approved"])
    .select()
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "This request can't be rejected any more (it's already paid or rejected)." };
  return normalize(data);
}

/** Links the order created at payment time to its request (latest attempt wins). */
export async function attachOrderToCustomRequest(requestId: string, orderId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("custom_requests").update({ order_id: orderId }).eq("id", requestId).eq("status", "approved");
}

/**
 * Called by every payment-success path (Razorpay verify + webhook, PayPal
 * capture) with the paid order's id. No-op for normal orders.
 */
export async function markCustomRequestPaidForOrder(orderId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("custom_requests").update({ status: "paid" }).eq("order_id", orderId).eq("status", "approved");
}
