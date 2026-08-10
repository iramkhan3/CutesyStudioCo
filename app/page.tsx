import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { EmailSignup } from "@/components/EmailSignup";
import { DecorativeScatter } from "@/components/Decorative";
import { WaveDivider } from "@/components/WaveDivider";
import { HomeCarousel } from "@/components/HomeCarousel";
import { SITE } from "@/lib/constants";
import { getAllProducts } from "@/lib/products";
import { InstagramIcon, SparkleIcon } from "@/components/Icons";

const CAROUSEL_SLIDES = [
  { src: "/products/real/rainbow-hello-kitty-case.jpg", alt: "Pastel rainbow Hello Kitty decoden phone case" },
  { src: "/products/real/cookies-cream-case.jpg", alt: "Cookies and cream themed decoden phone case" },
  { src: "/products/real/carousel-dreams-case.jpg", alt: "Pastel carousel-themed decoden phone case" },
  { src: "/products/real/lilac-garden-case-1.jpg", alt: "Lilac garden decoden phone case" },
  { src: "/products/real/vanilla-carousel-case-1.jpg", alt: "Vanilla carousel decoden phone case" },
  { src: "/products/real/cinnamoroll-sky-case.jpg", alt: "Cinnamoroll sky blue decoden phone case" },
  { src: "/products/real/rainbow-noir-case.jpg", alt: "Rainbow noir decoden phone case" },
  { src: "/products/real/christmas-sparkle-case.jpg", alt: "Christmas sparkle decoden phone case" },
  { src: "/products/real/charms-in-hand.jpg", alt: "A handful of tiny charms ready to be placed" },
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
          <span className="pill-tag mx-auto">Handmade in small batches</span>
          <h1 className="mt-5 font-heading text-4xl font-bold leading-tight text-ink sm:text-6xl">
            Bringing joy to the world,
            <br /> one cute thing at a time
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ink/70 sm:text-lg">
            {SITE.name} is a one-woman decoden studio — phone cases, jewelry
            boxes, mirrors and more, hand-covered in charms, bows, and swirls
            of cream until they&apos;re just the right amount of extra.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/shop" className="btn-primary">
              <SparkleIcon className="h-4 w-4" /> Shop Now
            </Link>
          </div>
        </div>
        <WaveDivider className="text-cream" />
      </section>

      {/* Real pieces showcase */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <span className="pill-tag mx-auto">Real Pieces, Real Magic</span>
          <h2 className="section-heading mt-4">Not renders. Not stock photos.</h2>
          <p className="mt-3 max-w-xl text-ink/70">
            Every piece below is a real, finished decoden case that left this
            desk — charms, cream swirls, and all.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl3 shadow-softlg sm:aspect-square">
            <Image
              src="/products/real/merry-berry-case-1.jpg"
              alt="Red and white Christmas-themed decoden phone case, handmade"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <HomeCarousel slides={CAROUSEL_SLIDES} />
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <h2 className="section-heading">Fresh from the craft table</h2>
          <p className="mt-3 max-w-xl text-ink/70">
            A few current favorites — every piece is made to order, so exact
            charm placement will vary just a little from photo to photo.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/shop" className="btn-secondary">
            View Full Shop
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
          {/* TODO: replace this placeholder grid with a real Instagram feed embed
              (e.g. SnapWidget, Behold.so, or the Instagram Basic Display API —
              all require an API key/embed code you'll add here). */}
          <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-6">
            {[
              "from-blush to-lavender",
              "from-lavender to-babyblue",
              "from-babyblue to-cream",
              "from-cream to-blush",
              "from-pastel-light to-blush",
              "from-lavender to-pastel-light",
            ].map((gradient, i) => (
              <a
                key={i}
                href={SITE.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`relative aspect-square overflow-hidden rounded-xl2 bg-gradient-to-br ${gradient} shadow-soft transition-transform hover:scale-[1.03]`}
              >
                <div className="flex h-full w-full items-center justify-center">
                  <SparkleIcon className="h-6 w-6 text-white/70" />
                </div>
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
