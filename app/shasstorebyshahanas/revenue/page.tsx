import { supabaseAdmin } from "@/lib/supabase-admin";
import { getProducts, getCategories } from "@/lib/products";
import RevenueDashboardClient from "./RevenueDashboardClient";

export default async function RevenuePage() {
  const [products, categories, ordersResult] = await Promise.all([
    getProducts(),
    getCategories(),
    supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <RevenueDashboardClient
      orders={ordersResult.data ?? []}
      products={products}
      categories={categories}
    />
  );
}
