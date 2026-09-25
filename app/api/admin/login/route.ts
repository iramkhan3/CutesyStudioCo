import { NextResponse } from "next/server";
import {
  createSessionToken,
  getAdminCookieName,
  isAdminAuthConfigured,
  SESSION_MAX_AGE_SECONDS,
  verifyPassword,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// See app/api/coupons/route.ts for why this is needed alongside "force-dynamic".
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json({ error: "Admin login isn't configured yet." }, { status: 503 });
  }

  let body: { password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.password !== "string" || !body.password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  // A small fixed delay slows down naive scripted brute-force attempts.
  // This isn't distributed rate limiting (each serverless invocation is
  // stateless) — the real defense is a long, random ADMIN_PASSWORD.
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!verifyPassword(body.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await createSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Admin login isn't configured yet." }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(getAdminCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
