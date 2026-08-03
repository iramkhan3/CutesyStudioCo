import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { OrderItemSnapshot, OrderRecord, ShippingAddress } from "@/lib/types";

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
}): Promise<OrderRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .insert({
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
      currency: "INR",
      payment_status: "pending",
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as OrderRecord;
}

export async function attachRazorpayOrderId(orderId: string, razorpayOrderId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("orders").update({ razorpay_order_id: razorpayOrderId }).eq("id", orderId);
}

export async function markOrderPaid(orderId: string, razorpayPaymentId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .update({ payment_status: "paid", razorpay_payment_id: razorpayPaymentId })
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

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) return null;
  return data as OrderRecord;
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
