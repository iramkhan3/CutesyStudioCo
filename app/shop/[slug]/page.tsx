import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug } from "@/lib/products";
import { CATEGORIES } from "@/lib/constants";
import { ProductPurchaseActions } from "@/components/ProductPurchaseActions";
import { ProductCard } from "@/components/ProductCard";

export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.images[0] }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const category = CATEGORIES.find((c) => c.slug === product.category);
  const allProducts = await getAllProducts();
  const related = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="mb-8 text-sm text-ink/50">
        <Link href="/shop" className="hover:text-pastel">Shop</Link>
        {category && (
          <>
            {" / "}
            <Link href={`/shop?category=${category.slug}`} className="hover:text-pastel">
              {category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-ink/70">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl3 bg-blush-light shadow-soft">
          {/* TODO: swap this placeholder SVG for real product photography */}
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>

        <div>
          {category && <span className="pill-tag">{category.name}</span>}
          <h1 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl">
            {product.name}
          </h1>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl font-bold text-pastel">
              ${product.price_usd}
            </span>
            <span className="text-sm text-ink/50">≈ ₹{product.price_inr} (charged in INR at checkout)</span>
          </div>
          <p className="mt-5 text-ink/70">{product.description}</p>

          <div className="mt-8">
            <ProductPurchaseActions product={product} />
          </div>

          <div className="mt-8 rounded-xl2 bg-cream-dark/40 p-4 text-sm text-ink/60">
            🎀 Handmade to order — please allow 3-5 business days before your
            piece ships. Every item is one-of-a-kind, so tiny variations in
            charm placement are part of the charm.
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="section-heading text-center">You might also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
