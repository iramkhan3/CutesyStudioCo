import type { Metadata } from "next";
import { ReviewForm } from "@/components/ReviewForm";
import { BackButton } from "@/components/BackButton";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Write a Review",
  description: `Tell us about your ${SITE.name} piece — we read every review.`,
  alternates: { canonical: `${SITE.url}/review` },
};

export default function ReviewPage({ searchParams }: { searchParams: { order?: string; name?: string } }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-6">
        <BackButton fallbackHref="/#reviews" />
      </div>
      <div className="text-center">
        <span className="pill-tag mx-auto">Reviews</span>
        <h1 className="mt-4 font-heading text-4xl font-bold text-ink">How did we do?</h1>
        <p className="mx-auto mt-3 max-w-md text-ink/70">
          Every piece is made by hand, so your words genuinely mean the world to us. Reviews appear on our homepage
          once we&apos;ve had a chance to read them.
        </p>
      </div>
      <div className="mt-8">
        <ReviewForm initialOrder={searchParams.order?.slice(0, 40) ?? ""} initialName={searchParams.name?.slice(0, 60) ?? ""} />
      </div>
    </div>
  );
}
