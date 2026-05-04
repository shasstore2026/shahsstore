import { getProductById, getShirtStyles } from "@/lib/products";
import { notFound } from "next/navigation";
import EditProductClient from "./EditProductClient";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, styles] = await Promise.all([
    getProductById(id),
    getShirtStyles(),
  ]);
  if (!product) notFound();

  return <EditProductClient product={product} styles={styles} />;
}
