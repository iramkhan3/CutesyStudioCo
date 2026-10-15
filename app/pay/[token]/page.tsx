import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PayForRequest } from "@/components/PayForRequest";
import { categoryName, getCustomRequestByToken } from "@/lib/custom-requests";
import { getStoreSettings } from "@/lib/settings";
import { whatsappLinkFor } from "@/lib/settings-defaults";

export const dynamic = "force-dynamic";

// Private per-customer link — keep it out of search engines.
export const metadata: Metadata = {
  title: "Your Custom Request",
  robots: { index: false, follow: false },
};

export default async function PayPage({ params }: { params: { token: string } }) {
  const request = await getCustomRequestByToken(params.token);
  if (!request) notFound();

  const shortId = request.id.slice(0, 8);
  const name = await categoryName(request.category);
  const { whatsappNumber } = await getStoreSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="pill-tag mx-auto">Custom request #{shortId}</span>
        <h1 className="mt-4 font-heading text-3xl font-bold text-ink sm:text-4xl">
          Your custom {name}
          {request.quantity > 1 ? ` × ${request.quantity}` : ""}
        </h1>
      </div>

      <section className="card mt-8 p-6">
        <h2 className="font-heading text-lg font-bold text-ink">Your request</h2>
        {request.device_model && (
          <p className="mt-2 text-sm text-ink/70">
            <strong className="text-ink">Model / size:</strong> {request.device_model}
          </p>
        )}
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink/70">{request.notes}</p>
        {request.status === "approved" && request.estimated_days != null && (
          <p className="mt-4 rounded-xl2 bg-lavender-light/60 p-3 text-sm text-ink/80">
            ⏳ <strong>Ready to ship about {request.estimated_days} day{request.estimated_days === 1 ? "" : "s"}</strong> after
            your payment is confirmed — every piece is made by hand, just for you.
          </p>
        )}
        {request.admin_message && request.status !== "pending" && (
          <p className="mt-4 rounded-xl2 border-l-4 border-pastel bg-blush-light/40 p-3 text-sm text-ink/80">
            <em>A note from us:</em> {request.admin_message}
          </p>
        )}
      </section>

      <div className="mt-6">
        {request.status === "pending" && (
          <p className="card p-6 text-center text-ink/70">
            We&apos;re still reviewing your request — you&apos;ll get an email with the price and payment link
            within 1-2 days. 🎀
          </p>
        )}
        {request.status === "rejected" && (
          <div className="card p-6 text-center text-ink/70">
            <p>We&apos;re sorry — we aren&apos;t able to make this request. Thank you for thinking of us. 💕</p>
            <Link href="/shop" className="btn-secondary mt-4">
              Browse ready-made designs
            </Link>
          </div>
        )}
        {request.status === "paid" && (
          <div className="card p-6 text-center">
            <p className="text-3xl">🎉</p>
            <p className="mt-2 font-heading text-xl font-bold text-ink">Paid — thank you!</p>
            <p className="mt-2 text-ink/70">We&apos;ve started on your piece and will email you when it ships.</p>
            {request.order_id && (
              <Link href={`/order-confirmation?orderId=${request.order_id}`} className="btn-secondary mt-4">
                View your order
              </Link>
            )}
          </div>
        )}
        {request.status === "approved" && request.quoted_price_inr != null && (
          <PayForRequest
            token={request.token}
            customerName={request.customer_name}
            email={request.email}
            phone={request.phone}
            defaultCountry={request.country}
            priceInr={request.quoted_price_inr}
            priceUsd={request.quoted_price_usd}
          />
        )}
      </div>

      <p className="mt-6 text-center text-sm text-ink/60">
        Questions about your request?{" "}
        <a
          href={whatsappLinkFor(whatsappNumber, `Hi! About my custom request #${shortId}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-pastel hover:underline"
        >
          Message us on WhatsApp
        </a>
      </p>
    </div>
  );
}
