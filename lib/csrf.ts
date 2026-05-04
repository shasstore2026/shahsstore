/**
 * Same-origin check for state-changing API routes.
 *
 * Next.js Server Actions have built-in CSRF protection (origin check). Our
 * manual POST routes (/api/create-order, /api/verify-payment, /api/upload-image,
 * etc.) do NOT — so we add it ourselves here.
 *
 * Returns null if the request looks same-origin (or has no Origin header,
 * which means it's a same-page form/fetch). Returns a NextResponse 403 if
 * the request comes from a different origin.
 */

import { NextResponse } from "next/server";

export function checkSameOrigin(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  // Same-page fetch / form submit can omit Origin — that's still same-origin
  // because the browser only attaches it on cross-origin requests.
  if (!origin) return null;

  const host = req.headers.get("host");
  if (!host) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (originHost !== host) {
    return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
  }

  return null;
}
