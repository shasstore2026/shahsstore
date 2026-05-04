import { getProductById, getHelpContent, getRelatedProducts } from "@/lib/products";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, help] = await Promise.all([
    getProductById(id),
    getHelpContent(),
  ]);

  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product.category, product.id, 4);

  return (
    <ProductDetailClient
      product={product}
      sizeGuide={help?.size_guide ?? ""}
      relatedProducts={relatedProducts}
    />
  );
}
