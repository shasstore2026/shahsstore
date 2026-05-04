import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkSameOrigin } from "@/lib/csrf";

/**
 * Server-side wrapper for admin login.
 *
 * Why not let the client call supabase.auth.signInWithPassword() directly?
 * - We want to rate-limit by IP+email so brute-force is slowed
 * - We want to return a generic error message (not "user not found" vs
 *   "wrong password") so attackers can't enumerate valid admin emails
 *
 * Supabase enforces its own auth rate limits at the edge (~30/hour per IP),
 * but we tighten that to a much smaller per-email window.
 */
export async function POST(req: NextRequest) {
  const csrf = checkSameOrigin(req);
  if (csrf) return csrf;

  const ip = getClientIp(req);
  const ipRl = checkRateLimit(`admin-login-ip:${ip}`, 10, 15 * 60_000);
  if (!ipRl.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(ipRl.retryAfterSeconds) } }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  // Per-email throttle: 5 attempts per 15 min stops a slow brute force even if
  // an attacker rotates IPs.
  const emailRl = checkRateLimit(`admin-login-email:${email}`, 5, 15 * 60_000);
  if (!emailRl.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(emailRl.retryAfterSeconds) } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Generic message — never reveal whether the email exists in our system
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Cookie was set by createSupabaseServerClient via response cookies;
  // returning success lets the client redirect to /ashrafckvnradmin.
  return NextResponse.json({ success: true });
}
