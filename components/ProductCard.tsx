import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/data/products";
import { CATEGORIES } from "@/lib/constants";
import { discountPercent } from "@/lib/pricing";
import { QuickAddButton } from "@/components/QuickAddButton";

export function ProductCard({ product }: { product: Product }) {
  const category = CATEGORIES.find((c) => c.slug === product.category);
  const percentOff = discountPercent(product.mrp_inr, product.price_inr);

  return (
    <div className="card group flex flex-col overflow-hidden hover:rotate-1">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-blush-light">
          {/* TODO: swap this placeholder SVG for a real product photo via next/image */}
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {category && <span className="pill-tag w-fit">{category.name}</span>}
        <Link href={`/shop/${product.slug}`}>
          <h3 className="mt-2 font-heading text-base font-semibold text-ink hover:text-pastel">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
          {percentOff > 0 && (
            <span className="text-sm text-ink/40 line-through">₹{product.mrp_inr}</span>
          )}
          <span className="font-heading text-lg font-bold text-ink">₹{product.price_inr}</span>
          {percentOff > 0 && (
            <span className="rounded-full bg-pastel-dark/10 px-1.5 py-0.5 text-[11px] font-bold text-pastel-dark">
              {percentOff}% OFF
            </span>
          )}
        </div>

        <div className="mt-auto pt-4">
          <QuickAddButton product={product} />
        </div>
      </div>
    </div>
  );
}
