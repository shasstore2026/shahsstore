import { getCategories } from "@/lib/products";
import NewProductClient from "./NewProductClient";

export default async function NewProductPage() {
  const styles = await getCategories();
  return <NewProductClient styles={styles} />;
}
