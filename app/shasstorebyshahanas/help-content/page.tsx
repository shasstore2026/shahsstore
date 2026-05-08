import { getHelpContent } from "@/lib/products";
import HelpContentEditClient from "./HelpContentEditClient";

export default async function HelpContentAdminPage() {
  const help = await getHelpContent();
  if (!help) return <p>No help content found.</p>;
  return <HelpContentEditClient help={help} />;
}
