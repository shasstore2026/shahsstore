import { NextResponse } from "next/server";
import { getTopNotification } from "@/lib/products";

export async function GET() {
  const data = await getTopNotification();
  return NextResponse.json(data);
}
