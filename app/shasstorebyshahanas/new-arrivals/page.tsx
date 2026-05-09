import { getHomepageContent } from "@/lib/products";
import NewArrivalsEditClient from "./NewArrivalsEditClient";

export default async function NewArrivalsPage() {
  const content = await getHomepageContent();
  return <NewArrivalsEditClient content={content} />;
}
