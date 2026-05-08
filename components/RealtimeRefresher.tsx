"use client";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const WATCHED_TABLES = [
  "products",
  "categories",
  "homepage_content",
  "hero_banner",
  "company_content",
  "help_content",
] as const;

const SKIP_PATH_PREFIXES = ["/shasstorebyshahanas", "/checkout", "/cart"];

export default function RealtimeRefresher() {
  const router = useRouter();
  const pathname = usePathname();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether a realtime change arrived while the tab was hidden.
  // We refresh the moment the user returns so they don't see stale data.
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!pathname) return;
    if (SKIP_PATH_PREFIXES.some((p) => pathname.startsWith(p))) return;

    const supabase = createSupabaseBrowserClient();

    const refreshNow = () => {
      pendingRef.current = false;
      router.refresh();
    };

    const triggerRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (document.hidden) {
          // Defer the refresh until the tab is visible again so the customer
          // sees up-to-date content the moment they look back.
          pendingRef.current = true;
          return;
        }
        refreshNow();
      }, 800);
    };

    const handleVisibility = () => {
      if (!document.hidden && pendingRef.current) refreshNow();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    const channel = supabase.channel("public-content-realtime");
    for (const table of WATCHED_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        triggerRefresh
      );
    }
    channel.subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
      supabase.removeChannel(channel);
    };
  }, [pathname, router]);

  return null;
}
