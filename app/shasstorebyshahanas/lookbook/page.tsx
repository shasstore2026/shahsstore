import { getHomepageContent, getProducts } from "@/lib/products";
import LookbookEditClient from "./LookbookEditClient";

export default async function LookbookPage() {
  const [content, products] = await Promise.all([
    getHomepageContent(),
    getProducts(),
  ]);
  return <LookbookEditClient content={content} products={products} />;
}
