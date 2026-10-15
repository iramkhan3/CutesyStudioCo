import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { getAllProducts, getProductsByCategory } from "@/lib/products";
import { SITE } from "@/lib/constants";
import { getEnabledCategories } from "@/lib/settings";
import { getCustomRequestCategories } from "@/lib/custom-requests";
import { CustomRequestForm } from "@/components/CustomRequestForm";
import { MADE_TO_ORDER_SLUG } from "@/components/CategoryFilter";
import { WandIcon } from "@/components/Icons";
import { BackButton } from "@/components/BackButton";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Shop Decoden Phone Cases & Kawaii Accessories",
  description:
    "Shop handmade decoden phone cases, tablet cases, jewelry boxes, mirrors, keychains, bag charms, plushies, water bottles, custom posters and postcards online in India — every piece covered in cute charms and satisfying swirls of decoden cream.",
  keywords: [
    "decoden phone case india",
    "kawaii phone case shop",
    "cute phone case online india",
    "handmade phone case india",
  ],
  alternates: {
    canonical: `${SITE.url}/shop`,
  },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const [allProducts, categories, requestCategories] = await Promise.all([
    getAllProducts(),
    getEnabledCategories(),
    getCustomRequestCategories(),
  ]);
  // A disabled or unknown category's URL shows everything.
  const activeCategory = categories.find((c) => c.slug === searchParams.category);
  const categorySlug = activeCategory?.slug;
  const products = await getProductsByCategory(categorySlug);
  // "phone-cases" also lists ready-to-ship pieces (see getProductsByCategory).
  const available = new Set(allProducts.map((p) => (p.category === "ready-to-ship" ? "phone-cases" : p.category)));

  // Categories with no products yet are never a dead end: they're grouped
  // under a "Made to Order" tab, and opening one shows the custom request
  // form for it, so every visitor can still ask for what they came for.
  const madeToOrder = requestCategories.filter((c) => !available.has(c.slug));
  const showMadeToOrder = searchParams.category === MADE_TO_ORDER_SLUG && madeToOrder.length > 0;
  const requestInline = !!activeCategory && products.length === 0 && requestCategories.some((c) => c.slug === activeCategory.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-6">
        <BackButton fallbackHref="/" />
      </div>
      <div className="text-center">
        <span className="pill-tag mx-auto">
          {showMadeToOrder || requestInline ? "✨ Made to Order" : "The Full Collection"}
        </span>
        <h1 className="mt-4 font-heading text-4xl font-bold text-ink sm:text-5xl">
          {showMadeToOrder ? "Made just for you" : <>Shop {activeCategory ? activeCategory.name : "Everything"}</>}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink/70">
          {showMadeToOrder
            ? "Pick what you'd like, tell us your idea, and we'll reply with a price and how long it'll take. Nothing is charged until you approve the quote."
            : activeCategory
              ? activeCategory.description
              : "Every category we make, all in one place — each piece made to order, one cute thing at a time."}
        </p>
      </div>

      {!showMadeToOrder && !requestInline && (
      <Link
        href={`/custom-request${categorySlug ? `?category=${categorySlug}` : ""}`}
        className="card mx-auto mt-10 flex max-w-xl items-center gap-4 p-5 text-left transition-transform hover:-translate-y-0.5"
      >
        <span className="rounded-full bg-blush-light p-3">
          <WandIcon className="h-6 w-6 text-pastel" />
        </span>
        <span>
          <span className="block font-heading font-semibold text-ink">
            Don&apos;t see exactly what you want?
          </span>
          <span className="block text-sm text-ink/60">
            {activeCategory
              ? `Request a custom ${activeCategory.name.toLowerCase()} made just for you →`
              : "Request a custom piece in any category — we'll send you a price before you pay →"}
          </span>
        </span>
      </Link>
      )}

      <div className="mt-8 flex justify-center">
        <CategoryFilter
          categories={categories}
          active={showMadeToOrder ? MADE_TO_ORDER_SLUG : categorySlug}
          available={available}
          madeToOrderCount={madeToOrder.length}
        />
      </div>

      {showMadeToOrder ? (
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {madeToOrder.map((c) => {
            const full = categories.find((x) => x.slug === c.slug);
            return (
              <Link
                key={c.slug}
                href={`/shop?category=${c.slug}`}
                className="card group flex flex-col p-6 transition-transform hover:-translate-y-1"
              >
                <span className="font-heading text-lg font-bold text-ink group-hover:text-pastel">{c.name}</span>
                {full?.tagline && <span className="mt-1 text-sm text-ink/60">{full.tagline}</span>}
                <span className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-semibold text-pastel-dark">
                    {c.fromInr != null ? `From ₹${c.fromInr.toLocaleString("en-IN")}` : "Price on request"}
                  </span>
                  <span className="font-heading font-semibold text-ink">Request yours →</span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : requestInline ? (
        <div className="mt-12">
          <p className="mx-auto mb-6 max-w-2xl rounded-xl2 bg-blush-light/60 px-5 py-4 text-center text-sm text-ink/80">
            We make <strong>{activeCategory!.name.toLowerCase()}</strong> to order — no two alike. Tell us your idea
            below and we&apos;ll email you a price and how long it&apos;ll take. Nothing is charged until you approve it.
          </p>
          <CustomRequestForm categories={requestCategories} initialCategory={activeCategory!.slug} />
        </div>
      ) : products.length > 0 ? (
        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center text-ink/60">
          <p>Nothing here just yet — but we can make it for you!</p>
          <Link href={`/custom-request${categorySlug ? `?category=${categorySlug}` : ""}`} className="btn-primary mt-4">
            Request a custom piece
          </Link>
        </div>
      )}

      {!showMadeToOrder && !requestInline && madeToOrder.length > 0 && (
        <section className="mt-20 rounded-xl3 bg-lavender-light px-6 py-10 text-center">
          <span className="pill-tag mx-auto">✨ Made to Order</span>
          <h2 className="mt-4 font-heading text-2xl font-bold text-ink sm:text-3xl">We also make these, just for you</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink/70">
            Not in stock yet — tell us your idea and we&apos;ll send a price and timeline before you pay anything.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {madeToOrder.map((c) => (
              <Link
                key={c.slug}
                href={`/shop?category=${c.slug}`}
                className="rounded-full bg-white px-4 py-2 font-heading text-sm font-semibold text-ink shadow-soft transition-colors hover:bg-pastel hover:text-white"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
