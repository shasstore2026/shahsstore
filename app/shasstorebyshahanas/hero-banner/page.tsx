import { getHeroBanner } from "@/lib/products";
import HeroBannerEditClient from "./HeroBannerEditClient";

export default async function HeroBannerAdminPage() {
  const banner = await getHeroBanner();
  if (!banner) return <p>No banner found. Run SQL to insert a row.</p>;
  return <HeroBannerEditClient banner={banner} />;
}
