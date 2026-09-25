import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { EmailSignup } from "@/components/EmailSignup";
import { CustomCaseBuilder } from "@/components/CustomCaseBuilder";
import { DecorativeScatter } from "@/components/Decorative";
import { WaveDivider } from "@/components/WaveDivider";
import { HomeCarousel } from "@/components/HomeCarousel";
import { SITE } from "@/lib/constants";
import { getAllProducts } from "@/lib/products";
import { getCustomProductTypes } from "@/lib/custom-types";
import { getCoupons } from "@/lib/coupons-data";
import { InstagramIcon, MailIcon, SparkleIcon, StarIcon, WandIcon } from "@/components/Icons";

const CAROUSEL_SLIDES = [
  { src: "/products/real/rainbow-hello-kitty-case.jpg", alt: "Pastel rainbow Hello Kitty decoden phone case" },
  { src: "/products/real/cookies-cream-case.jpg", alt: "Cookies and cream themed decoden phone case" },
  { src: "/products/real/carousel-dreams-case.jpg", alt: "Pastel carousel-themed decoden phone case" },
  { src: "/products/real/lilac-garden-case-1.jpg", alt: "Lilac garden decoden phone case" },
  { src: "/products/real/vanilla-carousel-case-1.jpg", alt: "Vanilla carousel decoden phone case" },
  { src: "/products/real/cinnamoroll-sky-case.jpg", alt: "Cinnamoroll sky blue decoden phone case" },
  { src: "/products/real/rainbow-noir-case.jpg", alt: "Rainbow noir decoden phone case" },
  { src: "/products/real/christmas-sparkle-case.jpg", alt: "Christmas sparkle decoden phone case" },
  { src: "/marketing/pastel-cases-pair.jpg", alt: "A pair of pastel decoden phone cases side by side" },
  { src: "/marketing/three-cases-lineup.jpg", alt: "Three finished decoden phone cases lined up" },
  { src: "/products/real/charms-in-hand.jpg", alt: "A handful of tiny charms ready to be placed" },
  { src: "/marketing/festive-pouches-duo.jpg", alt: "A Christmas pouch and a Hello Kitty pouch, handmade" },
];

const INSTAGRAM_TEASER_IMAGE = "/marketing/one-of-a-kind-real-hands.jpg";

// Revalidate periodically so Supabase-backed product/stock changes show up
// without a full redeploy, while still being served from cache most of the time.
export const revalidate = 300;

export default async function HomePage() {
  const [products, customProductTypes, coupons] = await Promise.all([
    getAllProducts(),
    getCustomProductTypes(),
    getCoupons(),
  ]);
  // Manual admin display order (see /admin/products/reorder) — the top 9 is
  // the homepage's main highlight, per site design.
  const highlight = products.slice(0, 9);
  const autoApplyCoupon = coupons.find((c) => c.autoApply);

  return (
    <>
      {/* Hero */}
      <section id="home" className="relative overflow-hidden bg-pastel-hero px-4 py-20 sm:py-28">
        <DecorativeScatter />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="pill-tag mx-auto">Made just for you</span>
          <h1 className="mt-5 font-heading text-4xl font-bold leading-tight text-ink sm:text-6xl">
            Design your dream piece,
            <br /> made by hand
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ink/70 sm:text-lg">
            {SITE.name} is a one-woman decoden studio. Pick your phone case,
            hairbrush, mirror, or keychain, tell us your vibe, and we&apos;ll
            hand-cover it in cute charms and swirls of satisfying decoden
            cream — one of one, just for you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#customize" className="btn-primary">
              <WandIcon className="h-4 w-4" /> Design Your Own
            </a>
            <a href="#shop" className="btn-secondary">
              <SparkleIcon className="h-4 w-4" /> Browse Existing Designs
            </a>
          </div>
        </div>
        <WaveDivider className="text-cream" />
      </section>

      {/* Shop highlight — the site's main showcase, in admin-controlled order */}
      <section id="shop" className="mx-auto max-w-7xl scroll-mt-16 px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <span className="pill-tag mx-auto">Existing Designs</span>
          <h2 className="section-heading mt-4">Our Favorite Pieces Right Now</h2>
          <p className="mt-3 max-w-xl text-ink/70">
            Already finished and sitting in the studio — buy this exact piece
            and it ships in 1-2 days. Love the design but need a different
            phone? Every design here can be custom-made for your exact model.
          </p>
        </div>
        {highlight.length > 0 ? (
          <>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-3">
              {highlight.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/shop" className="btn-secondary">
                View All Existing Designs
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-10 text-center text-ink/60">
            New pieces are on their way — check back soon, or{" "}
            <a href="#customize" className="font-semibold text-pastel hover:underline">
              design your own
            </a>{" "}
            in the meantime.
          </p>
        )}
      </section>

      {/* Custom builder */}
      <section id="customize" className="mx-auto max-w-7xl scroll-mt-16 px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <span className="pill-tag mx-auto">Start Here</span>
          <h2 className="section-heading mt-4">Build Your Dream Piece</h2>
          <p className="mt-3 max-w-xl text-ink/70">
            Phone case, hairbrush, hand mirror, table mirror, or keychain —
            pick a type, choose every detail yourself, or let us surprise you
            with something one-of-a-kind.
          </p>
        </div>
        <div className="mt-10">
          <CustomCaseBuilder customProductTypes={customProductTypes} />
        </div>
      </section>

      {/* Real pieces showcase */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <span className="pill-tag mx-auto">Real Pieces, Real Magic</span>
          <h2 className="section-heading mt-4">No renders. No stock photos. Just the real thing.</h2>
          <p className="mt-3 max-w-xl text-ink/70">
            A look at what leaves our desk — hand-placed charms, piped
            cream, and every little detail intact. This is the kind of care
            that goes into every custom order too.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-xl">
          <HomeCarousel slides={CAROUSEL_SLIDES} />
        </div>
      </section>

      {/* Marketing banner */}
      {autoApplyCoupon && (
        <section className="bg-lavender-light px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-xl3 shadow-softlg">
              <Image
                src="/marketing/handmade-magic-rainbow.jpg"
                alt="Handmade decoden phone case promotional graphic"
                fill
                sizes="(min-width: 768px) 33vw, 80vw"
                className="object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <span className="pill-tag">Launch Offer</span>
              <h2 className="mt-4 font-heading text-3xl font-semibold text-ink sm:text-4xl">
                Flat {autoApplyCoupon.percentOff}% off, everything
              </h2>
              <p className="mt-4 text-ink/70">
                To celebrate going live, every single piece — ready-to-ship or
                made to order — is {autoApplyCoupon.percentOff}% off, automatically, no code needed.
              </p>
              <a href="#shop" className="btn-primary mt-6 inline-flex">
                <SparkleIcon className="h-4 w-4" /> Shop the Sale
              </a>
            </div>
          </div>
        </section>
      )}

      {/* About */}
      <section id="about" className="relative scroll-mt-16 overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="pill-tag mx-auto">Our Story</span>
          <h2 className="section-heading mt-4">A little studio, a whole lot of cute</h2>
        </div>
        <div className="mx-auto mt-10 max-w-3xl space-y-6 text-ink/80">
          <p>
            CutesyStudioCo started the way a lot of good things do — with a
            dream and a life that felt a little too plain. What began as
            decorating my own case with a couple of cute charms and creamy
            decoden turned into a passion to transform the world with a dash
            of joy. Every object that you see daily can make you happy —
            everything from phone cases and covers, jewelry boxes, mirrors,
            hairbrushes, tablet stands to trinket boxes.
          </p>
          <p>
            If you&apos;re new to the term: <strong className="text-ink">decoden</strong> is
            a Japanese decorating style built around rhinestones, cute
            charms, and swirls of faux cream, layered on until an everyday
            object looks like it belongs in a dessert shop. It&apos;s fussy, it&apos;s
            slow, and it is genuinely my favorite way to spend my leisure time.
          </p>
          <p>
            It is made from 100% silicone and is completely safe and
            enhances strength of the objects. All charms are firmly attached
            to the silicone and don&apos;t fall off!
          </p>
          <p>
            Every single piece that leaves this studio is made by hand, one
            at a time — no molds, no mass production, no two pieces exactly
            alike. I place each charm myself, seal it by hand, and pack it
            up with as much care as I put into making it.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 items-center gap-10 rounded-xl3 bg-lavender-light p-6 sm:p-10 md:grid-cols-[280px_1fr]">
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
            <h3 className="mt-4 font-heading text-2xl font-semibold text-ink sm:text-3xl">
              Hi, I&apos;m Iram 👋
            </h3>
            <p className="mt-4 text-ink/70">
              I&apos;m the one-person team behind every piece here — designer,
              charm-placer, packer, and the person who answers your emails.
              I&apos;m based in India, obsessed with all things kawaii and
              pastel, and I built CutesyStudioCo around one simple goal:
              bringing joy to the world, one cute thing at a time.
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
        <WaveDivider className="text-cream" />
      </section>

      {/* Reviews */}
      <section id="reviews" className="scroll-mt-16 bg-lavender-light px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="pill-tag mx-auto">Reviews</span>
          <h2 className="section-heading mt-4">We&apos;re brand new — you could be our first review</h2>
          <p className="mx-auto mt-4 max-w-md text-ink/70">
            We&apos;d rather have zero reviews than made-up ones. This section is
            genuinely empty for now — every review here will be from a real
            order, not a stock photo of a stranger.
          </p>
          <div className="mt-6 flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon key={i} className="h-6 w-6 text-ink/15" />
            ))}
          </div>
          <p className="mt-3 text-sm text-ink/60">
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
              <h3 className="font-heading font-semibold text-ink">Email Your Review</h3>
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
              <span className="rounded-full bg-white p-4">
                <InstagramIcon className="h-6 w-6 text-pastel" />
              </span>
              <h3 className="font-heading font-semibold text-ink">Tag Us on Instagram</h3>
              <p className="text-sm text-ink/60">
                Post your piece and tag {SITE.instagramHandle} — we regularly
                share (and love seeing) unboxing photos.
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* Instagram teaser */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <h2 className="section-heading">Follow along {SITE.instagramHandle}</h2>
            <p className="mt-3 max-w-xl text-ink/70">
              Behind-the-scenes decoden process, new drops, and way too many
              close-up shots of tiny charms. Come say hi!
            </p>
          </div>
          {/* TODO: swap for a real Instagram feed embed (e.g. SnapWidget, Behold.so,
              or the Instagram Basic Display API) once you have an embed key —
              this is our own promo graphic as a stand-in for now. */}
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative mx-auto mt-10 block aspect-[2/3] w-full max-w-xs overflow-hidden rounded-xl3 shadow-soft transition-transform hover:scale-[1.02]"
          >
            <Image
              src={INSTAGRAM_TEASER_IMAGE}
              alt="CutesyStudioCo Instagram post preview"
              fill
              sizes="(min-width: 640px) 320px, 80vw"
              className="object-cover"
              priority
            />
          </a>
          <div className="mt-8 text-center">
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-heading text-sm font-semibold text-pastel hover:text-pastel-dark"
            >
              <InstagramIcon className="h-4 w-4" /> {SITE.instagramHandle}
            </a>
          </div>
        </div>
        <WaveDivider className="text-pastel" />
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-16 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="pill-tag mx-auto">Say Hello</span>
          <h2 className="section-heading mt-4">We&apos;d love to hear from you</h2>
          <p className="mx-auto mt-4 max-w-md text-ink/70">
            Questions about an order, a custom piece idea, or just want to
            say hi? Reach out any of these ways — a real person (hi, it&apos;s
            me) reads every message.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
          <a href={`mailto:${SITE.email}`} className="card flex flex-col items-center gap-3 p-8 text-center">
            <span className="rounded-full bg-blush-light p-4">
              <MailIcon className="h-6 w-6 text-pastel" />
            </span>
            <h3 className="font-heading font-semibold text-ink">Email Us</h3>
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
            <h3 className="font-heading font-semibold text-ink">Instagram</h3>
            <p className="text-sm text-ink/60">{SITE.instagramHandle}</p>
          </a>
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center text-sm text-ink/60">
          We typically reply within 1-2 business days. For order-specific
          questions, please include your order number if you have one.
        </p>
      </section>

      {/* Email signup */}
      <section className="bg-pastel px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-heading text-2xl font-semibold text-white sm:text-3xl">
            Get first dibs on new drops
          </h2>
          <p className="mt-3 text-white/85">
            New pieces sell out fast — join the list for early access, sneak
            peeks, and the occasional discount code.
          </p>
          <div className="mt-6">
            <EmailSignup />
          </div>
        </div>
      </section>
    </>
  );
}
