import { getHeroBanner, getProducts } from "@/lib/products";
import HeroBannerEditClient from "./HeroBannerEditClient";

export default async function HeroBannerAdminPage() {
  const [banner, products] = await Promise.all([
    getHeroBanner(),
    getProducts(),
  ]);
  if (!banner) return <p>No banner found. Run SQL to insert a row.</p>;
  return <HeroBannerEditClient banner={banner} products={products} />;
}
