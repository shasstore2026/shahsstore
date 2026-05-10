"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSiteBranding } from "@/lib/actions";
import type { SiteBranding } from "@/lib/products";
import { useToast } from "@/components/admin/Toast";
import ImageUploader from "@/components/admin/ImageUploader";

const labelCls =
  "text-[0.65rem] tracking-[0.3em] text-stone-400 uppercase block mb-2";
const inputCls =
  "w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors";
const cardCls =
  "border-2 border-stone-200 p-5";

/**
 * Site Branding editor.
 *
 * Three independent slots that compose to make the navbar mark:
 *   1. Logo Image — the symbol / icon (left of navbar)
 *   2. Wordmark Image — brand name as a styled image (replaces text)
 *   3. Brand Text — brand name as plain text (used when no wordmark image)
 *
 * Plus a small Tagline text slot for the "by shahanas" line.
 *
 * Any combination is valid — the navbar renders only what's set, in
 * order: logo · (wordmark image OR brand text) over (tagline).
 */
export default function BrandingEditClient({
  branding,
}: {
  branding: SiteBranding;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [logoImage, setLogoImage]         = useState(branding.logo_image ?? "");
  const [wordmarkImage, setWordmarkImage] = useState(branding.wordmark_image ?? "");
  const [brandText, setBrandText]         = useState(branding.brand_text ?? "Shasstore");
  const [brandSubtext, setBrandSubtext]   = useState(branding.brand_subtext ?? "by shahanas");
  const [logoAlt, setLogoAlt]             = useState(branding.logo_alt ?? "Shasstore");
  const [logoHeight, setLogoHeight]       = useState<number>(branding.logo_height_px || 44);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("logo_image", logoImage);
    formData.set("wordmark_image", wordmarkImage);
    formData.set("brand_text", brandText);
    formData.set("brand_subtext", brandSubtext);
    formData.set("logo_alt", logoAlt);
    formData.set("logo_height_px", String(logoHeight));

    try {
      await updateSiteBranding(branding.id, formData);
      router.refresh();
      toast.success("Branding updated", "Your navbar branding is now live.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not update branding";
      toast.error("Could not update branding", msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Live preview height (mobile-ish — desktop bumps but the proportions match)
  const previewH = logoHeight;

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Website Content</p>
        <h1
          className="text-3xl md:text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Brand Logo &amp; Name
        </h1>
        <p className="text-sm text-stone-500 mt-2 font-light">
          Three independent slots — fill any combination. The navbar shows only what you set:
          a logo image on the left, then either a wordmark image or text for the brand name,
          with an optional tagline beneath it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-100 p-4 md:p-8 space-y-6">
        {/* ── 1. LOGO IMAGE (mark / icon) ── */}
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-stone-900 text-white text-xs font-medium">1</span>
            <label className="text-sm tracking-[0.2em] text-stone-900 uppercase font-medium">
              Logo Image <span className="text-stone-400">(symbol / icon)</span>
            </label>
          </div>
          <p className="text-xs text-stone-500 mb-3 font-light">
            A small mark or icon that sits on the LEFT of the navbar. Square or square-ish
            images render best. Leave empty if you only want a text/wordmark brand.
          </p>
          <ImageUploader value={logoImage} onChange={setLogoImage} folder="branding" />
          <p className="text-xs text-stone-400 mt-2 font-light">Or paste a URL:</p>
          <input
            type="url"
            value={logoImage}
            onChange={(e) => setLogoImage(e.target.value)}
            className={inputCls + " mt-1"}
            placeholder="https://lgixdwopjzuedvqddeig.supabase.co/storage/v1/object/public/product-images/branding/..."
          />
        </div>

        {/* ── 2. WORDMARK IMAGE (brand name as image) ── */}
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-stone-900 text-white text-xs font-medium">2</span>
            <label className="text-sm tracking-[0.2em] text-stone-900 uppercase font-medium">
              Wordmark Image <span className="text-stone-400">(brand name as image)</span>
            </label>
          </div>
          <p className="text-xs text-stone-500 mb-3 font-light">
            Your brand name set in custom typography, exported as an image (transparent PNG / SVG).
            When present, replaces the brand text below. Pair with the logo image (1) for a full
            mark-and-name layout, or use alone.
          </p>
          <ImageUploader value={wordmarkImage} onChange={setWordmarkImage} folder="branding" />
          <p className="text-xs text-stone-400 mt-2 font-light">Or paste a URL:</p>
          <input
            type="url"
            value={wordmarkImage}
            onChange={(e) => setWordmarkImage(e.target.value)}
            className={inputCls + " mt-1"}
            placeholder="https://lgixdwopjzuedvqddeig.supabase.co/storage/v1/object/public/product-images/branding/..."
          />
        </div>

        {/* ── 3. BRAND TEXT (fallback / alternative to wordmark) ── */}
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-stone-900 text-white text-xs font-medium">3</span>
            <label className="text-sm tracking-[0.2em] text-stone-900 uppercase font-medium">
              Brand Text <span className="text-stone-400">(used when no wordmark image)</span>
            </label>
          </div>
          <p className="text-xs text-stone-500 mb-3 font-light">
            The brand name as text. Rendered in the site display font with elegant tracking.
            Hidden automatically if a wordmark image (2) is set. Leave empty for a logo-only navbar.
          </p>
          <input
            type="text"
            value={brandText}
            onChange={(e) => setBrandText(e.target.value)}
            maxLength={80}
            className={inputCls}
            placeholder="Shasstore"
          />

          <label className={labelCls + " mt-5"}>Tagline (under the brand name)</label>
          <input
            type="text"
            value={brandSubtext}
            onChange={(e) => setBrandSubtext(e.target.value)}
            maxLength={80}
            className={inputCls}
            placeholder="by shahanas"
          />
          <p className="text-[0.65rem] text-stone-400 mt-1">
            Always rendered as text. Empty = hidden.
          </p>
        </div>

        {/* ── Live preview ── */}
        <div className="border border-stone-200 rounded-sm bg-[var(--color-shas-bg)]">
          <p className="text-[0.65rem] tracking-[0.3em] text-stone-400 uppercase px-4 pt-4">
            Live preview (navbar background)
          </p>
          <div className="px-4 py-5 flex items-center gap-3 min-h-[80px]">
            {logoImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoImage}
                alt={logoAlt || "Logo"}
                className="w-auto object-contain"
                style={{ height: `${previewH}px` }}
              />
            )}
            <div className="flex flex-col leading-none">
              {wordmarkImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={wordmarkImage}
                  alt={logoAlt || brandText || "Brand"}
                  className="w-auto object-contain"
                  style={{ height: `${Math.max(20, Math.round(previewH * 0.7))}px` }}
                />
              ) : (
                brandText && (
                  <span
                    className="font-italiana text-2xl md:text-3xl tracking-[0.32em] uppercase text-black"
                    style={{ fontWeight: 400 }}
                  >
                    {brandText}
                  </span>
                )
              )}
              {brandSubtext && (
                <span className="text-[0.55rem] md:text-[0.6rem] tracking-[0.55em] uppercase mt-1 self-end pr-0.5 text-black/65">
                  {brandSubtext}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Alt text */}
        <div>
          <label className={labelCls}>Alt Text (accessibility)</label>
          <input
            type="text"
            value={logoAlt}
            onChange={(e) => setLogoAlt(e.target.value)}
            maxLength={100}
            className={inputCls}
            placeholder="Shasstore by Shahanas"
          />
          <p className="text-[0.65rem] text-stone-400 mt-1">
            What screen readers announce for the logo / wordmark images. Defaults to brand text.
          </p>
        </div>

        {/* Height */}
        <div>
          <label className={labelCls}>Logo Display Height (px) — desktop</label>
          <input
            type="number"
            value={logoHeight}
            onChange={(e) => setLogoHeight(Number(e.target.value))}
            min={16}
            max={120}
            className={inputCls + " max-w-[160px]"}
          />
          <p className="text-[0.65rem] text-stone-400 mt-1">
            Between 16 and 120. Default 44. Mobile auto-scales to ~80% of this.
            The wordmark image renders at ~70% of this so it sits naturally next to the logo.
          </p>
        </div>

        {/* Save / Cancel */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300"
          >
            {loading ? "Saving…" : "Save Branding"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-4 sm:py-0 border border-stone-200 text-stone-500 text-xs tracking-widest uppercase hover:border-stone-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
