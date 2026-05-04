import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  getDeliveryCharge,
  DEFAULT_DELIVERY_CHARGE,
  DEFAULT_FREE_DELIVERY_THRESHOLD,
} from "@/lib/constants";

export type CartItemInput = {
  id: string;
  selectedSize?: string;
  quantity?: number;
};

export type VerifiedTotal = {
  subtotal: number;
  deliveryCharge: number;
  total: number;
  /** Total in paise — what Razorpay deals in. */
  totalPaise: number;
};

/**
 * Recompute the cart total entirely from the database. Never trust client-supplied
 * prices. Used by both create-order and verify-payment so they always agree.
 */
export async function computeVerifiedTotal(
  items: CartItemInput[]
): Promise<VerifiedTotal> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty");
  }
  if (items.length > 50) {
    throw new Error("Cart has too many items");
  }

  const productIds = items.map((i) => i.id);
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, price")
    .in("id", productIds);
  if (error || !products) throw new Error("Failed to fetch product prices");

  const priceMap = new Map(products.map((p) => [p.id, p.price as number]));

  let subtotal = 0;
  for (const item of items) {
    const price = priceMap.get(item.id);
    if (price === undefined) {
      throw new Error(`Product not found: ${item.id}`);
    }
    const qty = Math.max(1, Math.min(10, Math.floor(Number(item.quantity ?? 1))));
    subtotal += price * qty;
  }

  // Fetch dynamic delivery settings
  const { data: settings } = await supabaseAdmin
    .from("homepage_content")
    .select("delivery_charge, free_delivery_threshold")
    .single();
  const dbDeliveryCharge = (settings?.delivery_charge as number) ?? DEFAULT_DELIVERY_CHARGE;
  const dbFreeThreshold =
    (settings?.free_delivery_threshold as number) ?? DEFAULT_FREE_DELIVERY_THRESHOLD;

  const deliveryCharge = getDeliveryCharge(subtotal, dbDeliveryCharge, dbFreeThreshold);
  const total = subtotal + deliveryCharge;

  return {
    subtotal,
    deliveryCharge,
    total,
    totalPaise: total * 100,
  };
}
