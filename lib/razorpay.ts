import "server-only";
import Razorpay from "razorpay";

/**
 * Returns a configured Razorpay server client, or null if the keys aren't
 * set yet. Route handlers should check for null and return a friendly 503
 * rather than crashing.
 */
export function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) return null;

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
