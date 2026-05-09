import Link from "next/link";
import type { HeroBanner } from "@/lib/products";

/**
 * Editorial full-bleed hero — model image fills the screen, with the
 * two-word headline split left/right around the figure, a small label
 * in the bottom-left and a subtle CTA in the bottom-right.
 *
 * Field mapping (admin-managed via /shasstorebyshahanas/hero-banner):
 *   main_image       → full-bleed background
 *   headline_line1   → LEFT word (e.g. "Summer")
 *   headline_line2   → RIGHT word (e.g. "Favourites")
 *   season_label     → bottom-left tracking label (e.g. "Cotton Essentials")
 *   headline_italic  → optional small italic accent under the bottom label
 *   subtext          → optional small description shown center-bottom on tablet+
 *   accent_card_link → CTA target (defaults to /collection)
 *
 * Stats + accent_card fields from the previous design are intentionally
 * unused here so admins can switch back without losing data.
 */
export default function HeroBanner({ banner }: { banner: HeroBanner }) {
  const hasImage = !!banner.main_image;
  const ctaHref = banner.accent_card_link || "/collection";
  const left = banner.headline_line1 || "Curated";
  const right = banner.headline_line2 || "Edits";
  const label = banner.season_label || banner.headline_italic || "";

  return (
    <section className="relative w-full h-[100svh] min-h-[600px] overflow-hidden bg-[var(--color-shas-cream)]">
      {/* Full-bleed image with subtle ken-burns */}
      <div className="absolute inset-0">
        {hasImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={banner.main_image}
            alt={`${left} ${right}`}
            className="w-full h-full object-cover object-center"
            style={{ animation: "kenBurns 22s ease-in-out infinite alternate" }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--color-shas-blush)] via-[var(--color-shas-cream)] to-white" />
        )}
      </div>

      {/* Soft top + bottom gradients to keep text legible without a heavy overlay */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 pointer-events-none"
      />

      {/* ── Desktop / tablet: headline split flanking the model ── */}
      <div className="hidden md:flex absolute inset-0 items-center justify-between px-10 lg:px-20 xl:px-28 pointer-events-none">
        <h1
          className="text-white font-light leading-none uppercase tracking-[0.12em]
                     text-7xl lg:text-[9rem] xl:text-[11rem] drop-shadow-[0_2px_30px_rgba(0,0,0,0.3)]
                     reveal"
          style={{ ['--reveal-delay' as string]: '0.1s' }}
        >
          {left}
        </h1>
        <h1
          className="text-white font-light leading-none uppercase tracking-[0.12em] text-right
                     text-7xl lg:text-[9rem] xl:text-[11rem] drop-shadow-[0_2px_30px_rgba(0,0,0,0.3)]
                     reveal"
          style={{ ['--reveal-delay' as string]: '0.25s' }}
        >
          {right}
        </h1>
      </div>

      {/* ── Mobile: stacked centered headline ── */}
      <div className="md:hidden absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none">
        <h1
          className="text-white font-light leading-[0.95] uppercase tracking-[0.12em] text-center
                     text-5xl sm:text-7xl drop-shadow-[0_2px_30px_rgba(0,0,0,0.4)] reveal"
          style={{ ['--reveal-delay' as string]: '0.1s' }}
        >
          {left}
        </h1>
        <span aria-hidden className="block w-10 h-px bg-white/60 my-5 reveal" style={{ ['--reveal-delay' as string]: '0.2s' }} />
        <h1
          className="text-white font-light leading-[0.95] uppercase tracking-[0.12em] text-center
                     text-5xl sm:text-7xl drop-shadow-[0_2px_30px_rgba(0,0,0,0.4)] reveal"
          style={{ ['--reveal-delay' as string]: '0.3s' }}
        >
          {right}
        </h1>
      </div>

      {/* Optional centered tagline — only on tablet+ to keep mobile clean */}
      {banner.subtext && (
        <p
          className="hidden lg:block absolute left-1/2 -translate-x-1/2 bottom-[28%]
                     text-white/85 text-sm tracking-[0.3em] uppercase font-light text-center max-w-md
                     drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)] reveal"
          style={{ ['--reveal-delay' as string]: '0.5s' }}
        >
          {banner.subtext}
        </p>
      )}

      {/* Bottom-left tracking label */}
      {label && (
        <div className="absolute bottom-7 md:bottom-10 left-6 md:left-10 lg:left-14 reveal" style={{ ['--reveal-delay' as string]: '0.6s' }}>
          <p className="text-white text-[0.65rem] md:text-[0.75rem] tracking-[0.45em] uppercase font-light drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
            {label}
          </p>
          {banner.headline_italic && label !== banner.headline_italic && (
            <p className="font-display italic text-white/80 text-base md:text-lg mt-1 drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
              {banner.headline_italic}
            </p>
          )}
        </div>
      )}

      {/* Bottom-right CTA — minimal underlined link, no chunky button */}
      <Link
        href={ctaHref}
        className="absolute bottom-7 md:bottom-10 right-6 md:right-10 lg:right-14
                   text-white text-[0.65rem] md:text-[0.75rem] tracking-[0.45em] uppercase font-light
                   flex items-center gap-2 group reveal
                   drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]"
        style={{ ['--reveal-delay' as string]: '0.7s' }}
      >
        <span className="border-b border-white/60 pb-1 group-hover:border-white transition-colors">
          Shop the Edit
        </span>
        <span className="text-base transition-transform duration-300 group-hover:translate-x-1">→</span>
      </Link>

      {/* Center scroll cue — small, only on desktop */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-6 hidden md:flex flex-col items-center gap-2 pointer-events-none reveal" style={{ ['--reveal-delay' as string]: '0.9s' }}>
        <span className="text-white/70 text-[0.6rem] tracking-[0.4em] uppercase font-light">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/60 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
