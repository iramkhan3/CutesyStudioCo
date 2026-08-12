import type { Metadata } from "next";
import { DecorativeScatter } from "@/components/Decorative";
import { StarIcon, InstagramIcon, MailIcon, SparkleIcon } from "@/components/Icons";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Reviews — CutesyStudioCo",
  description:
    "CutesyStudioCo is a brand-new decoden studio — here's where real customer reviews will live as orders come in. Ordered something? We'd love to feature your feedback.",
  alternates: {
    canonical: `${SITE.url}/reviews`,
  },
};

export default function ReviewsPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-pastel-hero px-4 py-20 text-center">
        <DecorativeScatter />
        <div className="relative mx-auto max-w-2xl">
          <span className="pill-tag mx-auto">Reviews</span>
          <h1 className="mt-4 font-heading text-4xl font-bold text-ink sm:text-5xl">
            We&apos;re brand new — you could be our first review
          </h1>
          <p className="mx-auto mt-4 max-w-md text-ink/70">
            We&apos;d rather have zero reviews than made-up ones. CutesyStudioCo
            just went live, so this page is genuinely empty for now — every
            review here will be from a real order, not a stock photo of a
            stranger.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <div className="flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className="h-6 w-6 text-ink/15" />
          ))}
        </div>
        <p className="mt-4 text-ink/60">
          No ratings yet — be the first to order and tell us what you think.
        </p>

        <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-2">
          <a
            href={`mailto:${SITE.email}?subject=My%20CutesyStudioCo%20review`}
            className="card flex flex-col items-center gap-3 p-8 text-center transition-transform hover:-translate-y-0.5"
          >
            <span className="rounded-full bg-blush-light p-4">
              <MailIcon className="h-6 w-6 text-pastel" />
            </span>
            <h2 className="font-heading font-semibold text-ink">Email Your Review</h2>
            <p className="text-sm text-ink/60">
              Already ordered? Send us a few lines (and a photo, if you&apos;d
              like) and we&apos;ll feature it here with your permission.
            </p>
          </a>

          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card flex flex-col items-center gap-3 p-8 text-center transition-transform hover:-translate-y-0.5"
          >
            <span className="rounded-full bg-lavender-light p-4">
              <InstagramIcon className="h-6 w-6 text-pastel" />
            </span>
            <h2 className="font-heading font-semibold text-ink">Tag Us on Instagram</h2>
            <p className="text-sm text-ink/60">
              Post your piece and tag {SITE.instagramHandle} — we regularly
              share (and love seeing) unboxing photos.
            </p>
          </a>
        </div>

        <div className="mx-auto mt-12 max-w-md rounded-xl3 bg-blush-light/60 p-6">
          <SparkleIcon className="mx-auto h-6 w-6 text-gold" />
          <p className="mt-3 text-sm text-ink/60">
            Every review that appears here will be from a verified order —
            we&apos;ll never post a review we didn&apos;t actually receive.
          </p>
        </div>
      </section>
    </div>
  );
}
