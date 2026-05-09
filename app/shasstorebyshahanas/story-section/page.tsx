import { getHomepageContent } from "@/lib/products";
import StorySectionEditClient from "./StorySectionEditClient";

export default async function StorySectionPage() {
  const content = await getHomepageContent();
  return <StorySectionEditClient content={content} />;
}
