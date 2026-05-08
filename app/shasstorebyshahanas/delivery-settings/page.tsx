import { getHomepageContent } from "@/lib/products";
import DeliverySettingsClient from "./DeliverySettingsClient";

export default async function DeliverySettingsPage() {
  const content = await getHomepageContent();

  return (
    <DeliverySettingsClient
      initialCharge={(content as any).delivery_charge ?? 99}
      initialThreshold={(content as any).free_delivery_threshold ?? 2000}
    />
  );
}
