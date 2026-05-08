import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdminUser } from "@/lib/admin-check";
import { checkSameOrigin } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  const csrf = checkSameOrigin(req);
  if (csrf) return csrf;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdminUser(user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { value, excludeId } = await req.json();

    const num = Number(value);
    if (isNaN(num) || num < 1) {
      return NextResponse.json({
        available: false,
        error: "Display order must be a positive number",
      });
    }

    // Check if number is taken
    let q = supabaseAdmin
      .from("categories")
      .select("id, name")
      .eq("display_order", num);
    if (excludeId) q = q.neq("id", excludeId);
    const { data: conflicts } = await q.limit(1);

    if (conflicts && conflicts.length > 0) {
      // Find next available
      const { data: usedRows } = await supabaseAdmin
        .from("categories")
        .select("display_order");
      const used = new Set(
        (usedRows ?? []).map((r) => r.display_order as number).filter((n) => n != null)
      );
      if (excludeId) {
        const { data: own } = await supabaseAdmin
          .from("categories")
          .select("display_order")
          .eq("id", excludeId)
          .single();
        if (own?.display_order != null) used.delete(own.display_order as number);
      }
      let next = 1;
      while (used.has(next)) next++;

      return NextResponse.json({
        available: false,
        conflict: conflicts[0].name,
        suggestion: next,
      });
    }

    return NextResponse.json({ available: true });
  } catch (err) {
    console.error("validate-category-order error:", err);
    return NextResponse.json({ available: true });
  }
}
