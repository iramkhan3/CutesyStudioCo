import Link from "next/link";
import type { Category } from "@/lib/settings-defaults";

// "ready-to-ship" (Existing Designs) isn't shown as its own filter tab — its
// products are folded into "Phone Cases" (see getProductsByCategory), since
// it's a stock status (pre-made vs. build-to-order), not a distinct category
// a customer would think to browse separately.

/**
 * `available` = slugs that currently have at least one visible product
 * (already excludes admin-disabled categories) — empty categories are left
 * out so customers never land on an empty tab. The active tab always shows.
 */
export function CategoryFilter({
  categories,
  active,
  available,
}: {
  // Enabled categories in display order (getEnabledCategories()).
  categories: Category[];
  active?: string;
  available: Set<string>;
}) {
  const visible = categories.filter((c) => c.slug !== "ready-to-ship" && (available.has(c.slug) || c.slug === active));

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Link
        href="/shop"
        className={`rounded-full px-4 py-2 font-heading text-sm font-semibold transition-colors ${
          !active ? "bg-pastel text-white" : "bg-white text-ink/70 hover:bg-blush-light"
        }`}
      >
        All
      </Link>
      {visible.map((cat) => (
        <Link
          key={cat.slug}
          href={`/shop?category=${cat.slug}`}
          className={`rounded-full px-4 py-2 font-heading text-sm font-semibold transition-colors ${
            active === cat.slug ? "bg-pastel text-white" : "bg-white text-ink/70 hover:bg-blush-light"
          }`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
