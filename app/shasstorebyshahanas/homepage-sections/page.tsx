import { getHomepageContent } from "@/lib/products";
import HomepageSectionsEditClient from "./HomepageSectionsEditClient";

export default async function HomepageSectionsPage() {
  const content = await getHomepageContent();
  return <HomepageSectionsEditClient content={content} />;
}
