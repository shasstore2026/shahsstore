import { supabaseAdmin } from "@/lib/supabase-admin";
import { getProducts, getShirtStyles } from "@/lib/products";
import RevenueDashboardClient from "./RevenueDashboardClient";

export default async function RevenuePage() {
  const [products, shirtStyles, ordersResult] = await Promise.all([
    getProducts(),
    getShirtStyles(),
    supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <RevenueDashboardClient
      orders={ordersResult.data ?? []}
      products={products}
      shirtStyles={shirtStyles}
    />
  );
}
