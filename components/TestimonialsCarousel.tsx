"use client";
import { useEffect, useRef, useState } from "react";
import type { Testimonial } from "@/lib/products";

function Card({ t }: { t: Testimonial }) {
  return (
    <div className="surface-soft p-8 md:p-10 relative h-full">
      {/* Decorative quote glyph */}
      <span
        aria-hidden
        className="absolute top-3 right-5 font-display text-7xl leading-none text-[var(--color-shas-rose)]/20 select-none"
      >
        &ldquo;
      </span>

      {/* Stars */}
      <div className="flex gap-0.5 mb-5">
        {Array(5)
          .fill(0)
          .map((_, s) => (
            <svg
              key={s}
              className="w-3.5 h-3.5 text-[var(--color-shas-rose)]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.445a1 1 0 00-1.176 0l-3.367 2.445c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
            </svg>
          ))}
      </div>

      <p className="font-display italic text-lg md:text-xl text-[var(--color-shas-plum)] leading-relaxed mb-6">
        &ldquo;{t.quote}&rdquo;
      </p>

      <div className="pt-5 border-t border-[var(--color-shas-line)]">
        <p className="text-sm font-medium text-[var(--color-shas-plum)]">{t.name}</p>
        <p className="text-xs text-[var(--color-shas-muted)] tracking-wider">{t.place}</p>
      </div>
    </div>
  );
}

export default function TestimonialsCarousel({
  items,
}: {
  items: Testimonial[];
}) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const handleScroll = () => {
      const cw = scroller.clientWidth;
      if (cw === 0) return;
      const idx = Math.round(scroller.scrollLeft / cw);
      setActive(Math.max(0, Math.min(idx, items.length - 1)));
    };
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, [items.length]);

  const goTo = (i: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ left: i * scroller.clientWidth, behavior: "smooth" });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-[var(--color-shas-line-strong)]">
        <p className="font-display italic text-xl text-[var(--color-shas-rose)]">
          Testimonials will appear here once added in the admin.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile — horizontal snap carousel */}
      <div className="md:hidden">
        <div
          ref={scrollerRef}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          aria-label="Customer testimonials"
        >
          {items.map((t, i) => (
            <div key={i} className="snap-center shrink-0 w-full px-4">
              <Card t={t} />
            </div>
          ))}
        </div>

        <style>{`
          .md\\:hidden div[aria-label="Customer testimonials"]::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Dot indicators */}
        {items.length > 1 && (
          <div className="flex justify-center items-center gap-2 mt-7">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                aria-current={i === active}
                className={`transition-all duration-300 rounded-full ${
                  i === active
                    ? "w-7 h-2 bg-[var(--color-shas-rose)]"
                    : "w-2 h-2 bg-[var(--color-shas-line-strong)] hover:bg-[var(--color-shas-rose)]/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop — 3-column grid (or 2 / 1 if fewer items) */}
      <div
        className={`hidden md:grid gap-6 md:gap-8 ${
          items.length === 1
            ? "grid-cols-1 max-w-xl mx-auto"
            : items.length === 2
            ? "grid-cols-2 max-w-3xl mx-auto"
            : "grid-cols-3"
        }`}
      >
        {items.map((t, i) => (
          <div
            key={i}
            className="reveal"
            style={{ ["--reveal-delay" as string]: `${i * 0.1}s` }}
          >
            <Card t={t} />
          </div>
        ))}
      </div>
    </>
  );
}
