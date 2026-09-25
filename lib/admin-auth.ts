// Deliberately NOT importing "server-only" here — this module is imported
// from middleware.ts, which runs on the Edge runtime, not just from API
// routes. It only ever reads server-side env vars and never ships any
// browser-facing UI, so it's safe without that guard; every route that
// actually uses it is itself server-only.
//
// Session tokens are signed with HMAC-SHA256 (Web Crypto — works identically
// on both the Edge runtime and Node.js, so one implementation covers
// middleware and API routes alike) rather than a JWT library, since the only
// thing that needs verifying is "did our server issue this, and has it
// expired" — no claims, no third party ever needs to read it.

const COOKIE_NAME = "cs_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSignBase64url(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return bytesToBase64url(new Uint8Array(signature));
}

/** Constant-time string comparison — used for both the session signature and the password itself, so neither leaks timing info. */
function timingSafeStringEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) {
    // Still touch every byte so a length mismatch doesn't return faster
    // than a content mismatch would.
    let dummy = 0;
    const longer = aBytes.length > bBytes.length ? aBytes : bBytes;
    for (let i = 0; i < longer.length; i++) dummy |= longer[i] ^ 0;
    return dummy === 0 && aBytes.length === bBytes.length;
  }
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

export async function createSessionToken(): Promise<string | null> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;

  const payload = bytesToBase64url(
    new TextEncoder().encode(JSON.stringify({ exp: Date.now() + SESSION_DURATION_MS }))
  );
  const signature = await hmacSignBase64url(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;

  const expectedSignature = await hmacSignBase64url(payload, secret);
  if (!timingSafeStringEqual(signature, expectedSignature)) return false;

  try {
    const decoded = JSON.parse(new TextDecoder().decode(base64urlToBytes(payload))) as { exp?: unknown };
    return typeof decoded.exp === "number" && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeStringEqual(input, expected);
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}
