import type { Metadata } from "next";
import { DecorativeScatter } from "@/components/Decorative";
import { CustomCaseBuilder } from "@/components/CustomCaseBuilder";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Custom Decoden Phone Case — Build Your Own",
  description:
    "Design your own custom decoden phone case in India — pick your phone model, theme, style, weight, and colours — or let us surprise you with a one-of-a-kind dream case.",
  keywords: [
    "custom phone case india",
    "custom decoden phone case",
    "build your own phone case",
    "personalized kawaii phone case",
  ],
  alternates: {
    canonical: `${SITE.url}/custom`,
  },
};

export default function CustomCasePage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-pastel-hero px-4 py-16 text-center sm:py-20">
        <DecorativeScatter />
        <div className="relative mx-auto max-w-2xl">
          <span className="pill-tag mx-auto">Made Just for You</span>
          <h1 className="mt-4 font-heading text-4xl font-bold text-ink sm:text-5xl">
            Build Your Dream Case
          </h1>
          <p className="mx-auto mt-4 max-w-md text-ink/70">
            Pick every detail yourself, or tell me your dream and let me
            surprise you — either way, it&apos;s made by hand just for you.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <CustomCaseBuilder />
      </section>
    </div>
  );
}
