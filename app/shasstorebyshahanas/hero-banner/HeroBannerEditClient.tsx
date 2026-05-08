"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateHeroBanner } from "@/lib/actions";
import type { HeroBanner } from "@/lib/products";
import { Product } from "@/types";
import Image from "next/image";
import { useToast } from "@/components/admin/Toast";

export default function HeroBannerEditClient({
  banner,
  products,
}: {
  banner: HeroBanner;
  products: Product[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Try to find the existing product from the saved accent_card_link
  const initialProductId = (() => {
    const match = banner.accent_card_link?.match(/\/products\/([^/?#]+)/);
    return match?.[1] ?? "";
  })();

  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    products.find((p) => p.id === initialProductId) ?? null
  );

  useEffect(() => {
    const product = products.find((p) => p.id === selectedProductId);
    setSelectedProduct(product ?? null);
  }, [selectedProductId, products]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error("Product required", "Please pick a product to display in the accent card.");
      return;
    }
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    // Auto-populate fields from the selected product
    formData.set("accent_card_title", selectedProduct.name);
    formData.set("accent_card_price", `₹${selectedProduct.price.toLocaleString()}`);
    formData.set("accent_card_link", `/products/${selectedProduct.id}`);
    formData.set("main_image", selectedProduct.image);

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

  const field = (label: string, name: string, defaultValue: string, placeholder?: string) => (
    <div>
      <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">{label}</label>
      <input name={name} defaultValue={defaultValue} placeholder={placeholder}
        className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Admin</p>
        <h1 className="text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Edit Hero Banner
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-100 p-4 md:p-8 space-y-6">

        {/* Hero Text */}
        {field("Season Label", "season_label", banner.season_label, "e.g. Spring / Summer 2026")}
        {field("Headline Line 1", "headline_line1", banner.headline_line1, "e.g. Men's Shirts,")}
        {field("Headline Line 2", "headline_line2", banner.headline_line2, "e.g. Refined to")}
        {field("Headline Italic", "headline_italic", banner.headline_italic, "e.g. Perfection.")}

        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">Subtext</label>
          <textarea name="subtext" defaultValue={banner.subtext} rows={3}
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 resize-none" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {field("Stat 1 Value", "stat1_value", banner.stat1_value, "e.g. 50+")}
          {field("Stat 2 Value", "stat2_value", banner.stat2_value, "e.g. 14 Days")}
          {field("Stat 3 Value", "stat3_value", banner.stat3_value, "e.g. ₹2000+")}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {field("Stat 1 Label", "stat1_label", banner.stat1_label, "e.g. Shirt Styles")}
          {field("Stat 2 Label", "stat2_label", banner.stat2_label, "e.g. Free Returns")}
          {field("Stat 3 Label", "stat3_label", banner.stat3_label, "e.g. Free Delivery")}
        </div>

        {/* ── Accent Card ── */}
        <div className="border-t border-stone-100 pt-6 space-y-4">
          <p className="text-xs tracking-[0.3em] text-stone-400 uppercase">Accent Card (Bottom Left)</p>

          {/* Badge Label */}
          {field("Badge Label", "accent_card_badge", banner.accent_card_badge ?? "Best Seller", "e.g. Best Seller, New Arrival")}

          {/* Product Picker */}
          <div>
            <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">
              Pick Product *{" "}
              <span className="normal-case text-stone-400">
                (image, name, price &amp; link auto-fill from product)
              </span>
            </label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 bg-white"
            >
              <option value="">— Select a product —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{p.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Live Preview of selected product */}
          {selectedProduct && (
            <div className="bg-stone-50 border border-stone-100 p-4 rounded">
              <p className="text-xs tracking-widest uppercase text-stone-400 mb-3">Preview</p>
              <div className="flex gap-4 items-center">
                <div className="relative w-20 h-24 bg-stone-100 flex-shrink-0 overflow-hidden">
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-stone-500 tracking-widest uppercase">
                    {banner.accent_card_badge ?? "Best Seller"}
                  </p>
                  <p
                    className="text-stone-800 font-light"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}
                  >
                    {selectedProduct.name}
                  </p>
                  <p className="text-stone-500 text-sm">
                    ₹{selectedProduct.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    Link: /products/{selectedProduct.id}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button type="submit" disabled={loading || !selectedProduct}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300">
            {loading ? "Saving..." : "Save Banner"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-8 py-4 sm:py-0 border border-stone-200 text-stone-500 text-xs tracking-widest uppercase hover:border-stone-500 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
