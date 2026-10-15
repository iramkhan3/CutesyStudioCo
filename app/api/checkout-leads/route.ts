import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getProductsByIds } from "@/lib/products";
import { firstImageUrl } from "@/lib/media";
import type { OrderItemSnapshot } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Body = {
  email?: unknown;
  name?: unknown;
  country?: unknown;
  items?: { kind?: unknown; productId?: unknown; quantity?: unknown }[];
};

/**
 * Called quietly from checkout once a valid email is typed (before Pay), so
 * the daily abandoned-checkout reminder can reach shoppers who never clicked
 * Pay. The cart is rebuilt from the database — product names/prices/images
 * never come from the browser, so this can't be used to send spoofed emails.
 * Always answers { ok: true } quickly; failures are just logged.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 200) return NextResponse.json({ ok: false }, { status: 400 });
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const country = typeof body.country === "string" ? body.country.trim().slice(0, 60) : "";
  const raw = Array.isArray(body.items) ? body.items.slice(0, 50) : [];

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: true });

  try {
    const productLines = raw.filter(
      (i) => i?.kind === "product" && typeof i.productId === "string" && UUID_RE.test(i.productId)
    );
    const products = productLines.length ? (await getProductsByIds(productLines.map((i) => i.productId as string))) ?? [] : [];
    const quantity = (q: unknown) => Math.min(Math.max(1, Math.floor(Number(q)) || 1), 99);

    const items: OrderItemSnapshot[] = [];
    for (const line of productLines) {
      const product = products.find((p) => p.id === line.productId);
      if (!product || !product.active) continue;
      items.push({
        kind: "product",
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: firstImageUrl(product.images) ?? "",
        unitPriceInr: product.price_inr,
        quantity: quantity(line.quantity),
      });
    }
    const customCount = raw.filter((i) => i?.kind === "custom").length;
    if (customCount > 0) {
      items.push({
        kind: "custom",
        name: customCount === 1 ? "Your custom piece" : `Your ${customCount} custom pieces`,
        image: "",
        unitPriceInr: 0,
        quantity: 1,
        customization: { mode: "build", productType: "custom", note: "" },
      });
    }
    if (items.length === 0) return NextResponse.json({ ok: true });

    const { error } = await supabase.from("checkout_leads").upsert(
      { email, name: name || null, country: country || null, items, updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );
    if (error) console.error("[checkout-leads] save failed:", error.message);
  } catch (err) {
    console.error("[checkout-leads] save failed:", err);
  }
  return NextResponse.json({ ok: true });
}
