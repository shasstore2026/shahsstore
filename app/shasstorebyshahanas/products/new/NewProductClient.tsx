"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addProduct } from "@/lib/actions";
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

export default function NewProductClient({ styles }: { styles: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [primaryImage, setPrimaryImage] = useState("");
  const [extraImages, setExtraImages] = useState<string[]>(["", "", ""]);
  const [productDetails, setProductDetails] = useState<Record<string, string>>({});
  const [aboutItems, setAboutItems] = useState<string[]>([]);
  const [styleSpecs, setStyleSpecs] = useState<Record<string, string>>({});
  const [sizeInventory, setSizeInventory] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  function updateExtraImage(index: number, url: string) {
    setExtraImages((prev) => {
      const updated = [...prev];
      updated[index] = url;
      return updated;
    });
  }

  function validate(formData: FormData): Record<string, string> {
    const errs: Record<string, string> = {};

    const name = (formData.get("name") as string)?.trim();
    if (!name) errs.name = "Shirt name is required";
    else if (name.length < 3) errs.name = "Name must be at least 3 characters";
    else if (name.length > 100) errs.name = "Name is too long (max 100 chars)";

    const priceStr = formData.get("price") as string;
    const price = parseInt(priceStr);
    if (!priceStr) errs.price = "Current price is required";
    else if (isNaN(price)) errs.price = "Price must be a number";
    else if (price <= 0) errs.price = "Price must be greater than 0";
    else if (price > 1000000) errs.price = "Price seems too high (max ₹10,00,000)";

    const originalPriceStr = formData.get("original_price") as string;
    if (originalPriceStr) {
      const originalPrice = parseInt(originalPriceStr);
      if (isNaN(originalPrice)) errs.original_price = "Original price must be a number";
      else if (originalPrice < 0) errs.original_price = "Original price cannot be negative";
      else if (originalPrice > 0 && originalPrice <= price) errs.original_price = "Original price must be higher than current price";
    }

    const category = (formData.get("category") as string)?.trim();
    if (!category) errs.category = "Please select a shirt style / category";

    if (!primaryImage) errs.primaryImage = "Please upload a primary image";

    const validSizes = Object.entries(sizeInventory).filter(([k]) => k.trim());
    if (validSizes.length === 0) errs.size_inventory = "Add at least one size with stock quantity";
    else if (validSizes.length > 20) errs.size_inventory = "Too many sizes (max 20)";
    else {
      const totalStock = validSizes.reduce((sum, [, qty]) => sum + (qty || 0), 0);
      if (totalStock === 0) errs.size_inventory = "Total stock cannot be zero. Set quantity for at least one size.";
    }

    const description = (formData.get("description") as string)?.trim();
    if (!description) errs.description = "Description is required";
    else if (description.length < 10) errs.description = "Description must be at least 10 characters";
    else if (description.length > 1000) errs.description = "Description is too long (max 1000 chars)";

    const featuredOrderStr = formData.get("featured_order") as string;
    if (featuredOrderStr) {
      const fo = parseInt(featuredOrderStr);
      if (isNaN(fo)) errs.featured_order = "Featured order must be a number";
      else if (fo < 1 || fo > 99) errs.featured_order = "Featured order must be between 1 and 99";
    }

    return errs;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError("");

    const formData = new FormData(e.currentTarget);
    const validationErrors = validate(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setErrors({});
    setLoading(true);

    // Pre-validate featured order against DB
    const featuredOrderRaw = formData.get("featured_order") as string;
    if (featuredOrderRaw) {
      const result = await validateFeaturedOrder(featuredOrderRaw);
      if (result && result.available === false) {
        const message = formatConflictMessage("Featured order", featuredOrderRaw, result);
        setErrors({ featured_order: message });
        toast.error("Featured order is taken", message);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    formData.set("image", primaryImage);
    const filledExtras = extraImages.filter((img) => img.trim() !== "");
    formData.set("images", JSON.stringify([primaryImage, ...filledExtras]));
    formData.set("size_inventory", JSON.stringify(sizeInventory));
    formData.set("product_details", JSON.stringify(productDetails));
    formData.set("about_items", JSON.stringify(aboutItems));
    formData.set("style_specs", JSON.stringify(styleSpecs));
    try {
      const productName = (formData.get("name") as string) ?? "Shirt";
      await addProduct(formData);
      toast.success("Shirt added", `"${productName}" has been added to your store.`);
      router.push("/shasstorebyshahanas/products");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add shirt. Please try again.";
      setSubmitError(message);
      toast.error("Could not add shirt", message);
      console.error(err);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  const errClass = (field: string) =>
    errors[field]
      ? "border-red-400 focus:border-red-500"
      : "border-stone-200 focus:border-stone-500";

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Admin</p>
        <h1 className="text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Add New Shirt
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white border border-stone-100 p-8 space-y-6">
        {/* Submit error banner */}
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <p className="font-medium mb-1">⚠ Could not add shirt</p>
            <p className="text-xs">{submitError}</p>
          </div>
        )}

        {/* Validation errors summary */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
            <p className="font-medium mb-2">⚠ Please fix the following:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              {Object.values(errors).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">Shirt Name *</label>
          <input
            name="name"
            placeholder="e.g. White Oxford Dress Shirt"
            className={`w-full border ${errClass("name")} px-4 py-3 text-sm text-stone-800 focus:outline-none transition-colors`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Pricing */}
        <div>
          <PriceFields />
          {(errors.price || errors.original_price) && (
            <div className="mt-1 space-y-1">
              {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
              {errors.original_price && <p className="text-xs text-red-500">{errors.original_price}</p>}
            </div>
          )}
        </div>

        {/* Category / Category */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">Category / Category *</label>
          <select
            name="category"
            className={`w-full border ${errClass("category")} px-4 py-3 text-sm text-stone-800 focus:outline-none transition-colors bg-white`}
          >
            <option value="">Select category</option>
            {styles.map((style) => (
              <option key={style.id} value={style.name}>{style.name}</option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
        </div>

        {/* Primary Image */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-3">
            Primary Image * <span className="normal-case text-stone-400">(main product photo)</span>
          </label>
          <div className={errors.primaryImage ? "ring-2 ring-red-300 rounded" : ""}>
            <ImageUploader value={primaryImage} onChange={setPrimaryImage} folder="products" />
          </div>
          {errors.primaryImage && <p className="text-xs text-red-500 mt-1">{errors.primaryImage}</p>}
        </div>

        {/* Extra Images */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-3">
            Additional Images <span className="normal-case text-stone-400">(up to 3 more — optional)</span>
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

        {/* Sizes & Inventory */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">
            Sizes & Stock Quantity *
          </label>
          <p className="text-xs text-stone-400 mb-3">
            Add available sizes and stock quantity for each. Stock auto-decreases when orders are placed.
          </p>
          <div className={errors.size_inventory ? "ring-2 ring-red-300 rounded p-2" : ""}>
            <SizeInventoryEditor
              initialData={sizeInventory}
              onChange={setSizeInventory}
            />
          </div>
          {errors.size_inventory && <p className="text-xs text-red-500 mt-1">{errors.size_inventory}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">Description *</label>
          <textarea
            name="description"
            rows={4}
            placeholder="Describe the shirt fabric, fit, and style (min 10 characters)..."
            className={`w-full border ${errClass("description")} px-4 py-3 text-sm text-stone-800 focus:outline-none transition-colors resize-none`}
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
        </div>

        {/* In Stock */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">Availability *</label>
          <select name="inStock"
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors bg-white">
            <option value="true">In Stock</option>
            <option value="false">Sold Out</option>
          </select>
        </div>

        {/* Featured Order */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">
            Featured Order <span className="normal-case text-stone-400">(optional — 1 shows first on homepage)</span>
          </label>
          <input
            name="featured_order"
            type="number"
            min="1"
            max="99"
            placeholder="Leave empty to not feature"
            className={`w-full border ${errClass("featured_order")} px-4 py-3 text-sm text-stone-800 focus:outline-none transition-colors`}
          />
          {errors.featured_order && <p className="text-xs text-red-500 mt-1">{errors.featured_order}</p>}
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
            {loading ? "Adding Shirt..." : "Add Shirt"}
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
