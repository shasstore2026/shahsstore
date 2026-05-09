"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateHomepageInstagram } from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";
import type { HomepageContent } from "@/lib/products";

const labelCls = "text-[0.65rem] tracking-[0.3em] text-stone-400 uppercase block mb-2";
const inputCls = "w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors";

export default function InstagramEditClient({ content }: { content: HomepageContent }) {
  const router = useRouter();
  const toast = useToast();
  const [images, setImages] = useState<string[]>(content.instagram_images || []);
  const [loading, setLoading] = useState(false);

  function setImg(i: number, value: string) {
    setImages((prev) => prev.map((u, idx) => (idx === i ? value : u)));
  }
  function addImg() {
    if (images.length >= 6) return;
    setImages((prev) => [...prev, ""]);
  }
  function removeImg(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("instagram_images", JSON.stringify(images.filter(Boolean)));
    try {
      await updateHomepageInstagram(fd);
      toast.success("Instagram saved", "Strip updated on the homepage.");
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
          Instagram Strip
        </h1>
        <p className="text-sm text-stone-500 mt-2 font-light">
          Six-tile grid above the closing CTA. Add image URLs (Supabase or Unsplash) and your IG profile link.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white border border-stone-100 p-4 md:p-8 space-y-5">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input name="instagram_eyebrow" defaultValue={content.instagram_eyebrow} maxLength={80} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Title</label>
          <input name="instagram_title" defaultValue={content.instagram_title} maxLength={200} className={inputCls} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Handle</label>
            <input name="instagram_handle" defaultValue={content.instagram_handle} maxLength={60} className={inputCls} placeholder="@shasstore" />
          </div>
          <div>
            <label className={labelCls}>Profile URL</label>
            <input name="instagram_profile_url" defaultValue={content.instagram_profile_url} maxLength={500} className={inputCls} placeholder="https://instagram.com/shasstore" />
            <p className="text-[0.65rem] text-stone-400 mt-1">HTTPS only. Tiles will link here when set.</p>
          </div>
        </div>

        <div>
          <label className={labelCls}>Images ({images.length}/6)</label>
          <div className="space-y-2">
            {images.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-stone-300 w-6 text-center flex-shrink-0">{i + 1}</span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setImg(i, e.target.value)}
                  className={inputCls}
                  placeholder="https://images.unsplash.com/..."
                />
                <button
                  type="button"
                  onClick={() => removeImg(i)}
                  className="text-red-300 hover:text-red-500 text-sm px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {images.length < 6 && (
            <button
              type="button"
              onClick={addImg}
              className="mt-3 text-xs tracking-widest uppercase text-stone-500 border border-stone-200 px-4 py-2 hover:border-stone-500"
            >
              + Add Image
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300"
          >
            {loading ? "Saving…" : "Save Instagram"}
          </button>
        </div>
      </form>
    </div>
  );
}
