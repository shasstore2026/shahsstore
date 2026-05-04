import { createClient } from "@supabase/supabase-js";

// Only import this in server components or actions — NEVER in "use client" files
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
