"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/constants";

export type AdminCategoryOption = { slug: string; name: string; enabled: boolean };

// Built-in categories as a starting value, so selects never render empty
// while the live list (incl. admin-created categories) loads.
const FALLBACK: AdminCategoryOption[] = CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, enabled: true }));

/** Live category list (names as edited in Admin → Categories) for admin forms and filters. */
export function useAdminCategories(): AdminCategoryOption[] {
  const [categories, setCategories] = useState<AdminCategoryOption[]>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.categories) {
          setCategories(
            (data.categories as AdminCategoryOption[]).map((c) => ({ slug: c.slug, name: c.name, enabled: c.enabled }))
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return categories;
}

export function categoryLabel(categories: AdminCategoryOption[], slug: string): string {
  return categories.find((c) => c.slug === slug)?.name ?? slug;
}
