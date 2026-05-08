import { getHomepageContent } from "@/lib/products";
import MarqueeEditClient from "./MarqueeEditClient";

export default async function MarqueeAdminPage() {
  const content = await getHomepageContent();
  return <MarqueeEditClient items={content.marquee_items} />;
}
