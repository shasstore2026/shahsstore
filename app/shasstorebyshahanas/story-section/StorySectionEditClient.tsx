"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateHomepageStory } from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";
import ImageUploader from "@/components/admin/ImageUploader";
import type { HomepageContent } from "@/lib/products";

const labelCls = "text-[0.65rem] tracking-[0.3em] text-stone-400 uppercase block mb-2";
const inputCls = "w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors";
const textareaCls = inputCls + " min-h-[90px] resize-y";

export default function StorySectionEditClient({ content }: { content: HomepageContent }) {
  const router = useRouter();
  const toast = useToast();
  const [image, setImage] = useState(content.story_image);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("story_image", image);
    try {
      await updateHomepageStory(fd);
      toast.success("Story saved", "Editorial section updated on the homepage.");
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
          Story Section
        </h1>
        <p className="text-sm text-stone-500 mt-2 font-light">
          The image-and-text editorial split midway down the homepage.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white border border-stone-100 p-4 md:p-8 space-y-5">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input name="story_eyebrow" defaultValue={content.story_eyebrow} maxLength={80} className={inputCls} placeholder="Our Story" />
        </div>

        <div>
          <label className={labelCls}>Headline</label>
          <input name="story_title" defaultValue={content.story_title} maxLength={200} className={inputCls} placeholder="Curated for the moments…" />
        </div>

        <div>
          <label className={labelCls}>Subtitle</label>
          <textarea name="story_subtitle" defaultValue={content.story_subtitle} maxLength={1000} className={textareaCls} rows={3} placeholder="Every piece in our boutique…" />
        </div>

        <div>
          <label className={labelCls}>Italic accent paragraph</label>
          <textarea name="story_paragraph" defaultValue={content.story_paragraph} maxLength={1000} className={textareaCls} rows={3} placeholder="From the hand-finished silhouettes…" />
        </div>

        <div>
          <label className={labelCls}>Story Image</label>
          <ImageUploader value={image} onChange={setImage} folder="banners" />
          <p className="text-xs text-stone-400 mt-2 font-light">Or paste a URL (Supabase / Unsplash):</p>
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className={inputCls + " mt-1"}
            placeholder="https://images.unsplash.com/…"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>CTA Text</label>
            <input name="story_cta_text" defaultValue={content.story_cta_text} maxLength={60} className={inputCls} placeholder="Shop the Collection" />
          </div>
          <div>
            <label className={labelCls}>CTA Link</label>
            <input name="story_cta_link" defaultValue={content.story_cta_link} maxLength={200} className={inputCls} placeholder="/collection" />
            <p className="text-[0.65rem] text-stone-400 mt-1">Must start with /</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300"
          >
            {loading ? "Saving…" : "Save Story Section"}
          </button>
        </div>
      </form>
    </div>
  );
}
