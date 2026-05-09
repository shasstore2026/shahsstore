"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateHeroBanner } from "@/lib/actions";
import type { HeroBanner } from "@/lib/products";
import { Product } from "@/types";
import { useToast } from "@/components/admin/Toast";
import ImageUploader from "@/components/admin/ImageUploader";

const labelCls =
  "text-[0.65rem] tracking-[0.3em] text-stone-400 uppercase block mb-2";
const inputCls =
  "w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors";

/**
 * Hero Banner editor for the new full-bleed editorial design.
 *
 * The image is uploaded directly here — it is NOT pulled from a product.
 * Legacy fields (stats, accent_card_title/price/badge, subtext) are hidden
 * from the UI but preserved as hidden inputs so the server action doesn't
 * blank them — admins can switch back to the old design later by manually
 * editing those rows in Supabase.
 */
export default function HeroBannerEditClient({
  banner,
}: {
  banner: HeroBanner;
  /** kept in signature for backwards-compat with the server page; unused */
  products?: Product[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(banner.main_image ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("main_image", image);

    try {
      await updateHeroBanner(banner.id, formData);
      router.refresh();
      toast.success("Hero banner updated", "Your homepage hero is now live.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not update banner";
      toast.error("Could not update banner", msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Homepage</p>
        <h1
          className="text-3xl md:text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Hero Banner
        </h1>
        <p className="text-sm text-stone-500 mt-2 font-light">
          The full-bleed image at the top of the homepage. Upload a fresh editorial photo
          (not from a product) and choose two short words that flank the model.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-100 p-4 md:p-8 space-y-6">
        {/* ── Hero Image ── */}
        <div>
          <label className={labelCls}>Hero Image *</label>
          <p className="text-xs text-stone-400 mt-1 mb-3 font-light">
            Use a clean editorial shot. Centred subject works best — text appears on either side.
          </p>
          <ImageUploader value={image} onChange={setImage} folder="hero" />
          <p className="text-xs text-stone-400 mt-2 font-light">Or paste a URL:</p>
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className={inputCls + " mt-1"}
            placeholder="https://lgixdwopjzuedvqddeig.supabase.co/storage/v1/object/public/product-images/hero/..."
          />
        </div>

        {/* ── Split-headline words ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Headline — Left Word</label>
            <input
              name="headline_line1"
              defaultValue={banner.headline_line1}
              maxLength={100}
              className={inputCls}
              placeholder="e.g. Summer"
            />
            <p className="text-[0.65rem] text-stone-400 mt-1">One short word works best.</p>
          </div>
          <div>
            <label className={labelCls}>Headline — Right Word</label>
            <input
              name="headline_line2"
              defaultValue={banner.headline_line2}
              maxLength={100}
              className={inputCls}
              placeholder="e.g. Favourites"
            />
          </div>
        </div>

        {/* ── Bottom-left tag + italic accent ── */}
        <div>
          <label className={labelCls}>Bottom-left Tag (Season Label)</label>
          <input
            name="season_label"
            defaultValue={banner.season_label}
            maxLength={100}
            className={inputCls}
            placeholder="e.g. Cotton Essentials"
          />
        </div>

        <div>
          <label className={labelCls}>Italic Accent (optional)</label>
          <input
            name="headline_italic"
            defaultValue={banner.headline_italic}
            maxLength={100}
            className={inputCls}
            placeholder="e.g. crafted with care"
          />
          <p className="text-[0.65rem] text-stone-400 mt-1">
            Renders in italic just under the bottom-left tag.
          </p>
        </div>

        {/* ── CTA destination ── */}
        <div>
          <label className={labelCls}>CTA Link</label>
          <input
            name="accent_card_link"
            defaultValue={banner.accent_card_link || "/collection"}
            maxLength={200}
            className={inputCls}
            placeholder="/collection"
          />
          <p className="text-[0.65rem] text-stone-400 mt-1">
            The bottom-right &ldquo;Shop the Collection &rarr;&rdquo; link target. Must start with /
          </p>
        </div>

        {/* Hidden inputs preserve legacy fields so the server action doesn't blank them */}
        <input type="hidden" name="subtext" value={banner.subtext ?? ""} />
        <input type="hidden" name="stat1_value" value={banner.stat1_value ?? ""} />
        <input type="hidden" name="stat1_label" value={banner.stat1_label ?? ""} />
        <input type="hidden" name="stat2_value" value={banner.stat2_value ?? ""} />
        <input type="hidden" name="stat2_label" value={banner.stat2_label ?? ""} />
        <input type="hidden" name="stat3_value" value={banner.stat3_value ?? ""} />
        <input type="hidden" name="stat3_label" value={banner.stat3_label ?? ""} />
        <input type="hidden" name="accent_card_title" value={banner.accent_card_title ?? ""} />
        <input type="hidden" name="accent_card_price" value={banner.accent_card_price ?? ""} />
        <input type="hidden" name="accent_card_badge" value={banner.accent_card_badge ?? ""} />

        {/* ── Save / Cancel ── */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300"
          >
            {loading ? "Saving…" : "Save Hero Banner"}
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
