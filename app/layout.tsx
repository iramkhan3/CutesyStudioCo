import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NavigationTracker } from "@/components/BackButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/constants";
import { StoreProvider } from "@/components/StoreProvider";
import { getDisplayCoupons, getStoreSettings } from "@/lib/settings";

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

const TITLE = `${SITE.name} — Custom Decoden Phone Cases & Kawaii Accessories in India`;
const DESCRIPTION =
  "Design your own custom decoden phone case, hairbrush, mirror, or keychain — cream-topped, charm-covered, and made by hand in India. Or pick one already finished and ready to ship.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: TITLE,
    template: `%s — ${SITE.name}`,
  },
  description: DESCRIPTION,
  keywords: [
    "custom decoden phone case india",
    "build your own phone case india",
    "decoden phone case",
    "decoden phone case india",
    "kawaii phone case",
    "custom phone case india",
    "cute phone case online india",
    "handmade phone case india",
    "custom decoden hairbrush",
    "custom decoden mirror",
    "custom decoden keychain",
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, coupons] = await Promise.all([getStoreSettings(), getDisplayCoupons()]);
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
            email: settings.contactEmail,
            sameAs: [settings.instagramUrl],
            areaServed: "IN",
          }}
        />
        <StoreProvider settings={settings} coupons={coupons}>
          <NavigationTracker />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
        </StoreProvider>
      </body>
    </html>
  );
}
