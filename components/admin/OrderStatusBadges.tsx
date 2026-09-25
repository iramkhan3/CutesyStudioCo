import type { OrderRecord } from "@/lib/types";

const PAYMENT_STYLES: Record<OrderRecord["payment_status"], string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
};

const FULFILLMENT_STYLES: Record<OrderRecord["fulfillment_status"], string> = {
  unfulfilled: "bg-blush-light text-ink",
  shipped: "bg-babyblue-light text-babyblue-dark",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export default function OrderStatusBadges({ order }: { order: OrderRecord }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge className={PAYMENT_STYLES[order.payment_status]}>{order.payment_status}</Badge>
      {order.payment_status === "paid" && (
        <Badge className={FULFILLMENT_STYLES[order.fulfillment_status]}>{order.fulfillment_status}</Badge>
      )}
      <Badge className="bg-lavender-light text-lavender-dark">{order.payment_provider}</Badge>
    </div>
  );
}
