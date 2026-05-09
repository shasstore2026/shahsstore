import { getHomepageContent } from "@/lib/products";
import InstagramEditClient from "./InstagramEditClient";

export default async function InstagramPage() {
  const content = await getHomepageContent();
  return <InstagramEditClient content={content} />;
}
