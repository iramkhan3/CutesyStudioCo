import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export function CategoryFilter({ active }: { active?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/shop"
        className={`rounded-full px-4 py-2 font-heading text-sm font-semibold transition-colors ${
          !active ? "bg-pastel text-white" : "bg-white text-ink/70 hover:bg-blush-light"
        }`}
      >
        All
      </Link>
      {CATEGORIES.map((cat) => (
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
