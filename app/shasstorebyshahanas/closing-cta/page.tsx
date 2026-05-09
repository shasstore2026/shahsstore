import { getHomepageContent } from "@/lib/products";
import ClosingCtaEditClient from "./ClosingCtaEditClient";

export default async function ClosingCtaPage() {
  const content = await getHomepageContent();
  return <ClosingCtaEditClient content={content} />;
}
