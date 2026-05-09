import Link from "next/link";
import type { HeroBanner } from "@/lib/products";

/**
 * Editorial hero banner.
 *
 * Two distinct layouts driven by viewport:
 *
 *   • Desktop / tablet (md+) — full-bleed image with the two-word
 *     headline split left/right around the figure (FableStreet style).
 *
 *   • Mobile — 55/45 split: image (cropped to the left edge so the
 *     model stays in frame) on the LEFT half with both labels overlaid;
 *     headline stacks vertically on the RIGHT half against a light
 *     cream panel. Designed to fit one viewport (100svh) on every phone
 *     so the user never has to scroll to see the whole hero.
 *
 * Field mapping (admin-managed via /shasstorebyshahanas/hero-banner):
 *   main_image       → background image
 *   headline_line1   → top word (mobile) / LEFT word (desktop)
 *   headline_line2   → bottom word (mobile) / RIGHT word (desktop)
 *   season_label     → bottom-left tracking label (e.g. "Cotton Essentials")
 *   headline_italic  → optional small italic accent under the bottom label
 *   accent_card_link → CTA target (defaults to /collection)
 */
export default function HeroBanner({ banner }: { banner: HeroBanner }) {
  const hasImage = !!banner.main_image;
  const ctaHref = banner.accent_card_link?.trim() || "/collection";
  const left = banner.headline_line1?.trim() ?? "";
  const right = banner.headline_line2?.trim() ?? "";
  const label = (banner.season_label || banner.headline_italic || "").trim();
  const italicAccent = banner.headline_italic?.trim() ?? "";
  const hasHeadline = left.length > 0 || right.length > 0;

  return (
    <section className="relative w-full h-[100svh] md:min-h-[600px] overflow-hidden bg-[var(--color-shas-cream)]">
      {/* ────────────────────────────────────────────────────────────
          DESKTOP / TABLET (md+): full-bleed image + flanking words
          ──────────────────────────────────────────────────────────── */}
      <div className="hidden md:block absolute inset-0">
        {hasImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={banner.main_image}
            alt={`${left} ${right}`.trim() || "Hero"}
            className="w-full h-full object-cover object-center"
            style={{ animation: "kenBurns 22s ease-in-out infinite alternate" }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--color-shas-blush)] via-[var(--color-shas-cream)] to-white" />
        )}
      </div>

      {/* Desktop tonal overlay so white text reads on busy images */}
      <div
        aria-hidden
        className="hidden md:block absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 pointer-events-none"
      />

      {/* Desktop split-headline */}
      {hasHeadline && (
        <div className="hidden md:flex absolute inset-0 items-center justify-between px-10 lg:px-16 xl:px-24 pointer-events-none">
          {left && (
            <h1
              className="text-white font-light leading-none uppercase tracking-[0.1em] whitespace-nowrap
                         text-6xl lg:text-8xl xl:text-9xl drop-shadow-[0_2px_30px_rgba(0,0,0,0.3)]
                         reveal"
              style={{ ['--reveal-delay' as string]: '0.1s' }}
            >
              {left}
            </h1>
          )}
          {right && (
            <h1
              className={`text-white font-light leading-none uppercase tracking-[0.1em] whitespace-nowrap
                         text-6xl lg:text-8xl xl:text-9xl drop-shadow-[0_2px_30px_rgba(0,0,0,0.3)]
                         reveal ${left ? "text-right" : "text-right ml-auto"}`}
              style={{ ['--reveal-delay' as string]: '0.25s' }}
            >
              {right}
            </h1>
          )}
        </div>
      )}

      {/* Desktop bottom-left tracking label */}
      {label && (
        <div className="hidden md:block absolute bottom-10 left-10 lg:left-14 reveal" style={{ ['--reveal-delay' as string]: '0.6s' }}>
          <p className="text-white text-[0.75rem] tracking-[0.45em] uppercase font-light drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
            {label}
          </p>
          {italicAccent && label !== italicAccent && (
            <p className="font-display italic text-white/80 text-lg mt-1 drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
              {italicAccent}
            </p>
          )}
        </div>
      )}

      {/* Desktop bottom-right CTA */}
      <Link
        href={ctaHref}
        className="hidden md:flex absolute bottom-10 right-10 lg:right-14
                   text-white text-[0.75rem] tracking-[0.45em] uppercase font-light
                   items-center gap-2 group reveal
                   drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]"
        style={{ ['--reveal-delay' as string]: '0.7s' }}
      >
        <span className="border-b border-white/60 pb-1 group-hover:border-white transition-colors">
          Shop the Collection
        </span>
        <span className="text-base transition-transform duration-300 group-hover:translate-x-1">→</span>
      </Link>

      {/* ────────────────────────────────────────────────────────────
          MOBILE (< md): 55/45 split.
            Left  — cropped image (model stays visible) + bottom labels.
            Right — vertical-stacked, right-aligned headline on cream.
          ──────────────────────────────────────────────────────────── */}
      <div className="md:hidden absolute inset-0 grid grid-cols-[58%_42%]">
        {/* ─── Left half: image + overlay labels ─────────────────── */}
        <div className="relative overflow-hidden">
          {hasImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={banner.main_image}
              alt={`${left} ${right}`.trim() || "Hero"}
              className="w-full h-full object-cover object-left"
              style={{ animation: "kenBurns 22s ease-in-out infinite alternate" }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--color-shas-blush)] via-[var(--color-shas-cream)] to-white" />
          )}

          {/* Soft gradient at the bottom for label legibility */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15 pointer-events-none"
          />

          {/* Bottom-left labels — both tracking label AND CTA on the
              left half, per the requested layout. */}
          <div className="absolute bottom-6 left-4 right-4 flex flex-col gap-3 reveal" style={{ ['--reveal-delay' as string]: '0.5s' }}>
            {label && (
              <div>
                <p className="text-white text-[0.6rem] tracking-[0.4em] uppercase font-light drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
                  {label}
                </p>
                {italicAccent && label !== italicAccent && (
                  <p className="font-display italic text-white/85 text-sm mt-1 drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
                    {italicAccent}
                  </p>
                )}
              </div>
            )}
            <Link
              href={ctaHref}
              className="text-white text-[0.6rem] tracking-[0.4em] uppercase font-light
                         inline-flex items-center gap-1.5 self-start group
                         drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]"
            >
              <span className="border-b border-white/60 pb-1 group-hover:border-white transition-colors">
                Shop the Collection
              </span>
              <span className="text-sm transition-transform duration-300 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>

        {/* ─── Right half: cream panel with vertical-stacked headline ─ */}
        <div className="relative bg-[var(--color-shas-cream)] flex flex-col items-end justify-center pt-20 pb-10 pr-4 pl-3 gap-3">
          {/* Decorative serif glyph */}
          <span
            aria-hidden
            className="font-italiana absolute top-24 right-2 text-[5rem] text-[var(--color-shas-rose)]/15 leading-none select-none pointer-events-none"
          >
            ✦
          </span>

          {hasHeadline ? (
            <>
              {left && (
                <h1
                  className="text-[var(--color-shas-plum)] font-light leading-[0.95] uppercase
                             tracking-[0.08em] text-right text-2xl sm:text-3xl whitespace-nowrap reveal"
                  style={{ ['--reveal-delay' as string]: '0.15s' }}
                >
                  {left}
                </h1>
              )}
              {right && (
                <h1
                  className="text-[var(--color-shas-plum)] font-light leading-[0.95] uppercase
                             tracking-[0.08em] text-right text-2xl sm:text-3xl whitespace-nowrap reveal"
                  style={{ ['--reveal-delay' as string]: '0.3s' }}
                >
                  {right}
                </h1>
              )}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
