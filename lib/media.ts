// Shared image/video helpers — product media (`Product.images` and admin
// uploads) is one mixed array of URLs; video vs image is inferred from the
// file extension rather than tracked in a separate DB column.

const VIDEO_EXT_RE = /\.(mp4|webm|mov)$/i;

export function isVideoUrl(url: string): boolean {
  return VIDEO_EXT_RE.test(url);
}

/**
 * The card/thumbnail image for a product. Normally `images[0]`, but if a
 * video was accidentally placed first, fall back to the first actual image
 * so thumbnails never try to render a video file as a next/image `src`.
 */
export function firstImageUrl(images: string[]): string | undefined {
  return images.find((url) => !isVideoUrl(url)) ?? images[0];
}

/**
 * Product images are a mix of relative local paths (/products/real/x.jpg)
 * and absolute Supabase Storage URLs (https://...supabase.co/storage/...) —
 * only the relative ones need the site origin prepended for contexts (SEO
 * structured data, OG tags) that require a fully-qualified URL.
 */
export function toAbsoluteUrl(url: string, siteUrl: string): string {
  return /^https?:\/\//i.test(url) ? url : `${siteUrl}${url}`;
}

/**
 * Path of the pre-cropped square thumbnail companion for an image — same
 * name with a `-thumb` suffix, generated automatically for every admin
 * upload (see app/api/admin/upload/route.ts) and batch-processed once for
 * everything already in the catalog. Only call this where that invariant
 * actually holds (product card / list contexts) — not for arbitrary or
 * freshly-dropped local files, which may not have one yet.
 */
export function getThumbnailUrl(url: string): string {
  return url.replace(/(\.[a-zA-Z0-9]+)$/, "-thumb$1");
}

/**
 * True only for the two categories where a `-thumb` companion is actually
 * guaranteed to exist: Supabase Storage uploads (thumbnail generated at
 * upload time) and files under /products/all/ (batch-generated once for the
 * whole catalog — see the one-off script this was built with). Category-level
 * SVG placeholders and any other path never have one.
 */
export function hasThumbnail(url: string): boolean {
  if (isVideoUrl(url) || url.endsWith(".svg")) return false;
  return url.startsWith("/products/all/") || /^https:\/\/[^/]+\.supabase\.co\/storage\//.test(url);
}

/** The best available thumbnail-sized URL for card/list contexts — falls back to the full image when no thumbnail exists. */
export function displayThumbnailUrl(url: string): string {
  return hasThumbnail(url) ? getThumbnailUrl(url) : url;
}
