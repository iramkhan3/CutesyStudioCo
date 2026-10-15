import type { Metadata } from "next";
import { CustomRequestForm } from "@/components/CustomRequestForm";
import { BackButton } from "@/components/BackButton";
import { getCustomRequestCategories } from "@/lib/custom-requests";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request a Custom Piece",
  description:
    "Request a custom handmade decoden piece in any category — phone cases, plushies, bag charms, bottles, gift hampers and more. We review every request and send you a price before you pay.",
  alternates: { canonical: `${SITE.url}/custom-request` },
};

export default async function CustomRequestPage({ searchParams }: { searchParams: { category?: string } }) {
  const categories = await getCustomRequestCategories();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <BackButton fallbackHref="/" />
      </div>
      <div className="text-center">
        <span className="pill-tag mx-auto">Made Just For You</span>
        <h1 className="mt-4 font-heading text-4xl font-bold text-ink sm:text-5xl">Request a custom piece</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink/70">
          Dreaming of something that isn&apos;t in the shop? Tell us what you&apos;d like — in any category — and
          we&apos;ll review it personally. If we can make it, we&apos;ll email you a price and a link to pay. No
          payment until you&apos;re happy with the quote.
        </p>
      </div>

      <ol className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        {[
          ["1", "Tell us your idea", "Pick a category and describe it."],
          ["2", "We review & quote", "You get an email within 1-2 days."],
          ["3", "Pay & we create", "Pay securely, then we start making it."],
        ].map(([n, title, text]) => (
          <li key={n} className="rounded-xl2 bg-blush-light/60 p-4 text-center">
            <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-pastel font-heading text-sm font-bold text-white">
              {n}
            </span>
            <span className="mt-2 block font-heading font-semibold text-ink">{title}</span>
            <span className="block text-ink/60">{text}</span>
          </li>
        ))}
      </ol>

      <div className="mt-10">
        {categories.length > 0 ? (
          <CustomRequestForm categories={categories} initialCategory={searchParams.category} />
        ) : (
          <p className="text-center text-ink/60">Custom requests are paused right now — please check back soon!</p>
        )}
      </div>
    </div>
  );
}
