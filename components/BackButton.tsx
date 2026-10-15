"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/Icons";

// Set once the visitor has navigated client-side within the site at least
// once. document.referrer alone can't tell us that — it only reflects the
// original full page load, not Next's client-side route changes.
let hasNavigatedInApp = false;

/** Mounted once in the root layout; flips hasNavigatedInApp on the first route change. */
export function NavigationTracker() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    hasNavigatedInApp = true;
  }, [pathname]);
  return null;
}

/**
 * Storefront back button. Goes to the previous page when the visitor got
 * here from elsewhere on this site (so e.g. the product page returns to the
 * exact filtered shop view / homepage scroll they came from); otherwise —
 * landed from Google, Instagram, a shared link — goes to `fallbackHref`
 * instead of bouncing them off the site.
 */
export function BackButton({ fallbackHref, label = "Back" }: { fallbackHref: string; label?: string }) {
  const router = useRouter();

  function handleClick() {
    const cameFromThisSite = hasNavigatedInApp || document.referrer.startsWith(window.location.origin);
    if (cameFromThisSite && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 font-heading text-sm font-semibold text-ink/70 shadow-soft transition-colors hover:bg-blush-light hover:text-pastel"
    >
      <ChevronLeftIcon className="h-4 w-4" /> {label}
    </button>
  );
}
