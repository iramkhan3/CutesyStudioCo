import Link from "next/link";
import { DecorativeScatter } from "@/components/Decorative";
import { HeartIcon } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="relative overflow-hidden bg-pastel-hero px-4 py-24 text-center">
      <DecorativeScatter />
      <div className="relative mx-auto max-w-md">
        <HeartIcon className="mx-auto h-12 w-12 animate-float text-pastel" />
        <h1 className="mt-5 font-heading text-3xl font-bold text-ink sm:text-4xl">
          This page wandered off
        </h1>
        <p className="mt-3 text-ink/70">
          Even our most charm-covered maps couldn&apos;t find it. Let&apos;s get you
          back to somewhere cute.
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex">
          Back to the Studio
        </Link>
      </div>
    </div>
  );
}
