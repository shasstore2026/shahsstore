import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Quick lightweight query to check if Supabase is responding
    const { error } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, reason: "database" },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "database" },
      { status: 503 }
    );
  }
}
