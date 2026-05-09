"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateHomepageNewArrivals } from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";
import type { HomepageContent } from "@/lib/products";

const labelCls = "text-[0.65rem] tracking-[0.3em] text-stone-400 uppercase block mb-2";
const inputCls = "w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors";
const textareaCls = inputCls + " min-h-[80px] resize-y";

export default function NewArrivalsEditClient({ content }: { content: HomepageContent }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateHomepageNewArrivals(new FormData(e.currentTarget));
      toast.success("Saved", "New Arrivals section updated.");
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
          New Arrivals
        </h1>
        <p className="text-sm text-stone-500 mt-2 font-light">
          The header that sits above the horizontal product carousel directly under the hero.
          Products themselves are pulled automatically from the latest 8 by date — to control which products show, just create them in the catalog.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white border border-stone-100 p-4 md:p-8 space-y-5">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input
            name="new_arrivals_eyebrow"
            defaultValue={content.new_arrivals_eyebrow}
            maxLength={80}
            className={inputCls}
            placeholder="Just In"
          />
        </div>

        <div>
          <label className={labelCls}>Title</label>
          <input
            name="new_arrivals_title"
            defaultValue={content.new_arrivals_title}
            maxLength={200}
            className={inputCls}
            placeholder="New Arrivals"
          />
        </div>

        <div>
          <label className={labelCls}>Subtitle</label>
          <textarea
            name="new_arrivals_subtitle"
            defaultValue={content.new_arrivals_subtitle}
            maxLength={500}
            className={textareaCls}
            rows={2}
            placeholder="Fresh-off-the-loom pieces, just landed at the boutique."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300"
          >
            {loading ? "Saving…" : "Save Section"}
          </button>
        </div>
      </form>
    </div>
  );
}
