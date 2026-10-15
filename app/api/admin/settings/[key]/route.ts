import { NextResponse } from "next/server";
import { getHomepageContent, getStoreSettings, saveSetting } from "@/lib/settings";
import { DEFAULT_HOMEPAGE, DEFAULT_STORE_SETTINGS, type HomepageContent, type StoreSettings } from "@/lib/settings-defaults";
import { validateHomepage, validateStoreSettings } from "@/lib/settings-validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

type Key = "store" | "homepage";
const isKey = (k: string): k is Key => k === "store" || k === "homepage";

/** GET → { value, defaults } for Admin → Settings ("store") or Admin → Homepage ("homepage"). */
export async function GET(_req: Request, { params }: { params: { key: string } }) {
  if (!isKey(params.key)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return params.key === "store"
    ? NextResponse.json({ value: await getStoreSettings(), defaults: DEFAULT_STORE_SETTINGS })
    : NextResponse.json({ value: await getHomepageContent(), defaults: DEFAULT_HOMEPAGE });
}

/** PUT { value } — saves the whole document and refreshes the site immediately. */
export async function PUT(req: Request, { params }: { params: { key: string } }) {
  if (!isKey(params.key)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let body: { value?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.value || typeof body.value !== "object") return NextResponse.json({ error: "Nothing to save." }, { status: 400 });

  let value: StoreSettings | HomepageContent;
  if (params.key === "store") {
    const v = body.value as StoreSettings;
    const invalid = validateStoreSettings(v);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    value = {
      contactEmail: v.contactEmail.trim(),
      whatsappNumber: v.whatsappNumber.replace(/\D/g, ""),
      instagramHandle: v.instagramHandle.trim(),
      instagramUrl: v.instagramUrl.trim(),
      announcementText: v.announcementText.trim(),
      customOrderTimelineNote: v.customOrderTimelineNote.trim(),
      shipping: {
        domesticFlatInr: v.shipping.domesticFlatInr,
        freeThresholdInr: v.shipping.freeThresholdInr,
        freeThresholdUsdIntl: v.shipping.freeThresholdUsdIntl,
        intlDefaultInr: v.shipping.intlDefaultInr,
        usdInrRate: v.shipping.usdInrRate,
        intlZones: Object.fromEntries(Object.entries(v.shipping.intlZones).map(([c, r]) => [c.trim(), r])),
      },
    };
  } else {
    const v = body.value as HomepageContent;
    const invalid = validateHomepage(v);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    value = {
      ...v,
      aboutParagraphs: v.aboutParagraphs.map((p) => p.trim()).filter(Boolean),
      carousel: v.carousel.map((s) => ({ src: s.src, alt: s.alt.trim() })),
    };
  }

  const result = await saveSetting(params.key, value);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, value });
}
