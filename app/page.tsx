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
import { InstagramIcon, SparkleIcon, WandIcon } from "@/components/Icons";

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

const INSTAGRAM_TEASER_IMAGES = [
  "/marketing/behind-the-scenes.jpg",
  "/marketing/christmas-magic-limited.jpg",
  "/marketing/handmade-magic-rainbow.jpg",
  "/marketing/christmas-dream-case.jpg",
  "/marketing/one-of-a-kind-collage.jpg",
  "/marketing/handmade-magic-vibe.jpg",
];

// Revalidate periodically so Supabase-backed product/stock changes show up
// without a full redeploy, while still being served from cache most of the time.
export const revalidate = 300;

export default async function HomePage() {
  const products = await getAllProducts();
  const featured = products.slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-pastel-hero px-4 py-20 sm:py-28">
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
            <Link href="/custom" className="btn-primary">
              <WandIcon className="h-4 w-4" /> Design Your Own
            </Link>
            <Link href="/shop" className="btn-secondary">
              <SparkleIcon className="h-4 w-4" /> Browse Ready to Ship
            </Link>
          </div>
        </div>
        <WaveDivider className="text-cream" />
      </section>

      {/* Custom builder — the main event */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
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
          <CustomCaseBuilder />
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
              Flat 50% off, everything
            </h2>
            <p className="mt-4 text-ink/70">
              To celebrate going live, every single piece — ready-to-ship or
              made to order — is 50% off, automatically, no code needed.
            </p>
            <Link href="/shop" className="btn-primary mt-6 inline-flex">
              <SparkleIcon className="h-4 w-4" /> Shop the Sale
            </Link>
          </div>
        </div>
      </section>

      {/* Ready-to-ship — secondary, no-wait option */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <span className="pill-tag mx-auto">No Wait Required</span>
          <h2 className="section-heading mt-4">Or Pick One Ready to Ship</h2>
          <p className="mt-3 max-w-xl text-ink/70">
            Don&apos;t want to wait for a custom order? These pieces are
            already finished and ship in 1-2 days — first come, first served.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/shop" className="btn-secondary">
            View All Ready-to-Ship Pieces
          </Link>
        </div>
      </section>

      {/* About teaser */}
      <section className="relative overflow-hidden bg-lavender-light px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div className="relative aspect-square w-full max-w-sm justify-self-center overflow-hidden rounded-xl3 shadow-softlg md:justify-self-start">
            <Image
              src="/products/real/rose-garden-sanrio-case.jpg"
              alt="Pink and lavender Sanrio-themed decoden phone case, handmade"
              fill
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
          <div>
            <span className="pill-tag">Our Story</span>
            <h2 className="mt-4 font-heading text-3xl font-semibold text-ink sm:text-4xl">
              Made by hand, made with heart
            </h2>
            <p className="mt-4 text-ink/70">
              What started as a hobby covering phone cases in luxurious cream
              and cute charms has grown into a full decoden studio. Every
              single piece that leaves this table is placed, glued, and
              sealed by hand — no factories, no shortcuts, just a lot of
              hardwork and a lot of love.
            </p>
            <Link href="/about" className="btn-secondary mt-6 inline-flex">
              Meet the Maker
            </Link>
          </div>
        </div>
        <WaveDivider className="text-cream" />
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
              these are our own promo graphics as a stand-in for now. */}
          <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-6">
            {INSTAGRAM_TEASER_IMAGES.map((src, i) => (
              <a
                key={src}
                href={SITE.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square overflow-hidden rounded-xl2 shadow-soft transition-transform hover:scale-[1.03]"
              >
                <Image
                  src={src}
                  alt="CutesyStudioCo Instagram post preview"
                  fill
                  sizes="(min-width: 768px) 16vw, 33vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </a>
            ))}
          </div>
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
