"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProduct } from "@/lib/actions";
import { Product } from "@/types";
import { Category } from "@/lib/products";
import ImageUploader from "@/components/admin/ImageUploader";
import KeyValueEditor from "@/components/admin/KeyValueEditor";
import BulletEditor from "@/components/admin/BulletEditor";
import PriceFields from "@/components/admin/PriceFields";
import SizeInventoryEditor from "@/components/admin/SizeInventoryEditor";
import { useToast } from "@/components/admin/Toast";
import { validateFeaturedOrder, formatConflictMessage } from "@/lib/admin-validators";

const PRODUCT_DETAIL_PRESETS = [
  "Material composition",
  "Fit type",
  "Sleeve type",
  "Collar style",
  "Length",
  "Neck style",
  "Country of Origin",
];

const STYLE_SPEC_PRESETS = [
  "Colour",
  "Fitting type",
  "Style Name",
  "Neck Style",
  "Sleeve Type",
  "Collar Style",
  "Pattern",
  "Top-style",
  "Season",
  "Apparel Closure Type",
  "Cuff Style",
  "Hemline Form",
  "Apparel Occasion and Lifestyle",
];

export default function EditProductClient({
  product,
  styles,
}: {
  product: Product;
  styles: Category[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [primaryImage, setPrimaryImage] = useState(product.image);

  // Pre-fill extra images from existing product.images (skip index 0 = primary)
  const existingExtras = (product.images ?? []).slice(1);
  const [extraImages, setExtraImages] = useState<string[]>([
    existingExtras[0] ?? "",
    existingExtras[1] ?? "",
    existingExtras[2] ?? "",
  ]);

  // Detail/spec/about state
  const [productDetails, setProductDetails] = useState<Record<string, string>>(
    product.product_details ?? {}
  );
  const [aboutItems, setAboutItems] = useState<string[]>(
    product.about_items ?? []
  );
  const [styleSpecs, setStyleSpecs] = useState<Record<string, string>>(
    product.style_specs ?? {}
  );

  // Top-size inventory — initialize from existing data, fallback to sizes array with 10 stock
  const initialInventory: Record<string, number> = {};
  if (product.size_inventory && Object.keys(product.size_inventory).length > 0) {
    Object.assign(initialInventory, product.size_inventory);
  } else if (product.sizes) {
    product.sizes.forEach((s) => {
      initialInventory[s] = 10; // sensible default
    });
  }
  const [sizeInventory, setSizeInventory] = useState<Record<string, number>>(initialInventory);

  // Bottom-size inventory — same pattern, optional
  const initialBottomInventory: Record<string, number> = {};
  if (product.bottom_size_inventory && Object.keys(product.bottom_size_inventory).length > 0) {
    Object.assign(initialBottomInventory, product.bottom_size_inventory);
  } else if (product.bottom_sizes) {
    product.bottom_sizes.forEach((s) => {
      initialBottomInventory[s] = 10;
    });
  }
  const [bottomSizeInventory, setBottomSizeInventory] = useState<Record<string, number>>(initialBottomInventory);

  function updateExtraImage(index: number, url: string) {
    setExtraImages((prev) => {
      const updated = [...prev];
      updated[index] = url;
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!primaryImage) {
      toast.error("Primary image required", "Please upload a primary image before saving.");
      return;
    }
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    // Inject uploaded image URLs into formData
    formData.set("image", primaryImage);
    const filledExtras = extraImages.filter((img) => img.trim() !== "");
    formData.set("images", JSON.stringify([primaryImage, ...filledExtras]));

    // Inject details/about/specs as JSON
    formData.set("size_inventory", JSON.stringify(sizeInventory));
    formData.set("bottom_size_inventory", JSON.stringify(bottomSizeInventory));
    formData.set("product_details", JSON.stringify(productDetails));
    formData.set("about_items", JSON.stringify(aboutItems));
    formData.set("style_specs", JSON.stringify(styleSpecs));

    // Validate
    const validSizes = Object.entries(sizeInventory).filter(([k]) => k.trim());
    if (validSizes.length === 0) {
      toast.error("Top sizes required", "Add at least one top size with stock quantity.");
      setLoading(false);
      return;
    }

    // Pre-validate featured order against DB (excluding this product)
    const featuredOrderRaw = formData.get("featured_order") as string;
    if (featuredOrderRaw) {
      const result = await validateFeaturedOrder(featuredOrderRaw, product.id);
      if (result && result.available === false) {
        const message = formatConflictMessage("Featured order", featuredOrderRaw, result);
        toast.error("Featured order is taken", message);
        setLoading(false);
        return;
      }
    }

    try {
      await updateProduct(product.id, formData);
      toast.success("Product updated", `"${product.name}" has been saved.`);
      router.push("/shasstorebyshahanas/products");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not save changes. Please try again.";
      toast.error("Could not update product", message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Catalog</p>
        <h1 className="text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Edit Product
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-100 p-8 space-y-6">
        {/* Name */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">Product Name *</label>
          <input name="name" required defaultValue={product.name}
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors" />
        </div>

        {/* Pricing */}
        <PriceFields
          initialPrice={product.price}
          initialOriginalPrice={product.original_price}
        />

        {/* Category */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">Category *</label>
          <select name="category" required defaultValue={product.category}
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 bg-white">
            {styles.map((style) => (
              <option key={style.id} value={style.name}>{style.name}</option>
            ))}
          </select>
        </div>

        {/* Primary Image */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-3">
            Primary Image * <span className="normal-case text-stone-400">(main product photo)</span>
          </label>
          <ImageUploader value={primaryImage} onChange={setPrimaryImage} folder="products" />
        </div>

        {/* Extra Images */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-3">
            Additional Images <span className="normal-case text-stone-400">(up to 3 more)</span>
          </label>
          <div className="space-y-4">
            {extraImages.map((img, i) => (
              <div key={i}>
                <p className="text-xs text-stone-400 mb-2">Image {i + 2}</p>
                <ImageUploader
                  value={img}
                  onChange={(url) => updateExtraImage(i, url)}
                  folder="products"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Top Sizes & Inventory ── */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">
            Top Sizes & Stock *
          </label>
          <p className="text-xs text-stone-400 mb-3">
            Sizes for the top half (top, kurti, blouse). Stock auto-decreases when orders are placed.
          </p>
          <SizeInventoryEditor
            initialData={sizeInventory}
            onChange={setSizeInventory}
          />
        </div>

        {/* ── Bottom Sizes & Inventory (optional) ── */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">
            Bottom Sizes & Stock <span className="normal-case text-stone-400">(optional — only for co-ord sets / pant-paired pieces)</span>
          </label>
          <p className="text-xs text-stone-400 mb-3">
            Sizes for the bottom half (skirt, pants, leggings). Customers will be asked to pick both top and bottom sizes.
          </p>
          <SizeInventoryEditor
            initialData={bottomSizeInventory}
            onChange={setBottomSizeInventory}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">Description *</label>
          <textarea name="description" required rows={4} defaultValue={product.description}
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 resize-none" />
        </div>

        {/* Availability */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">Availability *</label>
          <select name="inStock" defaultValue={product.inStock ? "true" : "false"}
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 bg-white">
            <option value="true">In Stock</option>
            <option value="false">Sold Out</option>
          </select>
        </div>

        {/* Featured Order */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">
            Featured Order{" "}
            <span className="normal-case text-stone-400">(optional — 1 shows first on homepage)</span>
          </label>
          <input name="featured_order" type="number" min="1" max="99"
            defaultValue={product.featuredOrder ?? ""}
            placeholder="Leave empty to not feature"
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors" />
        </div>

        {/* ── Product Details ── */}
        <div className="pt-6 border-t border-stone-100">
          <label className="text-sm tracking-widest uppercase text-stone-700 font-medium block mb-1">
            Product Details
          </label>
          <p className="text-xs text-stone-400 mb-4">
            Spec table shown in the &quot;Product Details&quot; expandable section
          </p>
          <KeyValueEditor
            initialData={productDetails}
            onChange={setProductDetails}
            keyPlaceholder="Field name"
            valuePlaceholder="Value (e.g. 100% Cotton)"
            presets={PRODUCT_DETAIL_PRESETS}
          />
        </div>

        {/* ── About this item ── */}
        <div className="pt-6 border-t border-stone-100">
          <label className="text-sm tracking-widest uppercase text-stone-700 font-medium block mb-1">
            About this item
          </label>
          <p className="text-xs text-stone-400 mb-4">
            Bullet points shown in the &quot;About this item&quot; expandable section
          </p>
          <BulletEditor initialItems={aboutItems} onChange={setAboutItems} />
        </div>

        {/* ── Style Specifications ── */}
        <div className="pt-6 border-t border-stone-100">
          <label className="text-sm tracking-widest uppercase text-stone-700 font-medium block mb-1">
            Style Specifications
          </label>
          <p className="text-xs text-stone-400 mb-4">
            Spec table shown in the &quot;Style Specifications&quot; expandable section
          </p>
          <KeyValueEditor
            initialData={styleSpecs}
            onChange={setStyleSpecs}
            keyPlaceholder="Field name"
            valuePlaceholder="Value"
            presets={STYLE_SPEC_PRESETS}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300">
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-8 border border-stone-200 text-stone-500 text-xs tracking-widest uppercase hover:border-stone-500 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
