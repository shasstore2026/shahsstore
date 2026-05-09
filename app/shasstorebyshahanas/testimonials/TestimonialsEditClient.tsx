"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateHomepageTestimonials } from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";
import type { HomepageContent, Testimonial } from "@/lib/products";

const labelCls = "text-[0.65rem] tracking-[0.3em] text-stone-400 uppercase block mb-2";
const inputCls = "w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors";
const textareaCls = inputCls + " min-h-[80px] resize-y";

export default function TestimonialsEditClient({ content }: { content: HomepageContent }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Testimonial[]>(content.testimonials || []);
  const [loading, setLoading] = useState(false);

  function setItem(i: number, patch: Partial<Testimonial>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function add() {
    if (items.length >= 12) return;
    setItems((prev) => [...prev, { quote: "", name: "", place: "" }]);
  }
  function remove(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("testimonials", JSON.stringify(items));
    try {
      await updateHomepageTestimonials(fd);
      toast.success("Testimonials saved", "Customer quotes updated on the homepage.");
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
          Testimonials
        </h1>
        <p className="text-sm text-stone-500 mt-2 font-light">
          Up to 12 quotes — desktop shows the first 3 in a row; mobile is a swipe carousel with dot pagination.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white border border-stone-100 p-4 md:p-8 space-y-5">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input name="testimonials_eyebrow" defaultValue={content.testimonials_eyebrow} maxLength={80} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Title</label>
          <input name="testimonials_title" defaultValue={content.testimonials_title} maxLength={200} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Quotes ({items.length}/12)</label>
          <div className="space-y-4">
            {items.map((t, i) => (
              <div key={i} className="border border-stone-200 rounded-sm p-4 space-y-3 bg-stone-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 tracking-widest">#{i + 1}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-stone-400 hover:text-stone-700 disabled:opacity-30 text-sm">↑</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-stone-400 hover:text-stone-700 disabled:opacity-30 text-sm">↓</button>
                    <button type="button" onClick={() => remove(i)} className="text-red-300 hover:text-red-500 text-xs">Remove</button>
                  </div>
                </div>
                <textarea
                  value={t.quote}
                  onChange={(e) => setItem(i, { quote: e.target.value })}
                  className={textareaCls}
                  rows={3}
                  maxLength={600}
                  placeholder="The dress fit like it was made for me…"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={t.name}
                    onChange={(e) => setItem(i, { name: e.target.value })}
                    className={inputCls}
                    maxLength={80}
                    placeholder="Name e.g. Aanya M."
                  />
                  <input
                    value={t.place}
                    onChange={(e) => setItem(i, { place: e.target.value })}
                    className={inputCls}
                    maxLength={80}
                    placeholder="City e.g. Bengaluru"
                  />
                </div>
              </div>
            ))}
          </div>
          {items.length < 12 && (
            <button
              type="button"
              onClick={add}
              className="mt-3 text-xs tracking-widest uppercase text-stone-500 border border-stone-200 px-4 py-2 hover:border-stone-500"
            >
              + Add Testimonial
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300"
          >
            {loading ? "Saving…" : "Save Testimonials"}
          </button>
        </div>
      </form>
    </div>
  );
}
