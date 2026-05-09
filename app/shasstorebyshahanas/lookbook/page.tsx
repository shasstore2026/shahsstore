import { getHomepageContent } from "@/lib/products";
import LookbookEditClient from "./LookbookEditClient";

export default async function LookbookPage() {
  const content = await getHomepageContent();
  return <LookbookEditClient content={content} />;
}
