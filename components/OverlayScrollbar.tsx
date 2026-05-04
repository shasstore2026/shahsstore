"use client";
import { useEffect, useRef, useState } from "react";

export default function OverlayScrollbar() {
  const [mounted, setMounted] = useState(false);
  const [thumb, setThumb] = useState({ top: 0, height: 0, visible: false });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const update = () => {
      const docH = document.documentElement.scrollHeight;
      const winH = window.innerHeight;
      const scrollY = window.scrollY;

      if (docH <= winH + 1) {
        setThumb((t) => (t.visible ? { ...t, visible: false } : t));
        return;
      }

      const ratio = winH / docH;
      const thumbH = Math.max(40, ratio * winH);
      const maxScroll = docH - winH;
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
      const top = progress * (winH - thumbH);

      setThumb({ top, height: thumbH, visible: true });

      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(
        () => setThumb((t) => ({ ...t, visible: false })),
        800
      );
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        right: 2,
        top: 0,
        width: 6,
        height: "100vh",
        zIndex: 99999,
        pointerEvents: "none",
        opacity: thumb.visible ? 1 : 0,
        transition: "opacity 250ms ease",
      }}
    >
      <div
        style={{
          width: 6,
          height: thumb.height,
          transform: `translate3d(0, ${thumb.top}px, 0)`,
          background: "rgba(28, 25, 23, 0.45)",
          borderRadius: 3,
          willChange: "transform",
        }}
      />
    </div>
  );
}
