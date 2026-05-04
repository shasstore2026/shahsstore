import { NextResponse } from "next/server";
import { getMaintenanceStatus } from "@/lib/products";

export async function GET() {
  try {
    const status = await getMaintenanceStatus();
    return NextResponse.json(status);
  } catch {
    return NextResponse.json({ enabled: false, message: "Site Under Maintenance" });
  }
}
