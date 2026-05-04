import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Razorpay webhook endpoint — the safety net for the verify-payment flow.
 *
 * Why we need this: a customer can pay successfully, then close their browser
 * before /api/verify-payment fires. Without a webhook, that means money was
 * taken but no order was recorded, and we'd never know.
 *
 * What this does:
 * - Verifies the webhook signature (using RAZORPAY_WEBHOOK_SECRET)
 * - Listens for `payment.captured` events
 * - Logs an alert if a payment captured but no order row exists yet, so we
 *   can manually reconcile (we don't have the customer's cart/details here,
 *   so fully automatic order completion isn't possible without redesigning
 *   the create-order flow)
 *
 * Configure in Razorpay Dashboard → Webhooks:
 *   URL: https://<your-domain>/api/razorpay-webhook
 *   Events: payment.captured
 *   Secret: copy into RAZORPAY_WEBHOOK_SECRET
 */

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Razorpay signs the raw body — must read as text, not parsed JSON.
  const rawBody = await req.text();

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    console.error("[webhook] signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string; email?: string; contact?: string } } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // We currently care about the captured event — that's the one that means
  // money has actually moved. `authorized` means the payment is held but not
  // captured yet; we don't act on those.
  if (event.event !== "payment.captured") {
    return NextResponse.json({ received: true, ignored: event.event });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment?.id || !payment?.order_id) {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  // Idempotency: if we've already saved an order for this payment, no-op.
  const { data: existing } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("razorpay_payment_id", payment.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, status: "already_recorded" });
  }

  // No order row → the customer's verify-payment call never landed. We don't
  // have their cart or shipping address (it's only sent to verify-payment),
  // so we can't fully complete the order from here. Log loudly so the team
  // can reconcile manually from Razorpay dashboard + the customer's email.
  console.error(
    `[CRITICAL][webhook] payment captured but NO order saved. ` +
      `payment_id=${payment.id} order_id=${payment.order_id} ` +
      `amount=${payment.amount} email=${payment.email ?? "?"} contact=${payment.contact ?? "?"}`
  );

  return NextResponse.json({
    received: true,
    status: "missing_order_logged",
  });
}
