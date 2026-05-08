import Link from "next/link";
import type { HeroBanner } from "@/lib/products";

export default function HeroBanner({ banner }: { banner: HeroBanner }) {
  const hasImage = !!banner.main_image;
  const hasAccent =
    banner.accent_card_title ||
    banner.accent_card_price ||
    banner.accent_card_badge;

  return (
    <section className="relative md:min-h-[100vh] bg-[var(--color-shas-cream)] overflow-hidden">
      {/* Soft gradient mesh — feminine ambiance */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: `
            radial-gradient(circle at 18% 78%, #F4D9CF 0%, transparent 45%),
            radial-gradient(circle at 82% 22%, #E8DDD0 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, #F5EFE6 0%, transparent 60%)
          `,
        }}
      />

      {/* Decorative serif glyph — top right */}
      <p
        aria-hidden
        className="font-italiana absolute top-24 md:top-32 right-6 md:right-16 text-[8rem] md:text-[12rem] text-[var(--color-shas-rose)]/15 leading-none select-none pointer-events-none hidden sm:block"
      >
        ✦
      </p>

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 w-full pt-28 md:pt-32 pb-16 md:pb-20 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center md:min-h-[100vh]">

        {/* Left content */}
        <div className="reveal">
          {banner.season_label && (
            <p className="eyebrow mb-5 md:mb-7">{banner.season_label}</p>
          )}

          <h1
            className="font-display text-[var(--color-shas-plum)] leading-[1.02] mb-6 md:mb-9 text-[2.5rem] sm:text-6xl md:text-7xl lg:text-8xl"
            style={{ fontWeight: 300 }}
          >
            {banner.headline_line1 || "Elegant"}
            <br />
            {banner.headline_line2 || "Dresses"}
            <br />
            <em className="text-[var(--color-shas-rose)] font-light">
              {banner.headline_italic || "& jewellery"}
            </em>
          </h1>

          <p className="text-[var(--color-shas-muted)] text-sm md:text-base font-light leading-relaxed mb-8 md:mb-12 max-w-md">
            {banner.subtext ||
              "A curated collection of pieces designed to feel as good as they look — for every season of you."}
          </p>

          <div className="flex gap-3 sm:gap-4 flex-wrap">
            <Link href="/products" className="btn-plum">
              Shop the Collection
            </Link>
            <Link href="/company#about" className="btn-rose-outline">
              Our Story
            </Link>
          </div>

          {/* Stats */}
          {(banner.stat1_value || banner.stat2_value || banner.stat3_value) && (
            <div className="flex gap-6 sm:gap-10 md:gap-12 mt-10 md:mt-16 pt-7 md:pt-10 border-t border-[var(--color-shas-line)]">
              {[
                [banner.stat1_value, banner.stat1_label],
                [banner.stat2_value, banner.stat2_label],
                [banner.stat3_value, banner.stat3_label],
              ]
                .filter(([v]) => v)
                .map(([val, label]) => (
                  <div key={String(label) ?? String(val)}>
                    <p className="font-display text-2xl md:text-3xl font-light text-[var(--color-shas-plum)]">
                      {val}
                    </p>
                    <p className="text-[0.65rem] text-[var(--color-shas-muted)] tracking-[0.3em] uppercase mt-1">
                      {label}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Right — image block */}
        <div className="relative">
          {/* Desktop layout */}
          <div className="relative hidden md:block h-[640px] w-full">
            {/* Backdrop block */}
            <div
              aria-hidden
              className="absolute right-8 top-12 w-[78%] h-[88%] bg-[var(--color-shas-blush)]/55"
            />

            {/* Main image */}
            <div className="absolute right-0 top-0 w-[80%] h-[560px] overflow-hidden img-zoom-wrap shadow-[0_20px_60px_-20px_rgba(62,31,42,0.35)]">
              {hasImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={banner.main_image}
                  alt="Featured look"
                  className="w-full h-full object-cover object-center"
                  style={{ animation: "kenBurns 18s ease-in-out infinite alternate" }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--color-shas-cream)] to-[var(--color-shas-blush)] flex items-center justify-center">
                  <p className="font-display text-2xl text-[var(--color-shas-rose)] italic">
                    Add a hero image
                  </p>
                </div>
              )}
            </div>

            {/* Accent card */}
            {hasAccent && (
              <Link
                href={banner.accent_card_link || "/products"}
                className="absolute left-0 bottom-0 w-[44%] glass p-6 group hover:bg-white/85 transition-colors"
              >
                {banner.accent_card_badge && (
                  <p className="eyebrow text-[var(--color-shas-rose)] mb-2">
                    {banner.accent_card_badge}
                  </p>
                )}
                <p className="font-display text-2xl text-[var(--color-shas-plum)] leading-snug">
                  {banner.accent_card_title || "Featured piece"}
                </p>
                {banner.accent_card_price && (
                  <p className="text-[var(--color-shas-muted)] text-sm mt-1.5">
                    {banner.accent_card_price}
                  </p>
                )}
                <span className="inline-flex items-center gap-2 text-[0.65rem] text-[var(--color-shas-rose)] tracking-[0.3em] uppercase mt-4 group-hover:gap-3 transition-all">
                  View →
                </span>
              </Link>
            )}
          </div>

          {/* Mobile layout */}
          <div className="md:hidden">
            <div className="relative w-full h-[380px] sm:h-[440px] overflow-hidden img-zoom-wrap shadow-[0_15px_40px_-15px_rgba(62,31,42,0.3)]">
              {hasImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={banner.main_image}
                  alt="Featured look"
                  className="w-full h-full object-cover object-center"
                  style={{ animation: "kenBurns 18s ease-in-out infinite alternate" }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--color-shas-cream)] to-[var(--color-shas-blush)] flex items-center justify-center">
                  <p className="font-display text-2xl text-[var(--color-shas-rose)] italic">
                    Add a hero image
                  </p>
                </div>
              )}
            </div>
            {hasAccent && (
              <Link
                href={banner.accent_card_link || "/products"}
                className="block bg-white border border-[var(--color-shas-line)] p-4 -mt-4 mx-4 relative"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    {banner.accent_card_badge && (
                      <p className="eyebrow text-[var(--color-shas-rose)] mb-1">{banner.accent_card_badge}</p>
                    )}
                    <p className="font-display text-lg text-[var(--color-shas-plum)] leading-snug">
                      {banner.accent_card_title || "Featured piece"}
                    </p>
                    {banner.accent_card_price && (
                      <p className="text-[var(--color-shas-muted)] text-sm mt-1">{banner.accent_card_price}</p>
                    )}
                  </div>
                  <span className="text-[0.65rem] text-[var(--color-shas-rose)] tracking-[0.3em] uppercase whitespace-nowrap">
                    View →
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 reveal" style={{ ['--reveal-delay' as string]: '0.6s' }}>
        <span className="text-[0.65rem] tracking-[0.4em] uppercase text-[var(--color-shas-muted)]">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-[var(--color-shas-rose)] to-transparent animate-pulse" />
      </div>
    </section>
  );
}
