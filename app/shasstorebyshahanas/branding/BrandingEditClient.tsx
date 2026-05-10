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

/**
 * Site Branding editor — currently holds the navbar logo image.
 *
 * The logo replaces the SHASSTORE / BY SHAHANAS wordmark in the navbar
 * when set. Leave empty to revert to the wordmark.
 */
export default function BrandingEditClient({
  branding,
}: {
  branding: SiteBranding;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [logoImage, setLogoImage] = useState(branding.logo_image ?? "");
  const [logoAlt, setLogoAlt] = useState(branding.logo_alt ?? "Shasstore");
  const [logoHeight, setLogoHeight] = useState<number>(branding.logo_height_px || 44);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("logo_image", logoImage);
    formData.set("logo_alt", logoAlt);
    formData.set("logo_height_px", String(logoHeight));

    try {
      await updateSiteBranding(branding.id, formData);
      router.refresh();
      toast.success("Branding updated", "Your navbar logo is now live.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not update branding";
      toast.error("Could not update branding", msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Site Control</p>
        <h1
          className="text-3xl md:text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Brand Logo
        </h1>
        <p className="text-sm text-stone-500 mt-2 font-light">
          Upload a single image containing your logo + brand name. It replaces
          the &ldquo;SHASSTORE / BY SHAHANAS&rdquo; wordmark in the navbar on every page.
          Leave empty to keep the text wordmark.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-100 p-4 md:p-8 space-y-6">
        {/* Logo Image */}
        <div>
          <label className={labelCls}>Logo Image (PNG with transparent background works best)</label>
          <p className="text-xs text-stone-400 mt-1 mb-3 font-light">
            Recommended: a wide image (e.g. 600&times;200 or wider) with the full brand mark.
            Transparent PNG renders cleanly on the cream navbar background.
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

        {/* Live preview */}
        {logoImage && (
          <div className="border border-stone-200 rounded-sm p-4 bg-[var(--color-shas-bg)]">
            <p className="text-[0.65rem] tracking-[0.3em] text-stone-400 uppercase mb-3">
              Preview (navbar background)
            </p>
            <div className="flex items-center justify-start" style={{ height: `${logoHeight}px` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoImage}
                alt={logoAlt || "Logo"}
                style={{ height: `${logoHeight}px`, width: "auto" }}
              />
            </div>
          </div>
        )}

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
            What screen readers announce. Keep it short and natural.
          </p>
        </div>

        {/* Height */}
        <div>
          <label className={labelCls}>Display Height (px) — desktop</label>
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
