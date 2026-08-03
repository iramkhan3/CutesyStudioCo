import Link from "next/link";
import { SITE } from "@/lib/constants";
import { InstagramIcon, MailIcon, SparkleIcon } from "@/components/Icons";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/5 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="group flex items-center gap-1.5 font-heading text-lg font-semibold text-ink">
            <SparkleIcon className="h-4 w-4 text-pastel group-hover:animate-wiggle" />
            {SITE.name}
          </div>
          <p className="mt-3 max-w-xs text-sm text-ink/70">
            Handmade decoden pieces, finished with charms, bows, and swirls of
            cream — made to bring a little joy, one at a time.
          </p>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-ink/60">
            Quick Links
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/shop" className="text-ink/70 hover:text-pastel">Shop</Link></li>
            <li><Link href="/about" className="text-ink/70 hover:text-pastel">About</Link></li>
            <li><Link href="/contact" className="text-ink/70 hover:text-pastel">Contact</Link></li>
            <li><Link href="/cart" className="text-ink/70 hover:text-pastel">Cart</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-ink/60">
            Say Hi
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 text-ink/70 hover:text-pastel">
              <MailIcon className="h-4 w-4" /> {SITE.email}
            </a>
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-ink/70 hover:text-pastel"
            >
              <InstagramIcon className="h-4 w-4" /> {SITE.instagramHandle}
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-ink/5 py-6 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} {SITE.name}. All rights reserved. Made with 🩷 by a very small team of one.
      </div>
    </footer>
  );
}
