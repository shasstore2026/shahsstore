import { getShirtStyles } from "@/lib/products";
import NewProductClient from "./NewProductClient";

export default async function NewProductPage() {
  const styles = await getShirtStyles();
  return <NewProductClient styles={styles} />;
}
