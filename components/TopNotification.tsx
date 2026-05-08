"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const NOTIFICATION_HEIGHT = "36px";
const DEFAULT_BG = "#1c1917";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_FONT = 12;

export default function TopNotification() {
  const [items, setItems] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT);
  const pathname = usePathname();

  // Don't show on admin pages
  const isAdmin = pathname?.startsWith("/shasstorebyshahanas");
  const isVisible = !isAdmin && enabled && items.length > 0;

  useEffect(() => {
    if (isAdmin) return;
    fetch("/api/top-notification")
      .then((res) => res.json())
      .then((data) => {
        setEnabled(data.enabled ?? false);
        setItems(data.items ?? []);
        setBgColor(data.bgColor ?? DEFAULT_BG);
        setTextColor(data.textColor ?? DEFAULT_TEXT);
        setFontSize(data.fontSize ?? DEFAULT_FONT);
      })
      .catch(() => {});
  }, [isAdmin]);

  // Set CSS variable so navbar and hero can adjust position/padding
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(
      "--top-bar-height",
      isVisible ? NOTIFICATION_HEIGHT : "0px"
    );
    return () => {
      document.documentElement.style.setProperty("--top-bar-height", "0px");
    };
  }, [isVisible]);

  if (!isVisible) return null;

  // Duplicate items so the marquee scrolls seamlessly
  const loop = [...items, ...items];

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 overflow-hidden flex items-center"
      style={{
        height: NOTIFICATION_HEIGHT,
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      <div className="relative flex items-center w-full px-4">
        <div className="flex-1 overflow-hidden">
          <div
            className="top-notif-marquee flex gap-12 whitespace-nowrap"
          >
            {loop.map((item, i) => (
              <span
                key={i}
                className="tracking-[0.2em] uppercase font-light flex items-center gap-3"
                style={{ fontSize: `${fontSize}px` }}
              >
                <span style={{ opacity: 0.5 }}>✦</span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .top-notif-marquee {
          animation: scroll-left 40s linear infinite;
        }
        /* Tablet and below */
        @media (max-width: 1024px) {
          .top-notif-marquee { animation-duration: 18s; }
        }
        /* Phone-sized viewports — much faster so the message cycles quickly */
        @media (max-width: 640px) {
          .top-notif-marquee { animation-duration: 8s; }
        }
        /* Touch-first devices (real phones, even when DevTools isn't open) */
        @media (pointer: coarse) and (max-width: 1024px) {
          .top-notif-marquee { animation-duration: 8s; }
        }
      `}</style>
    </div>
  );
}
