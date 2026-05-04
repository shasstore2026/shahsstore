"use client";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/ashrafckvnradmin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      title={collapsed ? "Logout" : undefined}
      className={`flex items-center gap-3 ${
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
      } text-sm text-red-400 hover:text-red-600 transition-colors w-full mt-1`}
    >
      <span className={collapsed ? "text-lg" : ""}>{collapsed ? "→" : "→ Logout"}</span>
    </button>
  );
}
