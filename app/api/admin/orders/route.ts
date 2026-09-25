import { NextResponse } from "next/server";
import { listOrders } from "@/lib/orders";
import type { FulfillmentStatus, PaymentProvider, PaymentStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed"];
const PAYMENT_PROVIDERS: PaymentProvider[] = ["razorpay", "paypal"];
const FULFILLMENT_STATUSES: FulfillmentStatus[] = ["unfulfilled", "shipped", "delivered", "cancelled"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const paymentStatusParam = searchParams.get("paymentStatus") ?? "all";
  const paymentStatus =
    paymentStatusParam === "all" || PAYMENT_STATUSES.includes(paymentStatusParam as PaymentStatus)
      ? (paymentStatusParam as PaymentStatus | "all")
      : "all";

  const paymentProviderParam = searchParams.get("paymentProvider") ?? "all";
  const paymentProvider =
    paymentProviderParam === "all" || PAYMENT_PROVIDERS.includes(paymentProviderParam as PaymentProvider)
      ? (paymentProviderParam as PaymentProvider | "all")
      : "all";

  const fulfillmentStatusParam = searchParams.get("fulfillmentStatus") ?? "all";
  const fulfillmentStatus =
    fulfillmentStatusParam === "all" || FULFILLMENT_STATUSES.includes(fulfillmentStatusParam as FulfillmentStatus)
      ? (fulfillmentStatusParam as FulfillmentStatus | "all")
      : "all";

  const search = searchParams.get("search")?.slice(0, 200) ?? undefined;

  const result = await listOrders({ page, search, paymentStatus, paymentProvider, fulfillmentStatus });
  return NextResponse.json(result);
}
