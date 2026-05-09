"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateHomepageLookbook } from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";
import type { HomepageContent, LookbookImage } from "@/lib/products";
import type { Product } from "@/types";

const labelCls = "text-[0.65rem] tracking-[0.3em] text-stone-400 uppercase block mb-2";
const inputCls = "w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors";
const textareaCls = inputCls + " min-h-[80px] resize-y";

export default function LookbookEditClient({
  content,
  products,
}: {
  content: HomepageContent;
  products: Product[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<LookbookImage[]>(
    Array.isArray(content.lookbook_images) ? content.lookbook_images.slice(0, 4) : []
  );
  const [loading, setLoading] = useState(false);

  function setItem(i: number, patch: Partial<LookbookImage>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function add() {
    if (items.length >= 4) return;
    setItems((prev) => [...prev, { image: "", link: "/collection", label: "" }]);
  }
  function remove(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  /**
   * Picking a product auto-fills image (product.image), link
   * (`/products/{id}`) and label (product name, truncated to 60 chars).
   * The admin can still edit any field after picking.
   */
  function pickProduct(i: number, productId: string) {
    if (!productId) {
      // "(none)" → just clear, leave fields untouched
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setItem(i, {
      image: product.image || "",
      link: `/products/${product.id}`,
      label: product.name.slice(0, 60),
    });
  }

  /** Try to detect which product a tile is currently linked to (so the
   *  dropdown shows the picked product after a save → reload). */
  function detectPickedProduct(item: LookbookImage): string {
    const m = item.link?.match(/\/products\/([0-9a-f-]{36})/i);
    if (!m) return "";
    return products.find((p) => p.id === m[1])?.id ?? "";
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("lookbook_images", JSON.stringify(items));
    try {
      await updateHomepageLookbook(fd);
      toast.success("Lookbook saved", "Gallery updated on the homepage.");
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
          Lookbook
        </h1>
        <p className="text-sm text-stone-500 mt-2 font-light">
          Editorial gallery on the homepage. Up to 4 images. Layout: 1 large + 3 smaller.
          Pick a product from the catalog to auto-fill the tile, or paste a custom image URL.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white border border-stone-100 p-4 md:p-8 space-y-5">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input name="lookbook_eyebrow" defaultValue={content.lookbook_eyebrow} maxLength={80} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Title</label>
          <input name="lookbook_title" defaultValue={content.lookbook_title} maxLength={200} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Subtitle</label>
          <textarea name="lookbook_subtitle" defaultValue={content.lookbook_subtitle} maxLength={500} className={textareaCls} rows={2} />
        </div>

        <div>
          <label className={labelCls}>Tiles ({items.length}/4)</label>
          <div className="space-y-4">
            {items.map((item, i) => {
              const pickedId = detectPickedProduct(item);
              return (
                <div key={i} className="border border-stone-200 rounded-sm p-4 space-y-3 bg-stone-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500 tracking-widest">Tile #{i + 1}</span>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-red-300 hover:text-red-500 text-xs"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Product picker — auto-fills the three fields below */}
                  <div>
                    <label className="text-[0.6rem] tracking-[0.25em] text-stone-400 uppercase block mb-1">
                      Pick from catalog (optional)
                    </label>
                    <select
                      defaultValue={pickedId}
                      onChange={(e) => pickProduct(i, e.target.value)}
                      className={inputCls + " bg-white"}
                    >
                      <option value="">— None / use custom URL below —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ₹{p.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <p className="text-[0.6rem] text-stone-400 mt-1">
                      Picking a product auto-fills the image, link, and label below. You can still edit each field after.
                    </p>
                  </div>

                  <div>
                    <label className="text-[0.6rem] tracking-[0.25em] text-stone-400 uppercase block mb-1">Image URL</label>
                    <input
                      type="url"
                      value={item.image}
                      onChange={(e) => setItem(i, { image: e.target.value })}
                      className={inputCls}
                      placeholder="https://lgix...supabase.co/... or images.unsplash.com/..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[0.6rem] tracking-[0.25em] text-stone-400 uppercase block mb-1">Link</label>
                      <input
                        value={item.link ?? ""}
                        onChange={(e) => setItem(i, { link: e.target.value })}
                        className={inputCls}
                        placeholder="/products/abc-123"
                      />
                    </div>
                    <div>
                      <label className="text-[0.6rem] tracking-[0.25em] text-stone-400 uppercase block mb-1">Label</label>
                      <input
                        value={item.label ?? ""}
                        onChange={(e) => setItem(i, { label: e.target.value })}
                        className={inputCls}
                        placeholder="Edit 01 / product name"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {items.length < 4 && (
            <button
              type="button"
              onClick={add}
              className="mt-3 text-xs tracking-widest uppercase text-stone-500 border border-stone-200 px-4 py-2 hover:border-stone-500"
            >
              + Add Tile
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300"
          >
            {loading ? "Saving…" : "Save Lookbook"}
          </button>
        </div>
      </form>
    </div>
  );
}
