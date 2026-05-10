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
  // Mobile uses the dedicated portrait crop when set, otherwise falls back to
  // the desktop image. The fallback uses object-contain on mobile so a wide
  // landscape source still shows the model in full (letterboxed) instead of
  // cropping the subject out of frame.
  const mobileSrc = banner.mobile_image?.trim() || banner.main_image;
  const hasMobileImage = !!mobileSrc;
  const hasDedicatedMobile = !!banner.mobile_image?.trim();
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
          MOBILE (< md): full-bleed image (model fully visible) +
            vertical right-edge headline + bottom-left labels — all
            overlaid on the same image (FableStreet mobile pattern).
          ──────────────────────────────────────────────────────────── */}
      <div className="md:hidden absolute inset-0">
        {hasMobileImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={mobileSrc}
            alt={`${left} ${right}`.trim() || "Hero"}
            className="w-full h-full object-cover"
            style={{
              // Dedicated portrait mobile crop → centred (subject naturally fills the frame).
              // Landscape fallback (using the desktop image) → focus 30% from the left,
              // because editorial fashion shots almost always place the model in the
              // left-third of a wide image (rule-of-thirds). This keeps the model in
              // frame on portrait phones even when the admin hasn't uploaded a
              // dedicated mobile crop.
              objectPosition: hasDedicatedMobile ? "center" : "30% center",
              animation: "kenBurns 22s ease-in-out infinite alternate",
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--color-shas-blush)] via-[var(--color-shas-cream)] to-white" />
        )}

        {/* Tonal overlay — soft top, slightly stronger bottom so the
            white labels and right-edge headline both stay legible. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/50 pointer-events-none"
        />

        {/* Vertical right-edge headline.
            Each LETTER is its own flex-item span, stacked upright in a
            flex-col with justify-between so the column SPANS the full
            available height (just below the navbar to the bottom of
            the hero). Bigger letters and the natural top-to-bottom
            distribution make the headline read like a totem.

            Top offset = navbar height (76px on mobile) + optional top
            notification bar var, so the column starts flush under the
            navbar regardless of whether the marquee is shown.
            Bottom-6 leaves a touch of breathing room from the edge.

            Two words → two adjacent columns. Both use justify-between
            so each visually fills the same vertical band. */}
        {hasHeadline && (
          <div
            className="absolute right-3 flex items-stretch gap-4 pointer-events-none
                       top-[calc(76px+var(--top-bar-height,0px)+8px)] bottom-6"
          >
            {left && (
              <h1
                className="flex flex-col items-center justify-between
                           text-white font-light uppercase text-3xl leading-none
                           drop-shadow-[0_2px_20px_rgba(0,0,0,0.55)] reveal"
                style={{ ['--reveal-delay' as string]: '0.15s' }}
              >
                {Array.from(left).map((c, i) => (
                  <span key={i}>{c === ' ' ? ' ' : c}</span>
                ))}
              </h1>
            )}
            {right && (
              <h1
                className="flex flex-col items-center justify-between
                           text-white font-light uppercase text-3xl leading-none
                           drop-shadow-[0_2px_20px_rgba(0,0,0,0.55)] reveal"
                style={{ ['--reveal-delay' as string]: '0.3s' }}
              >
                {Array.from(right).map((c, i) => (
                  <span key={i}>{c === ' ' ? ' ' : c}</span>
                ))}
              </h1>
            )}
          </div>
        )}

        {/* Bottom-left: tracking label + italic accent + CTA. Right
            padding leaves room for the vertical headline column. */}
        <div className="absolute bottom-7 left-4 right-20 flex flex-col gap-3 reveal" style={{ ['--reveal-delay' as string]: '0.5s' }}>
          {label && (
            <div>
              <p className="text-white text-[0.6rem] tracking-[0.4em] uppercase font-light drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)]">
                {label}
              </p>
              {italicAccent && label !== italicAccent && (
                <p className="font-display italic text-white/85 text-sm mt-1 drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
                  {italicAccent}
                </p>
              )}
            </div>
          )}
          <Link
            href={ctaHref}
            className="text-white text-[0.6rem] tracking-[0.4em] uppercase font-light
                       inline-flex items-center gap-1.5 self-start group
                       drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)]"
          >
            <span className="border-b border-white/60 pb-1 group-hover:border-white transition-colors">
              Shop the Collection
            </span>
            <span className="text-sm transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
