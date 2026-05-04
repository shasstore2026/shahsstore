"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMarqueeItems } from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";

export default function MarqueeEditClient({ items }: { items: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [marqueeItems, setMarqueeItems] = useState(items);

  function addItem() {
    setMarqueeItems((prev) => [...prev, ""]);
  }

  function updateItem(i: number, value: string) {
    setMarqueeItems((prev) => {
      const updated = [...prev];
      updated[i] = value;
      return updated;
    });
  }

  function removeItem(i: number) {
    setMarqueeItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function moveItem(i: number, dir: -1 | 1) {
    const newIndex = i + dir;
    if (newIndex < 0 || newIndex >= marqueeItems.length) return;
    setMarqueeItems((prev) => {
      const updated = [...prev];
      [updated[i], updated[newIndex]] = [updated[newIndex], updated[i]];
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const filtered = marqueeItems.filter((item) => item.trim());
      await updateMarqueeItems(filtered);
      router.refresh();
      toast.success("Marquee updated", "Your marquee items are now live.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save marquee items";
      toast.error("Could not save", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Admin</p>
        <h1
          className="text-3xl md:text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Marquee Banner
        </h1>
        <p className="text-sm text-stone-400 mt-2">
          Edit the scrolling text items shown on the dark banner strip on the homepage.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-100 p-4 md:p-8 space-y-6">
        {/* Preview */}
        <div className="bg-stone-900 text-white py-3 overflow-hidden rounded">
          <div className="flex gap-8 whitespace-nowrap animate-marquee text-xs tracking-[0.3em] uppercase font-light">
            {marqueeItems.filter(Boolean).map((text, i) => (
              <span key={i} className="text-stone-400">
                {text} &nbsp; ✦
              </span>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <p className="text-xs tracking-[0.3em] text-stone-400 uppercase">Items</p>
          {marqueeItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-stone-300 w-6 text-center flex-shrink-0">{i + 1}</span>
              <input
                value={item}
                onChange={(e) => updateItem(i, e.target.value)}
                placeholder="e.g. Free Delivery Over ₹2000"
                className="flex-1 border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500"
              />
              <button
                type="button"
                onClick={() => moveItem(i, -1)}
                disabled={i === 0}
                className="text-stone-300 hover:text-stone-600 disabled:opacity-20 text-sm px-1"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(i, 1)}
                disabled={i === marqueeItems.length - 1}
                className="text-stone-300 hover:text-stone-600 disabled:opacity-20 text-sm px-1"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="text-red-300 hover:text-red-500 text-sm px-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="text-xs tracking-widest uppercase text-stone-500 border border-stone-200 px-4 py-2 hover:border-stone-500 transition-colors"
        >
          + Add Item
        </button>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300"
          >
            {loading ? "Saving..." : "Save Marquee"}
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
