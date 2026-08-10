import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/constants";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

const TITLE = `${SITE.name} — Decoden Phone Cases & Kawaii Accessories in India`;
const DESCRIPTION =
  "Handmade decoden phone cases, custom cases, jewelry boxes, mirrors, and keychains — cream-topped, charm-covered, and made to order in India. Shop ready-made pieces or build your own.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: TITLE,
    template: `%s — ${SITE.name}`,
  },
  description: DESCRIPTION,
  keywords: [
    "decoden phone case",
    "decoden phone case india",
    "kawaii phone case",
    "custom phone case india",
    "cute phone case online india",
    "handmade phone case india",
    "sanrio phone case",
    "hello kitty phone case",
    "charm phone case",
    "aesthetic phone case shop",
    "cream deco phone case",
    "pastel phone case india",
    "kawaii accessories india",
    "handmade decoden studio",
  ],
  alternates: {
    canonical: SITE.url,
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE.url,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="flex min-h-screen flex-col">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "OnlineStore",
            name: SITE.name,
            description: DESCRIPTION,
            url: SITE.url,
            email: SITE.email,
            sameAs: [SITE.instagramUrl],
            areaServed: "IN",
          }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
