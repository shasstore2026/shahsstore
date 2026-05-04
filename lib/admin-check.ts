import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Authoritative admin check using the service-role client (bypasses RLS).
 * Use this in server actions and route handlers — NEVER trust just `getUser()`,
 * since any authenticated Supabase user passes that check.
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabaseAdmin
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("admin check failed:", error.message);
    return false;
  }
  return !!data;
}
