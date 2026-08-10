import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DecorativeScatter } from "@/components/Decorative";
import { InstagramIcon, SparkleIcon } from "@/components/Icons";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Our Handmade Decoden Studio",
  description:
    "The story behind CutesyStudioCo — a solo handmade decoden studio in India covering phone cases, jewelry boxes, and more in charms, bows, and swirls of cream, on a mission to bring a little joy to the world.",
  alternates: {
    canonical: `${SITE.url}/about`,
  },
};

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-pastel-hero px-4 py-20 text-center">
        <DecorativeScatter />
        <div className="relative mx-auto max-w-2xl">
          <span className="pill-tag mx-auto">Our Story</span>
          <h1 className="mt-4 font-heading text-4xl font-bold text-ink sm:text-5xl">
            A little studio, a whole lot of cute
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="space-y-6 text-ink/80">
          <p>
            CutesyStudioCo started the way a lot of good things do — with too
            much free time, a hot glue gun, and a phone case that felt a
            little too plain. What began as decorating my own case with a
            couple of tiny charms turned into decorating cases for friends,
            then friends of friends, and eventually into a proper decoden
            studio that now covers everything from tablet stands to jewelry
            boxes.
          </p>
          <p>
            If you&apos;re new to the term: <strong className="text-ink">decoden</strong> is
            a Japanese decorating style built around rhinestones, cute
            charms, and swirls of faux cream, layered on until an everyday
            object looks like it belongs in a dessert shop. It&apos;s fussy, it&apos;s
            slow, and it is genuinely my favorite way to spend an afternoon.
          </p>
          <p>
            Every single piece that leaves this studio is made by hand, one
            at a time — no molds, no mass production, no two pieces exactly
            alike. I place each charm myself, seal it by hand, and pack it
            up with as much care as I put into making it. When you order
            from CutesyStudioCo, you&apos;re not just getting an accessory,
            you&apos;re getting a little bit of joy in the mail — which is the
            whole point.
          </p>
        </div>
      </section>

      <section className="bg-lavender-light px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-10 md:grid-cols-[280px_1fr]">
          <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-xl3 shadow-softlg">
            <Image
              src="/products/real/charms-in-hand.jpg"
              alt="A handful of tiny decoden charms, ready to be placed by hand"
              fill
              sizes="280px"
              className="object-cover"
            />
          </div>
          <div>
            <span className="pill-tag">Meet the Maker</span>
            <h2 className="mt-4 font-heading text-2xl font-semibold text-ink sm:text-3xl">
              Hi, I&apos;m Iram 👋
            </h2>
            <p className="mt-4 text-ink/70">
              I&apos;m the one-person team behind every piece here — designer,
              charm-placer, packer, and the person who answers your emails.
              I&apos;m based in India, obsessed with all things kawaii and
              pastel, and I built CutesyStudioCo around one simple goal:
              bringing joy to the world, one cute thing at a time.
            </p>
            <p className="mt-4 text-ink/70">
              Most days I&apos;m just an overwhelmed girl running on chai and
              deadlines like everyone else — but the second I sit down with
              a glue gun and a tray of tiny charms, my brain finally goes
              quiet. This studio is where I come to breathe, one bow and one
              bead at a time. Thank you for being here — it genuinely means
              a lot.
            </p>
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 font-heading text-sm font-semibold text-pastel hover:text-pastel-dark"
            >
              <InstagramIcon className="h-4 w-4" /> Follow the process {SITE.instagramHandle}
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <SparkleIcon className="mx-auto h-8 w-8 text-gold" />
        <h2 className="mt-4 font-heading text-2xl font-semibold text-ink sm:text-3xl">
          Ready to find your new favorite thing?
        </h2>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/shop" className="btn-primary">
            Shop the Collection
          </Link>
          <Link href="/contact" className="btn-secondary">
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  );
}
