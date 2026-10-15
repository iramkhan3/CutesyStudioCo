import "server-only";

export type InstagramPost = {
  id: string;
  permalink: string;
  imageUrl: string;
  caption: string;
};

type BeholdPost = {
  id: string;
  permalink: string;
  mediaType?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  prunedCaption?: string;
  sizes?: { medium?: { mediaUrl?: string } };
};

/**
 * Latest Instagram posts via a Behold.so JSON feed (Instagram doesn't let a
 * website read posts directly — Behold handles the Instagram login and
 * gives back a public feed URL). Set INSTAGRAM_FEED_URL on Vercel to the
 * feed URL from behold.so → your feed → "JSON". Returns [] when it's not set
 * or the feed can't be fetched, so the homepage falls back to its static
 * image instead of breaking. Cached for an hour.
 */
export async function getInstagramPosts(limit = 8): Promise<InstagramPost[]> {
  const url = process.env.INSTAGRAM_FEED_URL;
  if (!url) return [];

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as BeholdPost[] | { posts?: BeholdPost[] };
    // Behold's v1 feeds return a bare array; v2 feeds wrap it in { posts }.
    const posts = Array.isArray(data) ? data : data.posts ?? [];

    return posts
      .map((p) => ({
        id: p.id,
        permalink: p.permalink,
        // Videos/reels: use the cover image, not the video file.
        imageUrl:
          p.sizes?.medium?.mediaUrl ?? (p.mediaType === "VIDEO" ? p.thumbnailUrl : p.mediaUrl) ?? p.thumbnailUrl ?? "",
        caption: p.prunedCaption ?? p.caption ?? "",
      }))
      .filter((p) => p.imageUrl && p.permalink)
      .slice(0, limit);
  } catch (err) {
    console.error("[instagram] feed fetch failed:", err);
    return [];
  }
}
