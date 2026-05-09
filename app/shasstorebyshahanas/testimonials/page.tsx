import { getHomepageContent } from "@/lib/products";
import TestimonialsEditClient from "./TestimonialsEditClient";

export default async function TestimonialsPage() {
  const content = await getHomepageContent();
  return <TestimonialsEditClient content={content} />;
}
