"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateHomepageClosingCta } from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";
import type { HomepageContent } from "@/lib/products";

const labelCls = "text-[0.65rem] tracking-[0.3em] text-stone-400 uppercase block mb-2";
const inputCls = "w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors";
const textareaCls = inputCls + " min-h-[80px] resize-y";

export default function ClosingCtaEditClient({ content }: { content: HomepageContent }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateHomepageClosingCta(new FormData(e.currentTarget));
      toast.success("Closing CTA saved", "Final section updated on the homepage.");
      router.refresh();
    } catch (err) {
      toast.error("Could not save", err instanceof Error ? err.message : "");
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
          Closing CTA
        </h1>
        <p className="text-sm text-stone-500 mt-2 font-light">
          The final blush call-to-action at the bottom of the homepage.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white border border-stone-100 p-4 md:p-8 space-y-5">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input name="closing_cta_eyebrow" defaultValue={content.closing_cta_eyebrow} maxLength={80} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Headline (main)</label>
          <input name="closing_cta_title" defaultValue={content.closing_cta_title} maxLength={200} className={inputCls} placeholder="For the woman who's" />
        </div>

        <div>
          <label className={labelCls}>Headline — italic rose-gold accent</label>
          <input name="closing_cta_title_accent" defaultValue={content.closing_cta_title_accent} maxLength={200} className={inputCls} placeholder="already her own muse." />
          <p className="text-[0.65rem] text-stone-400 mt-1">Renders in italic rose-gold next to the main headline.</p>
        </div>

        <div>
          <label className={labelCls}>Subtitle</label>
          <textarea name="closing_cta_subtitle" defaultValue={content.closing_cta_subtitle} maxLength={500} className={textareaCls} rows={2} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Primary Button — Text</label>
            <input name="closing_cta_primary_text" defaultValue={content.closing_cta_primary_text} maxLength={60} className={inputCls} placeholder="Shop the Collection" />
          </div>
          <div>
            <label className={labelCls}>Primary Button — Link</label>
            <input name="closing_cta_primary_link" defaultValue={content.closing_cta_primary_link} maxLength={200} className={inputCls} placeholder="/collection" />
          </div>
          <div>
            <label className={labelCls}>Secondary Button — Text</label>
            <input name="closing_cta_secondary_text" defaultValue={content.closing_cta_secondary_text} maxLength={60} className={inputCls} placeholder="Size & Fit Guide" />
          </div>
          <div>
            <label className={labelCls}>Secondary Button — Link</label>
            <input name="closing_cta_secondary_link" defaultValue={content.closing_cta_secondary_link} maxLength={200} className={inputCls} placeholder="/help" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300"
          >
            {loading ? "Saving…" : "Save Closing CTA"}
          </button>
        </div>
      </form>
    </div>
  );
}
