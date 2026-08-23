import "server-only";

export type PaypalConfig = {
  clientId: string;
  clientSecret: string;
  apiBase: string;
};

/**
 * Returns PayPal config (client ID, secret, and the right API base URL for
 * the current environment), or null if the keys aren't set yet. Route
 * handlers should check for null and return a friendly 503 rather than
 * crashing — same pattern as lib/razorpay.ts.
 *
 * Defaults to PayPal's sandbox API unless PAYPAL_ENVIRONMENT is explicitly
 * set to "live" — a typo or unset env var fails safe into sandbox, never
 * silently into live.
 */
export function getPaypalConfig(): PaypalConfig | null {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const isLive = process.env.PAYPAL_ENVIRONMENT === "live";
  const apiBase = isLive ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

  return { clientId, clientSecret, apiBase };
}

/**
 * OAuth2 client-credentials token for calling PayPal's Orders v2 REST API
 * server-side. PayPal has no official Node SDK for this anymore (deprecated
 * in favor of plain REST) — a short-lived access token per request is the
 * documented approach.
 */
export async function getPaypalAccessToken(config: PaypalConfig): Promise<string | null> {
  try {
    const res = await fetch(`${config.apiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err) {
    console.error("[paypal] Failed to get access token:", err);
    return null;
  }
}
