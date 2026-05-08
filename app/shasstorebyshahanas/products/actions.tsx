"use server";
import { deleteProduct, updateFeaturedOrder } from "@/lib/actions";

export async function handleDelete(productId: string, confirmation: string) {
  await deleteProduct(productId, confirmation);
}

export async function handleFeaturedOrder(productId: string, formData: FormData) {
  const val = formData.get("featured_order");
  await updateFeaturedOrder(productId, val && val !== "" ? Number(val) : null);
}
