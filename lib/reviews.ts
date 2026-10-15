import "server-only";
import { unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CONFIG_TAG, revalidateConfig } from "@/lib/settings";

export type ReviewStatus = "pending" | "approved" | "hidden";

export type Review = {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  body: string;
  image_url: string | null;
  email: string | null;
  order_ref: string | null;
  status: ReviewStatus;
  created_at: string;
};

/**
 * Customer reviews. Customers submit via /review (pending); the maker
 * approves/hides/edits/adds them in Admin → Reviews. Only approved reviews
 * show on the homepage — real reviews only, never made-up ones.
 */

export const getApprovedReviews = unstable_cache(
  async (): Promise<Review[]> => {
    const supabase = getSupabaseAdmin();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(24);
    if (error || !data) return [];
    return data as Review[];
  },
  ["approved-reviews"],
  { tags: [CONFIG_TAG], revalidate: 600 }
);

export type ReviewInput = {
  name: string;
  location: string | null;
  rating: number;
  body: string;
  image_url: string | null;
  email: string | null;
  order_ref: string | null;
  status: ReviewStatus;
};

export function validateReviewInput(input: Partial<ReviewInput>): string | null {
  if (typeof input.name !== "string" || input.name.trim().length < 2 || input.name.trim().length > 60) return "Please enter a name (2–60 characters).";
  if (!Number.isInteger(input.rating) || input.rating! < 1 || input.rating! > 5) return "Please choose a rating from 1 to 5 stars.";
  if (typeof input.body !== "string" || input.body.trim().length < 10 || input.body.trim().length > 1500) return "Please write at least 10 characters (up to 1500).";
  if (input.location != null && (typeof input.location !== "string" || input.location.length > 60)) return "Location is too long.";
  if (input.image_url != null && (typeof input.image_url !== "string" || input.image_url.length > 500)) return "Invalid photo.";
  if (input.email != null && (typeof input.email !== "string" || input.email.length > 200)) return "Invalid email.";
  if (input.order_ref != null && (typeof input.order_ref !== "string" || input.order_ref.length > 40)) return "Invalid order number.";
  if (input.status != null && !["pending", "approved", "hidden"].includes(input.status)) return "Invalid status.";
  return null;
}

function clean(input: ReviewInput) {
  const opt = (v: string | null) => (v && v.trim() ? v.trim() : null);
  return {
    name: input.name.trim(),
    location: opt(input.location),
    rating: input.rating,
    body: input.body.trim(),
    image_url: opt(input.image_url),
    email: opt(input.email),
    order_ref: opt(input.order_ref),
    status: input.status,
  };
}

export async function createReview(input: ReviewInput): Promise<Review | { error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Reviews aren't available right now." };
  const { data, error } = await supabase.from("reviews").insert(clean(input)).select().single();
  if (error || !data) return { error: error?.message ?? "Couldn't save the review." };
  if (input.status === "approved") revalidateConfig();
  return data as Review;
}

export async function adminListReviews(status?: ReviewStatus): Promise<Review[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  let query = supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(500);
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return (data ?? []) as Review[];
}

export async function adminUpdateReview(id: string, input: ReviewInput): Promise<Review | { error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Database isn't configured." };
  const { data, error } = await supabase.from("reviews").update(clean(input)).eq("id", id).select().maybeSingle();
  if (error || !data) return { error: error?.message ?? "Review not found." };
  revalidateConfig();
  return data as Review;
}

export async function adminDeleteReview(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (!error) revalidateConfig();
  return !error;
}
