import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  // Public endpoint — use anon client (RLS allows SELECT for anon on categories)
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, display_order")
    .order("display_order", { ascending: true })
    .limit(4);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data);
}
