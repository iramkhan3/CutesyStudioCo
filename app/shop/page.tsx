import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { getProductsByCategory } from "@/lib/products";
import { CATEGORIES, SITE, type CategorySlug } from "@/lib/constants";
import { WandIcon } from "@/components/Icons";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Shop Decoden Phone Cases & Kawaii Accessories",
  description:
    "Shop handmade decoden phone cases, tablet cases, jewelry boxes, mirrors, keychains, and posters online in India — every piece covered in charms, bows, and swirls of cream.",
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
  const categorySlug = CATEGORIES.find((c) => c.slug === searchParams.category)
    ?.slug as CategorySlug | undefined;
  const products = await getProductsByCategory(categorySlug);
  const activeCategory = CATEGORIES.find((c) => c.slug === categorySlug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="pill-tag mx-auto">The Full Collection</span>
        <h1 className="mt-4 font-heading text-4xl font-bold text-ink sm:text-5xl">
          Shop {activeCategory ? activeCategory.name : "Everything"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink/70">
          {activeCategory
            ? activeCategory.description
            : "Every category we make, all in one place — each piece made to order, one cute thing at a time."}
        </p>
      </div>

      <Link
        href="/custom"
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
            Build a custom phone case, hairbrush, mirror, or keychain, or let me surprise you →
          </span>
        </span>
      </Link>

      <div className="mt-8 flex justify-center">
        <CategoryFilter active={categorySlug} />
      </div>

      {products.length > 0 ? (
        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-ink/60">
          Nothing here just yet — check back soon, or explore another category!
        </p>
      )}
    </div>
  );
}
