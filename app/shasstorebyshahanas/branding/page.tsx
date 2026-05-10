import { getSiteBranding } from "@/lib/products";
import BrandingEditClient from "./BrandingEditClient";

export default async function BrandingPage() {
  const branding = await getSiteBranding();
  if (!branding) {
    return (
      <p className="p-8 text-stone-500 italic">
        Site branding row missing — run the latest migration.
      </p>
    );
  }
  return <BrandingEditClient branding={branding} />;
}
