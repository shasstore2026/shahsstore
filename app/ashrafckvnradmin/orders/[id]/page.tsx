import { supabaseAdmin } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";
import OrderDetailClient from "./OrderDetailClient";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) notFound();

  return <OrderDetailClient order={order} />;
}
