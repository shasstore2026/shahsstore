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

    // Empty value means "not featured" — always allowed
    if (value === null || value === undefined || value === "") {
      return NextResponse.json({ available: true });
    }

    const num = Number(value);
    if (isNaN(num) || num < 1 || num > 99) {
      return NextResponse.json({
        available: false,
        error: "Featured order must be between 1 and 99",
      });
    }

    // Check if number is taken
    let q = supabaseAdmin
      .from("products")
      .select("id, name")
      .eq("featured_order", num);
    if (excludeId) q = q.neq("id", excludeId);
    const { data: conflicts } = await q.limit(1);

    if (conflicts && conflicts.length > 0) {
      // Find next available
      const { data: usedRows } = await supabaseAdmin
        .from("products")
        .select("featured_order")
        .not("featured_order", "is", null);
      const used = new Set(
        (usedRows ?? []).map((r) => r.featured_order as number).filter((n) => n != null)
      );
      // If excludeId provided, fetch its current featured_order and treat as available
      if (excludeId) {
        const { data: own } = await supabaseAdmin
          .from("products")
          .select("featured_order")
          .eq("id", excludeId)
          .single();
        if (own?.featured_order != null) used.delete(own.featured_order as number);
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
    console.error("validate-featured-order error:", err);
    return NextResponse.json({ available: true }); // fail open — server-side will catch
  }
}
