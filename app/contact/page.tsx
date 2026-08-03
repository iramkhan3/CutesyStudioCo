import type { Metadata } from "next";
import { DecorativeScatter } from "@/components/Decorative";
import { InstagramIcon, MailIcon, SparkleIcon } from "@/components/Icons";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with CutesyStudioCo — by email or Instagram, we'd love to hear from you.",
};

export default function ContactPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-pastel-hero px-4 py-20 text-center">
        <DecorativeScatter />
        <div className="relative mx-auto max-w-2xl">
          <span className="pill-tag mx-auto">Say Hello</span>
          <h1 className="mt-4 font-heading text-4xl font-bold text-ink sm:text-5xl">
            We&apos;d love to hear from you
          </h1>
          <p className="mx-auto mt-4 max-w-md text-ink/70">
            Questions about an order, a custom piece idea, or just want to
            say hi? Reach out any of these ways — a real person (hi, it&apos;s
            me) reads every message.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-2xl grid-cols-1 gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6">
        <a
          href={`mailto:${SITE.email}`}
          className="card flex flex-col items-center gap-3 p-8 text-center"
        >
          <span className="rounded-full bg-blush-light p-4">
            <MailIcon className="h-6 w-6 text-pastel" />
          </span>
          <h2 className="font-heading font-semibold text-ink">Email Us</h2>
          <p className="break-all text-sm text-ink/60">{SITE.email}</p>
        </a>

        <a
          href={SITE.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="card flex flex-col items-center gap-3 p-8 text-center"
        >
          <span className="rounded-full bg-lavender-light p-4">
            <InstagramIcon className="h-6 w-6 text-pastel" />
          </span>
          <h2 className="font-heading font-semibold text-ink">Instagram</h2>
          <p className="text-sm text-ink/60">{SITE.instagramHandle}</p>
        </a>
      </section>

      <section className="mx-auto max-w-xl px-4 pb-20 text-center sm:px-6">
        <SparkleIcon className="mx-auto h-6 w-6 text-gold" />
        <p className="mt-4 text-sm text-ink/60">
          We typically reply within 1-2 business days. For order-specific
          questions, please include your order number if you have one.
        </p>
      </section>
    </div>
  );
}
