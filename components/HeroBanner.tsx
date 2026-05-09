import Link from "next/link";
import type { HeroBanner } from "@/lib/products";

/**
 * Editorial full-bleed hero — model image fills the screen, with the
 * two-word headline split left/right around the figure, a small label
 * in the bottom-left and a subtle CTA in the bottom-right.
 *
 * Field mapping (admin-managed via /shasstorebyshahanas/hero-banner):
 *   main_image       → full-bleed background
 *   headline_line1   → LEFT word (one short word works best — e.g. "Summer")
 *   headline_line2   → RIGHT word (e.g. "Favourites")
 *   season_label     → bottom-left tracking label (e.g. "Cotton Essentials")
 *   headline_italic  → optional small italic accent under the bottom label
 *   accent_card_link → CTA target (defaults to /collection)
 *
 * Long multi-word values are kept on one line via whitespace-nowrap and
 * may visually overflow the viewport — that's intentional, but admins
 * should prefer one short word per side.
 *
 * Subtext, stats, accent_card_title/price/badge fields from the previous
 * design are intentionally unused here so admins can switch back without
 * losing data.
 */
export default function HeroBanner({ banner }: { banner: HeroBanner }) {
  // Everything below comes straight from the hero_banner DB row — no
  // hardcoded fallback content. If the admin clears a field, that part
  // of the hero just doesn't render. (CTA link is the one exception:
  // we route to /collection by default since "no link" would break the
  // Shop the Collection button.)
  const hasImage = !!banner.main_image;
  const ctaHref = banner.accent_card_link?.trim() || "/collection";
  const left = banner.headline_line1?.trim() ?? "";
  const right = banner.headline_line2?.trim() ?? "";
  const label = (banner.season_label || banner.headline_italic || "").trim();
  const italicAccent = banner.headline_italic?.trim() ?? "";
  const ctaText = "Shop the Collection";
  const hasHeadline = left.length > 0 || right.length > 0;

  return (
    <section className="relative w-full h-[100svh] min-h-[600px] overflow-hidden bg-[var(--color-shas-cream)]">
      {/* Full-bleed image with subtle ken-burns. When admin hasn't
          uploaded a hero image yet we render a soft gradient backdrop —
          no placeholder text, no "add an image" prompt visible to
          shoppers. */}
      <div className="absolute inset-0">
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

      {/* Soft top + bottom gradients to keep text legible without a heavy overlay */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 pointer-events-none"
      />

      {/* ── Desktop / tablet: headline split flanking the model.
            Each word renders only when the matching DB field has a value. */}
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

      {/* ── Mobile: stacked centered headline ── */}
      {hasHeadline && (
        <div className="md:hidden absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none">
          {left && (
            <h1
              className="text-white font-light leading-[0.95] uppercase tracking-[0.1em] text-center whitespace-nowrap
                         text-4xl sm:text-6xl drop-shadow-[0_2px_30px_rgba(0,0,0,0.4)] reveal"
              style={{ ['--reveal-delay' as string]: '0.1s' }}
            >
              {left}
            </h1>
          )}
          {left && right && (
            <span aria-hidden className="block w-10 h-px bg-white/60 my-5 reveal" style={{ ['--reveal-delay' as string]: '0.2s' }} />
          )}
          {right && (
            <h1
              className="text-white font-light leading-[0.95] uppercase tracking-[0.1em] text-center whitespace-nowrap
                         text-4xl sm:text-6xl drop-shadow-[0_2px_30px_rgba(0,0,0,0.4)] reveal"
              style={{ ['--reveal-delay' as string]: '0.3s' }}
            >
              {right}
            </h1>
          )}
        </div>
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
          Shop the Collection
        </span>
        <span className="text-base transition-transform duration-300 group-hover:translate-x-1">→</span>
      </Link>
    </section>
  );
}
