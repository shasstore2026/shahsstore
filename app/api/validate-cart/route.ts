import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getMaintenanceStatus } from "@/lib/products";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkSameOrigin } from "@/lib/csrf";

type CartItem = {
  id: string;
  selectedSize: string;
  quantity: number;
  // Optional client-cached price — used to detect when admin has changed
  // the price since the item was added to the cart.
  price?: number;
};

export async function POST(req: NextRequest) {
  try {
    const csrf = checkSameOrigin(req);
    if (csrf) return csrf;

    const rl = checkRateLimit(`validate-cart:${getClientIp(req)}`, 30, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { valid: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    // Block during maintenance — customers shouldn't be processing carts
    const maint = await getMaintenanceStatus().catch(() => ({ enabled: false }));
    if (maint.enabled) {
      return NextResponse.json(
        { valid: false, error: "Site is under maintenance" },
        { status: 503 }
      );
    }

    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ valid: true, issues: [] });
    }

    if (items.length > 50) {
      return NextResponse.json({ valid: false, error: "Cart has too many items" }, { status: 400 });
    }

    const productIds = items.map((i: CartItem) => i.id);
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, price, image, in_stock, size_inventory")
      .in("id", productIds);

    if (error || !products) {
      return NextResponse.json({ valid: false, error: "Failed to validate cart" }, { status: 500 });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const issues: Array<{
      id: string;
      size: string;
      name: string;
      requested: number;
      available: number;
      reason: "out_of_stock" | "insufficient_stock" | "product_unavailable" | "product_removed";
    }> = [];
    // Silent updates the client should apply without showing the customer
    // any "price changed" message — they always see current admin pricing.
    const updates: Array<{
      id: string;
      size: string;
      price: number;
      name: string;
      image: string;
    }> = [];

    for (const item of items as CartItem[]) {
      const product = productMap.get(item.id);

      if (!product) {
        issues.push({
          id: item.id,
          size: item.selectedSize,
          name: "Product",
          requested: item.quantity,
          available: 0,
          reason: "product_removed",
        });
        continue;
      }

      // Always surface current price/name/image so the cart never displays
      // stale data after an admin edit. The client decides whether anything
      // actually changed.
      updates.push({
        id: item.id,
        size: item.selectedSize,
        price: Number(product.price ?? 0),
        name: product.name as string,
        image: (product.image as string | null) ?? "",
      });

      if (!product.in_stock) {
        issues.push({
          id: item.id,
          size: item.selectedSize,
          name: product.name,
          requested: item.quantity,
          available: 0,
          reason: "product_unavailable",
        });
        continue;
      }

      const inventory = (product.size_inventory as Record<string, number>) ?? {};
      const available = inventory[item.selectedSize] ?? 0;

      if (available === 0) {
        issues.push({
          id: item.id,
          size: item.selectedSize,
          name: product.name,
          requested: item.quantity,
          available: 0,
          reason: "out_of_stock",
        });
      } else if (available < item.quantity) {
        issues.push({
          id: item.id,
          size: item.selectedSize,
          name: product.name,
          requested: item.quantity,
          available,
          reason: "insufficient_stock",
        });
      }
    }

    return NextResponse.json({
      valid: issues.length === 0,
      issues,
      updates,
    });
  } catch (err) {
    console.error("Cart validation error:", err);
    return NextResponse.json({ valid: false, error: "Validation failed" }, { status: 500 });
  }
}
