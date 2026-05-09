import { getHomepageContent } from "@/lib/products";
import SectionVisibilityClient from "./SectionVisibilityClient";

export default async function SectionVisibilityPage() {
  const content = await getHomepageContent();
  return <SectionVisibilityClient content={content} />;
}
