import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("homepage_content")
    .select("delivery_charge, free_delivery_threshold")
    .single();

  if (error || !data) {
    // Fallback defaults
    return NextResponse.json({
      delivery_charge: 99,
      free_delivery_threshold: 2000,
    });
  }

  return NextResponse.json({
    delivery_charge: data.delivery_charge ?? 99,
    free_delivery_threshold: data.free_delivery_threshold ?? 2000,
  });
}
