import Link from "next/link";
import type { Metadata } from "next";
import { getOrderById } from "@/lib/orders";
import { CheckCircleIcon, SparkleIcon } from "@/components/Icons";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false },
};

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const order = searchParams.orderId ? await getOrderById(searchParams.orderId) : null;

  if (!order) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <SparkleIcon className="h-10 w-10 text-lavender-dark" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-ink">
          We couldn&apos;t find that order
        </h1>
        <p className="mt-2 text-ink/60">
          If you just completed a payment and money was deducted, don&apos;t
          worry — email us at{" "}
          <a href={`mailto:${SITE.email}`} className="underline hover:text-pastel">
            {SITE.email}
          </a>{" "}
          and we&apos;ll sort it out right away.
        </p>
        <Link href="/shop" className="btn-primary mt-6">
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <div className="rounded-full bg-lavender-light p-4">
          <CheckCircleIcon className="h-10 w-10 text-pastel" />
        </div>
        <h1 className="mt-5 font-heading text-3xl font-bold text-ink sm:text-4xl">
          Yay, your order is confirmed!
        </h1>
        <p className="mt-2 text-ink/70">
          Thank you, {order.customer_name} — we&apos;re already excited to start
          on your piece. A confirmation email is on its way to {order.email}.
        </p>
        <p className="mt-1 font-heading text-sm font-semibold text-ink/50">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <div className="card mt-10 p-6">
        <h2 className="font-heading text-lg font-semibold text-ink">Order Summary</h2>
        <div className="mt-4 flex flex-col gap-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div>
                <span className="text-ink/80">{item.name} × {item.quantity}</span>
                {item.kind === "custom" && (
                  <p className="text-xs text-ink/50">
                    {item.customization.mode === "build"
                      ? `${item.customization.phoneModel} · ${item.customization.theme}`
                      : "Surprise Me"}
                  </p>
                )}
              </div>
              <span className="font-semibold text-ink">
                ₹{(item.unitPriceInr * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between text-ink/60">
            <span>Subtotal</span>
            <span>₹{order.subtotal.toFixed(2)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-pastel-dark">
              <span>Discount {order.coupon_code ? `(${order.coupon_code === "LAUNCH50" ? "Launch Offer" : order.coupon_code})` : ""}</span>
              <span>-₹{order.discount_amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-ink/60">
            <span>Shipping</span>
            <span>{order.shipping_amount === 0 ? "Free" : `₹${order.shipping_amount.toFixed(2)}`}</span>
          </div>
        </div>
        <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-heading text-lg font-bold text-ink">
          <span>Total</span>
          <span>₹{order.total_amount.toFixed(2)}</span>
        </div>

        <div className="mt-6 border-t border-ink/10 pt-4 text-sm text-ink/70">
          <p className="font-semibold text-ink/80">Shipping to</p>
          <p className="mt-1">
            {order.shipping_address.line1}
            {order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ""}
            <br />
            {order.shipping_address.city}, {order.shipping_address.state}{" "}
            {order.shipping_address.postalCode}
            <br />
            {order.shipping_address.country}
          </p>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link href="/shop" className="btn-primary">
          Keep Browsing
        </Link>
      </div>
    </div>
  );
}
