import type { MetadataRoute } from "next";
import { SITE, CATEGORIES } from "@/lib/constants";
import { getAllProducts } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();

  // About/Reviews/Contact/Customize are homepage sections now (see app/page.tsx)
  // rather than separate routes — listed as anchors on the "/" entry instead.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/#customize`, changeFrequency: "weekly", priority: 0.95 },
    { url: `${SITE.url}/shop`, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE.url}/#reviews`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE.url}/#about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/#contact`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE.url}/shop?category=${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE.url}/shop/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
