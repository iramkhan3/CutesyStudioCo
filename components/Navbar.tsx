"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LAUNCH_OFFER_ACTIVE, SITE } from "@/lib/constants";
import { useCartStore, cartItemCount } from "@/lib/store/cart";
import { CartIcon, CloseIcon, InstagramIcon, MenuIcon } from "@/components/Icons";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/custom", label: "Custom Case" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);
  const count = cartItemCount(items);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-cream/90 backdrop-blur-md">
      {LAUNCH_OFFER_ACTIVE && (
        <div className="bg-gradient-to-r from-pastel-dark to-pastel px-4 py-2 text-center font-heading text-xs font-semibold text-white sm:text-sm">
          🎉 Launch Offer — Flat 50% Off Everything, No Code Needed!
        </div>
      )}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center" aria-label={SITE.name}>
          <Image
            src="/logo.png"
            alt={SITE.name}
            width={44}
            height={44}
            className="h-11 w-11 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
            priority
          />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-heading text-sm font-medium transition-colors hover:text-pastel ${
                pathname === link.href ? "text-pastel" : "text-ink/80"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CutesyStudioCo on Instagram"
            className="hidden rounded-full p-2 text-ink/70 transition-colors hover:bg-blush-light hover:text-pastel sm:inline-flex"
          >
            <InstagramIcon className="h-5 w-5" />
          </a>

          <Link
            href="/cart"
            aria-label="View cart"
            className="relative inline-flex rounded-full p-2 text-ink/80 transition-colors hover:bg-blush-light hover:text-pastel"
          >
            <CartIcon className="h-6 w-6" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pastel text-[11px] font-bold text-white">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>

          <button
            aria-label="Toggle menu"
            className="inline-flex rounded-full p-2 text-ink/80 hover:bg-blush-light md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-ink/5 bg-cream px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3 py-2 font-heading text-sm font-medium ${
                  pathname === link.href ? "bg-blush-light text-pastel" : "text-ink/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl px-3 py-2 font-heading text-sm font-medium text-ink/80"
            >
              <InstagramIcon className="h-4 w-4" /> Instagram
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
