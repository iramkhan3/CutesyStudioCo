"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  const isLoginPage = pathname === "/admin/login";
  if (isLoginPage) return <>{children}</>;

  const navLink = (href: string, label: string) => {
    const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition ${
          active ? "bg-pastel text-white" : "text-ink hover:bg-blush-light"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-cream-light">
      <header className="sticky top-0 z-20 border-b border-blush-light bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-heading text-lg font-bold text-ink">CutesyStudioCo</span>
            <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-pastel-dark hover:underline">
              View site ↗
            </a>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white disabled:opacity-50"
          >
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
          </div>
        </div>
        {/* Grouped: day-to-day → catalog → site content & settings. Wraps on small screens. */}
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 pb-3">
          {navLink("/admin", "Dashboard")}
          {navLink("/admin/orders", "Orders")}
          {navLink("/admin/requests", "Requests")}
          {navLink("/admin/reviews", "Reviews")}
          <span className="mx-1 h-5 w-px bg-blush-light" aria-hidden="true" />
          {navLink("/admin/products", "Products")}
          {navLink("/admin/categories/reorder", "Categories")}
          {navLink("/admin/custom-types", "Custom Pricing")}
          {navLink("/admin/coupons", "Coupons")}
          <span className="mx-1 h-5 w-px bg-blush-light" aria-hidden="true" />
          {navLink("/admin/homepage", "Homepage")}
          {navLink("/admin/emails", "Emails")}
          {navLink("/admin/subscribers", "Subscribers")}
          {navLink("/admin/settings", "Settings")}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
