import { getMaintenanceStatus } from "@/lib/products";
import MaintenanceModeClient from "./MaintenanceModeClient";

export default async function MaintenanceModePage() {
  const status = await getMaintenanceStatus();
  return (
    <MaintenanceModeClient
      initialEnabled={status.enabled}
      initialMessage={status.message}
      initialPhone1={status.phone1}
      initialPhone2={status.phone2}
    />
  );
}
