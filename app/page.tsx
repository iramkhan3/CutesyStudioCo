import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { EmailSignup } from "@/components/EmailSignup";
import { CustomCaseBuilder } from "@/components/CustomCaseBuilder";
import { DecorativeScatter } from "@/components/Decorative";
import { WaveDivider } from "@/components/WaveDivider";
import { HomeCarousel } from "@/components/HomeCarousel";
import { SITE } from "@/lib/constants";
import { getHomepageContent, getStoreSettings } from "@/lib/settings";
import { whatsappLinkFor } from "@/lib/settings-defaults";
import { getApprovedReviews } from "@/lib/reviews";
import { getAllProducts } from "@/lib/products";
import { getCustomProductTypes } from "@/lib/custom-types";
import { getCoupons } from "@/lib/coupons-data";
import { getInstagramPosts } from "@/lib/instagram";
import { ChevronRightIcon, InstagramIcon, MailIcon, SparkleIcon, StarIcon, WandIcon } from "@/components/Icons";

const INSTAGRAM_TEASER_IMAGE = "/marketing/one-of-a-kind-real-hands.jpg";

// Revalidate periodically so Supabase-backed product/stock changes show up
// without a full redeploy, while still being served from cache most of the time.
export const revalidate = 300;

export default async function HomePage() {
  const [products, customProductTypes, coupons, instagramPosts, content, settings, reviews] = await Promise.all([
    getAllProducts(),
    getCustomProductTypes(),
    getCoupons(),
    getInstagramPosts(),
    getHomepageContent(),
    getStoreSettings(),
    getApprovedReviews(),
  ]);
  // Homepage text, photos, and contact details are editable in Admin →
  // Homepage / Settings (lib/settings.ts); these are the live values.
  const whatsappLink = (message: string) => whatsappLinkFor(settings.whatsappNumber, message);
  const averageRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  // Manual admin display order (see /admin/products/reorder) — the top 9 is
  // the homepage's main highlight, per site design.
  const highlight = products.slice(0, 9);
  const autoApplyCoupon = coupons.find((c) => c.autoApply);
  const withPercent = (text: string) => text.split("{percent}").join(String(autoApplyCoupon?.percentOff ?? ""));

  return (
    <>
      {/* Hero */}
      <section id="home" className="relative overflow-hidden bg-pastel-hero px-4 py-20 sm:py-28">
        <DecorativeScatter />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="pill-tag mx-auto">{content.heroTag}</span>
          <h1 className="mt-5 whitespace-pre-line font-heading text-4xl font-bold leading-tight text-ink sm:text-6xl">
            {content.heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-xl whitespace-pre-line text-base text-ink/70 sm:text-lg">{content.heroText}</p>
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
          <span className="pill-tag mx-auto">{content.shopTag}</span>
          <h2 className="section-heading mt-4">{content.shopTitle}</h2>
          <p className="mt-3 max-w-xl whitespace-pre-line text-ink/70">{content.shopText}</p>
          {products.length > highlight.length && (
            <Link href="/shop" className="btn-primary mt-6">
              <SparkleIcon className="h-4 w-4" /> View All {products.length} Existing Designs →
            </Link>
          )}
        </div>
        {highlight.length > 0 ? (
          <>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-3">
              {highlight.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Link
              href="/shop"
              className="group mt-12 flex flex-col items-center gap-4 rounded-xl3 bg-gradient-to-r from-pastel-dark to-pastel px-6 py-8 text-center text-white shadow-glow transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.01] sm:flex-row sm:justify-between sm:px-10 sm:text-left"
            >
              <span>
                <span className="block font-heading text-2xl font-bold sm:text-3xl">
                  {products.length > highlight.length
                    ? `+${products.length - highlight.length} more designs waiting for you`
                    : "See every design in one place"}
                </span>
                <span className="mt-1 block text-white/85">
                  Browse the full collection — filter by category and find your favorite.
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 font-heading text-base font-bold text-pastel-dark shadow-soft transition-transform group-hover:scale-105">
                View All Existing Designs
                <ChevronRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
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
          <h2 className="section-heading mt-4">{content.customizeTitle}</h2>
          <p className="mt-3 max-w-xl whitespace-pre-line text-ink/70">{content.customizeText}</p>
        </div>
        <div className="mt-10">
          <CustomCaseBuilder customProductTypes={customProductTypes} />
        </div>
        <Link
          href="/custom-request"
          className="card mx-auto mt-10 flex max-w-2xl flex-col items-center gap-4 p-6 text-center transition-transform hover:-translate-y-0.5 sm:flex-row sm:text-left"
        >
          <span className="rounded-full bg-lavender-light p-4 text-2xl leading-none">💌</span>
          <span className="flex-1">
            <span className="block font-heading text-lg font-semibold text-ink">
              Want something else made just for you?
            </span>
            <span className="block text-sm text-ink/60">
              Plushies, bag charms, bottles, gift hampers, bulk gifts — request a custom piece in any category. We
              review it and send you a price before you pay.
            </span>
          </span>
          <span className="btn-secondary shrink-0">Request a custom piece →</span>
        </Link>
      </section>

      {/* Real pieces showcase */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <span className="pill-tag mx-auto">Real Pieces, Real Magic</span>
          <h2 className="section-heading mt-4">{content.carouselTitle}</h2>
          <p className="mt-3 max-w-xl whitespace-pre-line text-ink/70">{content.carouselText}</p>
        </div>
        <div className="mx-auto mt-10 max-w-xl">
          {content.carousel.length > 0 && <HomeCarousel slides={content.carousel} />}
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
                {withPercent(content.launchTitle)}
              </h2>
              <p className="mt-4 whitespace-pre-line text-ink/70">{withPercent(content.launchText)}</p>
              <p className="mt-2 text-sm text-ink/60">
                🇮🇳 For orders paid in ₹ (within India). International orders paying via
                PayPal aren&apos;t included in this offer.
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
          <h2 className="section-heading mt-4">{content.aboutTitle}</h2>
        </div>
        <div className="mx-auto mt-10 max-w-3xl space-y-6 text-ink/80">
          {content.aboutParagraphs.map((paragraph, i) => (
            <p key={i} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 items-center gap-10 rounded-xl3 bg-lavender-light p-6 sm:p-10 md:grid-cols-[280px_1fr]">
          <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-xl3 shadow-softlg">
            <Image
              src={content.makerImage}
              alt={content.makerTitle}
              fill
              sizes="280px"
              className="object-cover"
            />
          </div>
          <div>
            <span className="pill-tag">Meet the Maker</span>
            <h3 className="mt-4 font-heading text-2xl font-semibold text-ink sm:text-3xl">{content.makerTitle}</h3>
            <p className="mt-4 whitespace-pre-line text-ink/70">{content.makerText}</p>
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 font-heading text-sm font-semibold text-pastel hover:text-pastel-dark"
            >
              <InstagramIcon className="h-4 w-4" /> Follow the process {settings.instagramHandle}
            </a>
          </div>
        </div>
        <WaveDivider className="text-cream" />
      </section>

      {/* Reviews — approved customer reviews only (Admin → Reviews) */}
      <section id="reviews" className="scroll-mt-16 bg-lavender-light px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <span className="pill-tag mx-auto">Reviews</span>
          {reviews.length > 0 ? (
            <>
              <h2 className="section-heading mt-4">Loved by our customers</h2>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="flex gap-0.5" aria-label={`${averageRating.toFixed(1)} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className={`h-6 w-6 ${i < Math.round(averageRating) ? "text-amber-400" : "text-ink/15"}`} />
                  ))}
                </div>
                <span className="font-heading font-semibold text-ink">
                  {averageRating.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-10 grid grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
                {reviews.slice(0, 9).map((review) => (
                  <figure key={review.id} className="card flex flex-col p-6">
                    {review.image_url && (
                      <div className="relative mb-4 aspect-square overflow-hidden rounded-xl2 bg-blush-light">
                        <Image src={review.image_url} alt={`Photo from ${review.name}`} fill unoptimized sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover" />
                      </div>
                    )}
                    <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon key={i} className={`h-4 w-4 ${i < review.rating ? "text-amber-400" : "text-ink/15"}`} />
                      ))}
                    </div>
                    <blockquote className="mt-3 flex-1 whitespace-pre-line text-sm text-ink/80">{review.body}</blockquote>
                    <figcaption className="mt-4 font-heading text-sm font-semibold text-ink">
                      {review.name}
                      {review.location && <span className="font-normal text-ink/50"> · {review.location}</span>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="section-heading mt-4">We&apos;re brand new — you could be our first review</h2>
              <p className="mx-auto mt-4 max-w-md text-ink/70">
                We&apos;d rather have zero reviews than made-up ones. Every review here will be from a real order,
                not a stock photo of a stranger.
              </p>
              <div className="mt-6 flex justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="h-6 w-6 text-ink/15" />
                ))}
              </div>
            </>
          )}

          <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-2">
            <Link
              href="/review"
              className="card flex flex-col items-center gap-3 p-8 text-center transition-transform hover:-translate-y-0.5"
            >
              <span className="rounded-full bg-blush-light p-4">
                <StarIcon className="h-6 w-6 text-pastel" />
              </span>
              <h3 className="font-heading font-semibold text-ink">Write a Review</h3>
              <p className="text-sm text-ink/60">Already ordered? Tell us what you think — it takes a minute.</p>
            </Link>

            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex flex-col items-center gap-3 p-8 text-center transition-transform hover:-translate-y-0.5"
            >
              <span className="rounded-full bg-white p-4">
                <InstagramIcon className="h-6 w-6 text-pastel" />
              </span>
              <h3 className="font-heading font-semibold text-ink">Tag Us on Instagram</h3>
              <p className="text-sm text-ink/60">
                Post your piece and tag {settings.instagramHandle} — we regularly share (and love seeing) unboxing
                photos.
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* Instagram teaser */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <h2 className="section-heading">Follow along {settings.instagramHandle}</h2>
            <p className="mt-3 max-w-xl text-ink/70">
              Behind-the-scenes decoden process, new drops, and way too many
              close-up shots of tiny charms. Come say hi!
            </p>
          </div>
          {/* Live feed via Behold.so (lib/instagram.ts) once INSTAGRAM_FEED_URL is
              set; until then, our own promo graphic as a stand-in. */}
          {instagramPosts.length > 0 ? (
            <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
              {instagramPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-square overflow-hidden rounded-xl2 shadow-soft transition-transform hover:scale-[1.03]"
                >
                  <Image
                    src={post.imageUrl}
                    alt={post.caption ? post.caption.slice(0, 120) : `${SITE.name} on Instagram`}
                    fill
                    unoptimized
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover"
                  />
                </a>
              ))}
            </div>
          ) : (
            <a
              href={settings.instagramUrl}
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
          )}
          <div className="mt-8 text-center">
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-heading text-sm font-semibold text-pastel hover:text-pastel-dark"
            >
              <InstagramIcon className="h-4 w-4" /> {settings.instagramHandle}
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

        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          <a
            href={whatsappLink(`Hi ${SITE.name}! I have a question.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="card flex flex-col items-center gap-3 p-8 text-center"
          >
            <span className="rounded-full bg-[#25D366]/15 p-4 font-heading text-lg leading-6 text-[#128C7E]">💬</span>
            <h3 className="font-heading font-semibold text-ink">WhatsApp</h3>
            <p className="text-sm text-ink/60">Fastest reply — great for custom orders</p>
          </a>

          <a href={`mailto:${settings.contactEmail}`} className="card flex flex-col items-center gap-3 p-8 text-center">
            <span className="rounded-full bg-blush-light p-4">
              <MailIcon className="h-6 w-6 text-pastel" />
            </span>
            <h3 className="font-heading font-semibold text-ink">Email Us</h3>
            <p className="break-all text-sm text-ink/60">{settings.contactEmail}</p>
          </a>

          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card flex flex-col items-center gap-3 p-8 text-center"
          >
            <span className="rounded-full bg-lavender-light p-4">
              <InstagramIcon className="h-6 w-6 text-pastel" />
            </span>
            <h3 className="font-heading font-semibold text-ink">Instagram</h3>
            <p className="text-sm text-ink/60">{settings.instagramHandle}</p>
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
