import crypto from "crypto";
import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { computeVerifiedTotal } from "@/lib/order-pricing";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkSameOrigin } from "@/lib/csrf";

// NOTE: verify-payment intentionally does NOT block on maintenance mode —
// if a customer's payment was already captured by Razorpay, we MUST process
// the verification (and refund if needed). Blocking here would strand money.

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * Best-effort refund. Returns the refund id on success, null on failure.
 * Failures are logged but do NOT throw — the customer-facing response always
 * surfaces the original error so they know to contact support.
 */
async function safeRefund(
  paymentId: string,
  amountPaise: number,
  reason: string
): Promise<string | null> {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amountPaise,
      speed: "optimum",
      notes: { reason },
    });
    console.error(
      `[refund] Issued refund ${refund.id} for payment ${paymentId} (${amountPaise} paise) — reason: ${reason}`
    );
    return refund.id;
  } catch (err) {
    console.error(
      `[refund-failure] Could not refund payment ${paymentId} — MANUAL INTERVENTION NEEDED. Reason: ${reason}`,
      err
    );
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrf = checkSameOrigin(req);
    if (csrf) return csrf;

    // Rate limit by IP — slows brute-force signature attempts.
    const rl = checkRateLimit(`verify-payment:${getClientIp(req)}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerDetails,
      cartItems,
    } = await req.json();

    // ── Step 1: Validate required fields ─────────────────────────────
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !customerDetails ||
      !Array.isArray(cartItems) ||
      cartItems.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (cartItems.length > 50) {
      return NextResponse.json(
        { success: false, error: "Cart has too many items" },
        { status: 400 }
      );
    }

    if (
      typeof razorpay_order_id !== "string" || razorpay_order_id.length > 64 ||
      typeof razorpay_payment_id !== "string" || razorpay_payment_id.length > 64 ||
      typeof razorpay_signature !== "string" || razorpay_signature.length > 128
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid payment data" },
        { status: 400 }
      );
    }

    // ── Step 2: Verify Razorpay signature (timing-safe) ─────────────
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    const sigBuf = Buffer.from(razorpay_signature, "utf8");
    const expectedBuf = Buffer.from(expectedSignature, "utf8");
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    // ── Step 3: Recompute the verified total server-side ─────────────
    let verified;
    try {
      verified = await computeVerifiedTotal(cartItems);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to verify cart";
      console.error("Cart verification failed:", msg);
      // Payment already happened → refund
      try {
        const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
        await safeRefund(razorpay_payment_id, Number(rzpOrder.amount), "cart_verification_failed");
      } catch {}
      return NextResponse.json(
        { success: false, error: "Cart could not be verified", refunded: true },
        { status: 400 }
      );
    }

    // ── Step 4: Verify the paid amount matches our verified total ────
    // Without this, a customer can pay ₹1 for a ₹10,000 cart by tampering
    // with the cart sent to verify-payment after a small Razorpay payment.
    let rzpOrder;
    try {
      rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
    } catch (err) {
      console.error("Could not fetch Razorpay order:", err);
      return NextResponse.json(
        { success: false, error: "Could not verify payment amount" },
        { status: 500 }
      );
    }

    const paidAmountPaise = Number(rzpOrder.amount);
    if (paidAmountPaise !== verified.totalPaise) {
      console.error(
        `[amount-mismatch] paid=${paidAmountPaise} expected=${verified.totalPaise} order=${razorpay_order_id}`
      );
      // Refund — this is either a tamper attempt or a genuine pricing race
      const refundId = await safeRefund(
        razorpay_payment_id,
        paidAmountPaise,
        "amount_mismatch"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Payment amount does not match cart total. You will be refunded.",
          refunded: refundId !== null,
        },
        { status: 400 }
      );
    }

    // ── Step 5: Atomically decrement inventory ───────────────────────
    const inventoryItems = cartItems.map(
      (item: { id: string; selectedSize: string; quantity?: number }) => ({
        id: item.id,
        size: item.selectedSize,
        quantity: item.quantity ?? 1,
      })
    );

    const { data: decrementResult, error: decrementError } = await supabaseAdmin.rpc(
      "decrement_inventory",
      { items: inventoryItems }
    );

    if (decrementError) {
      console.error("Inventory decrement error:", decrementError.message);
      // Money was taken but stock couldn't be reserved → refund
      const refundId = await safeRefund(
        razorpay_payment_id,
        paidAmountPaise,
        "inventory_decrement_error"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Could not reserve stock. You will be refunded automatically.",
          refunded: refundId !== null,
        },
        { status: 500 }
      );
    }

    if (decrementResult && !decrementResult.success) {
      // Out of stock during the brief window between checkout and payment
      console.error("Out of stock during checkout:", decrementResult.out_of_stock);
      const refundId = await safeRefund(
        razorpay_payment_id,
        paidAmountPaise,
        "out_of_stock_after_payment"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Some items just sold out. Your payment is being refunded automatically.",
          out_of_stock: decrementResult.out_of_stock,
          refunded: refundId !== null,
        },
        { status: 409 }
      );
    }

    // ── Step 6: Sanitize customer details and save the order ─────────
    const safeTrim = (v: unknown, max: number) =>
      typeof v === "string" ? v.trim().slice(0, max) : "";
    const custName = safeTrim(customerDetails.name, 60);
    const custEmail = safeTrim(customerDetails.email, 120);
    const custPhone = safeTrim(customerDetails.phone, 15);
    const custAddress = safeTrim(customerDetails.address, 300);
    const custCity = safeTrim(customerDetails.city, 60);
    const custPincode = safeTrim(customerDetails.pincode, 10);

    if (!custName || !custEmail || !custPhone || !custAddress || !custCity || !custPincode) {
      const refundId = await safeRefund(
        razorpay_payment_id,
        paidAmountPaise,
        "invalid_customer_details"
      );
      return NextResponse.json(
        { success: false, error: "Invalid customer details", refunded: refundId !== null },
        { status: 400 }
      );
    }

    const sanitizedItems = cartItems.map(
      (item: { id: string; selectedSize: string; quantity?: number; name?: string; price?: number }) => ({
        id: String(item.id).slice(0, 64),
        selectedSize: String(item.selectedSize ?? "").slice(0, 20),
        quantity: Math.max(1, Math.min(10, Math.floor(Number(item.quantity ?? 1)))),
        name: typeof item.name === "string" ? item.name.slice(0, 200) : undefined,
        price: typeof item.price === "number" ? item.price : undefined,
      })
    );

    const { error: insertError } = await supabaseAdmin.from("orders").insert({
      razorpay_order_id,
      razorpay_payment_id,
      customer_name: custName,
      customer_email: custEmail,
      customer_phone: custPhone,
      address: custAddress,
      city: custCity,
      pincode: custPincode,
      items: sanitizedItems,
      total_price: verified.total,
      status: "paid",
    });

    if (insertError) {
      // Idempotency: unique-violation means the webhook (or a previous call)
      // already saved this order. Treat as success — never refund a payment
      // that's already a recorded sale.
      // Postgres error code 23505 → unique_violation
      const errCode = (insertError as { code?: string }).code;
      if (errCode === "23505") {
        console.log(
          `[idempotent] order for payment ${razorpay_payment_id} already exists — returning success`
        );
        return NextResponse.json({ success: true });
      }

      console.error("Order insert error:", insertError.message);
      // Money taken, stock reduced, but order row failed to save —
      // refund + restore stock would be ideal, but at minimum log loudly
      console.error(
        `[CRITICAL] Order persistence failed AFTER payment+stock decrement. ` +
        `payment_id=${razorpay_payment_id} order_id=${razorpay_order_id}`
      );
      const refundId = await safeRefund(
        razorpay_payment_id,
        paidAmountPaise,
        "order_save_failed"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Could not save your order. You will be refunded.",
          refunded: refundId !== null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Payment verification error:", err);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
