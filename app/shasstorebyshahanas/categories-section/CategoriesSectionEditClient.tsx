"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateHomepageCategoriesSection } from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";
import type { HomepageContent } from "@/lib/products";

const labelCls = "text-[0.65rem] tracking-[0.3em] text-stone-400 uppercase block mb-2";
const inputCls = "w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors";

export default function CategoriesSectionEditClient({ content }: { content: HomepageContent }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateHomepageCategoriesSection(new FormData(e.currentTarget));
      toast.success("Saved", "Shop-by-Category section updated.");
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
          Shop by Category
        </h1>
        <p className="text-sm text-stone-500 mt-2 font-light">
          The header that sits above the horizontal category cards on the homepage. Leave any field blank to hide that piece.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white border border-stone-100 p-4 md:p-8 space-y-5">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input
            name="categories_eyebrow"
            defaultValue={content.categories_eyebrow}
            maxLength={80}
            className={inputCls}
            placeholder="Shop by Category"
          />
        </div>

        <div>
          <label className={labelCls}>Title</label>
          <input
            name="categories_title"
            defaultValue={content.categories_title}
            maxLength={200}
            className={inputCls}
            placeholder="For every moment of you"
          />
        </div>

        <div>
          <label className={labelCls}>Title — italic accent word</label>
          <input
            name="categories_title_accent"
            defaultValue={content.categories_title_accent}
            maxLength={80}
            className={inputCls}
            placeholder="moment"
          />
          <p className="text-[0.65rem] text-stone-400 mt-1">
            A single word that appears inside the title above. It will be italicised in rose-gold on the homepage. Leave empty for a plain title.
          </p>
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
