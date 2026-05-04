import { getTopNotification } from "@/lib/products";
import TopNotificationClient from "./TopNotificationClient";

export default async function TopNotificationPage() {
  const data = await getTopNotification();
  return (
    <TopNotificationClient
      initialEnabled={data.enabled}
      initialItems={data.items}
      initialBgColor={data.bgColor}
      initialTextColor={data.textColor}
      initialFontSize={data.fontSize}
    />
  );
}
