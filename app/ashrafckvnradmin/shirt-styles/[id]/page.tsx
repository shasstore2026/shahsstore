import { getShirtStyles } from "@/lib/products";
import { notFound } from "next/navigation";
import EditShirtStyleClient from "./EditShirtStyleClient";

export default async function EditShirtStylePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const styles = await getShirtStyles();
  const style = styles.find((s) => s.id === id);

  if (!style) notFound();

  return <EditShirtStyleClient style={style} />;
}
