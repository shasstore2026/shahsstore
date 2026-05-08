import { getCategories } from "@/lib/products";
import { notFound } from "next/navigation";
import EditCategoryClient from "./EditCategoryClient";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const styles = await getCategories();
  const style = styles.find((s) => s.id === id);

  if (!style) notFound();

  return <EditCategoryClient style={style} />;
}
