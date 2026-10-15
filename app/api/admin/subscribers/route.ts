import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

type Subscriber = { id: string; email: string; created_at: string };

async function allSubscribers(): Promise<Subscriber[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const rows: Subscriber[] = [];
  // Page through in chunks so a big list isn't cut off at PostgREST's row cap.
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("subscribers")
      .select("id, email, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + 999);
    if (error || !data) break;
    rows.push(...(data as Subscriber[]));
    if (data.length < 1000) break;
  }
  return rows;
}

const csvCell = (v: string) => (/[",\n\r]/.test(v) || /^[=+\-@]/.test(v) ? `"${v.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"` : v);

/** GET → { subscribers }  ·  GET ?format=csv → downloadable CSV. */
export async function GET(req: Request) {
  const subscribers = await allSubscribers();
  if (new URL(req.url).searchParams.get("format") === "csv") {
    const lines = ["email,subscribed_at", ...subscribers.map((s) => `${csvCell(s.email)},${s.created_at}`)];
    return new NextResponse(lines.join("\r\n") + "\r\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }
  return NextResponse.json({ subscribers });
}

/** DELETE { id } — removes (unsubscribes) one address. */
export async function DELETE(req: Request) {
  let body: { id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.id !== "string") return NextResponse.json({ error: "Missing subscriber." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Database isn't configured." }, { status: 503 });
  const { error } = await supabase.from("subscribers").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
