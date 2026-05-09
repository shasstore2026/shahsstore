import { getHomepageContent } from "@/lib/products";
import CategoriesSectionEditClient from "./CategoriesSectionEditClient";

export default async function CategoriesSectionPage() {
  const content = await getHomepageContent();
  return <CategoriesSectionEditClient content={content} />;
}
