import { getSiteBranding } from "@/lib/products";
import BrandingEditClient from "./BrandingEditClient";

export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  const branding = await getSiteBranding();

  if (!branding) {
    return (
      <div className="p-8">
        <p className="text-stone-500 italic">
          Site branding row missing. Run the latest migration.
        </p>
      </div>
    );
  }

  return <BrandingEditClient branding={branding} />;
}
