import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getCoupons } from "@/lib/coupons-data";
import { sendNewsletterWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Newsletter signup isn't configured yet. Please try again later." },
      { status: 503 }
    );
  }

  // ignoreDuplicates means an already-subscribed email is a silent no-op
  // (Postgres ON CONFLICT DO NOTHING) — `.select()` lets us tell that apart
  // from a genuine new signup by whether a row actually came back, so a
  // repeat submission of the same address doesn't re-trigger a welcome email.
  const { data, error } = await supabase
    .from("subscribers")
    .upsert({ email }, { onConflict: "email", ignoreDuplicates: true })
    .select();

  if (error) {
    console.error("[newsletter] Supabase error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  if (data && data.length > 0) {
    // A manually-entered discount code (not the sitewide auto-apply launch
    // offer, which is a domestic-only incentive — see
    // app/api/paypal/create-order) works for anyone, so it's fine to feature
    // here without knowing the subscriber's country. Best-effort: a stalled
    // Resend call must never fail this signup.
    const coupon = (await getCoupons()).find((c) => !c.autoApply) ?? null;
    await sendNewsletterWelcomeEmail(email, coupon ? { code: coupon.code, percentOff: coupon.percentOff } : null).catch(
      (err) => console.error("[newsletter] welcome email failed:", err)
    );
  }

  return NextResponse.json({ success: true });
}
