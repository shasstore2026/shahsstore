"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function MaintenanceOverlay({
  initialEnabled = false,
  initialMessage = "Site Under Maintenance",
  initialPhone1 = "",
  initialPhone2 = "",
}: {
  initialEnabled?: boolean;
  initialMessage?: string;
  initialPhone1?: string;
  initialPhone2?: string;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/ashrafckvnradmin");

  // Initialize from server props so the overlay can show on first paint
  const [manualEnabled, setManualEnabled] = useState(initialEnabled);
  const [manualMessage, setManualMessage] = useState(initialMessage);
  const [phone1, setPhone1] = useState(initialPhone1);
  const [phone2, setPhone2] = useState(initialPhone2);
  const [dbDown, setDbDown] = useState(false);

  const reason: "manual" | "database" | null = manualEnabled
    ? "manual"
    : dbDown
    ? "database"
    : null;
  const isVisible = !!reason && !isAdmin;

  // Poll for status changes (manual + DB)
  useEffect(() => {
    if (isAdmin) return;
    let cancelled = false;
    let dbFailures = 0;

    const check = async () => {
      // Manual maintenance check
      try {
        const res = await fetch("/api/maintenance-status", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setManualEnabled(Boolean(data.enabled));
          if (data.message) setManualMessage(data.message);
          setPhone1(data.phone1 ?? "");
          setPhone2(data.phone2 ?? "");
          if (data.enabled) return; // skip DB check if manual mode is on
        }
      } catch {
        // ignore — DB check below
      }

      // DB health check
      try {
        const r = await fetch("/api/health", { cache: "no-store" });
        if (cancelled) return;
        if (r.ok) {
          dbFailures = 0;
          setDbDown(false);
        } else {
          dbFailures += 1;
          if (dbFailures >= 2) setDbDown(true);
        }
      } catch {
        if (cancelled) return;
        dbFailures += 1;
        if (dbFailures >= 2) setDbDown(true);
      }
    };

    const interval = setInterval(check, 30000);
    // Run a check shortly after mount in case server data is stale
    const initial = setTimeout(check, 500);
    return () => {
      cancelled = true;
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [isAdmin]);

  // Lock body scroll when overlay is visible
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isVisible) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const title = reason === "manual" ? manualMessage : "Site Under Maintenance";
  const subtitle =
    reason === "manual"
      ? "We're making some improvements right now. Please come back later — we appreciate your patience."
      : "We're performing scheduled maintenance to bring you a better experience. Please check back shortly.";

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 overscroll-contain"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(8px)" }}
      onWheel={(e) => e.preventDefault()}
      onTouchMove={(e) => e.preventDefault()}
    >
      <div className="bg-white max-w-md w-full p-8 md:p-12 text-center shadow-2xl relative rounded-lg">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-amber-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
            />
          </svg>
        </div>

        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-3">
          {reason === "manual" ? "We'll be right back" : "Notice"}
        </p>

        <h2
          className="text-3xl md:text-4xl text-stone-900 font-light mb-4"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {title}
        </h2>

        <p className="text-stone-500 text-sm font-light leading-relaxed mb-6">
          {subtitle}
        </p>

        {reason === "database" && (
          <div className="flex items-center justify-center gap-2 text-xs text-stone-400 mb-6">
            <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
            <span className="tracking-widest uppercase">Reconnecting...</span>
          </div>
        )}

        {/* Contact phones */}
        {(phone1 || phone2) && (
          <div className="border-t border-stone-100 pt-5 mb-6">
            <p className="text-xs tracking-widest uppercase text-stone-400 mb-3">
              For Urgent Queries
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {phone1 && (
                <a
                  href={`tel:${phone1.replace(/\s/g, "")}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-sm text-stone-700 transition-colors"
                >
                  <span>📞</span> {phone1}
                </a>
              )}
              {phone2 && (
                <a
                  href={`tel:${phone2.replace(/\s/g, "")}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-sm text-stone-700 transition-colors"
                >
                  <span>📞</span> {phone2}
                </a>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleRetry}
          className="w-full bg-stone-900 text-white py-3 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all duration-300"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
