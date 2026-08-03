import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key. Never import this
 * file from a "use client" component — the `server-only` import above will
 * throw a build error if that ever happens by mistake.
 *
 * Returns null when Supabase env vars aren't configured yet, so callers can
 * fall back to local seed data / show a friendly "not configured" message
 * instead of crashing.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
