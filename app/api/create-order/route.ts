import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";
import { computeVerifiedTotal } from "@/lib/order-pricing";
import { getMaintenanceStatus } from "@/lib/products";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkSameOrigin } from "@/lib/csrf";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const csrf = checkSameOrigin(req);
    if (csrf) return csrf;

    // Rate limit by IP — 10 order creations / minute is well above legit use
    // and stops a single attacker from spamming Razorpay order creation.
    const rl = checkRateLimit(`create-order:${getClientIp(req)}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    // Block all order creation when maintenance mode is on
    const maint = await getMaintenanceStatus().catch(() => ({ enabled: false }));
    if (maint.enabled) {
      return NextResponse.json(
        { error: "Site is under maintenance. Please try again shortly." },
        { status: 503 }
      );
    }

    const { cartItems } = await req.json();

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: "Cart cannot be empty" },
        { status: 400 }
      );
    }

    if (cartItems.length > 50) {
      return NextResponse.json(
        { error: "Cart has too many items" },
        { status: 400 }
      );
    }

    // Recompute the total server-side from the database — never trust client prices
    const verified = await computeVerifiedTotal(cartItems);

    if (verified.totalPaise <= 0) {
      return NextResponse.json(
        { error: "Invalid cart total" },
        { status: 400 }
      );
    }

    const order = await razorpay.orders.create({
      amount: verified.totalPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    // Return the verified amount alongside so the client can render an
    // accurate total (the client should not trust this for any decision —
    // verify-payment will re-check).
    return NextResponse.json({
      ...order,
      verified_total: verified.total,
    });
  } catch (err: unknown) {
    console.error("Razorpay order error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
