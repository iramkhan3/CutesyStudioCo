import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/products";
import { getCustomProductTypes } from "@/lib/custom-types";
import { firstImageUrl } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CartRefreshProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  mrpInr: number;
  priceInr: number;
  category: string;
  stock: number;
  available: boolean;
};

export type CartRefreshCustomType = {
  slug: string;
  name: string;
  image: string;
  build: { mrpInr: number; priceInr: number };
  surprise: { mrpInr: number; priceInr: number };
};

/**
 * Public: the cart lives in the shopper's browser, so it can go stale (a
 * price change, a sold-out or hidden product, a category move). The cart and
 * checkout pages call this on load and update the saved cart to match — the
 * order routes still re-price everything server-side regardless.
 */
export async function POST(req: Request) {
  let body: { productIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const ids = Array.isArray(body.productIds)
    ? Array.from(new Set(body.productIds.filter((id): id is string => typeof id === "string" && UUID_RE.test(id)))).slice(0, 50)
    : [];

  const [products, customTypes] = await Promise.all([
    ids.length ? getProductsByIds(ids) : Promise.resolve([]),
    getCustomProductTypes(),
  ]);
  if (!products) return NextResponse.json({ error: "Unavailable." }, { status: 503 });

  return NextResponse.json({
    products: products.map(
      (p): CartRefreshProduct => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        image: firstImageUrl(p.images) ?? "",
        mrpInr: p.mrp_inr,
        priceInr: p.price_inr,
        category: p.category,
        stock: p.stock_quantity,
        available: p.active && p.stock_quantity > 0,
      })
    ),
    customTypes: customTypes.map(
      (t): CartRefreshCustomType => ({
        slug: t.slug,
        name: t.name,
        image: t.image,
        build: { mrpInr: t.build.mrpInr, priceInr: t.build.priceInr },
        surprise: { mrpInr: t.surprise.mrpInr, priceInr: t.surprise.priceInr },
      })
    ),
  });
}
