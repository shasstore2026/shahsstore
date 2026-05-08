"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCategory } from "@/lib/actions";
import { Category } from "@/lib/products";
import { useToast } from "@/components/admin/Toast";
import { validateCategoryOrder, formatConflictMessage } from "@/lib/admin-validators";
import ImageUploader from "@/components/admin/ImageUploader";

export default function EditCategoryClient({ style }: { style: Category }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(style.image);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!image) {
      toast.error("Image required", "Please upload a cover image for this style.");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("image", image);

    // Pre-validate display_order against DB (excluding this style)
    const orderRaw = formData.get("display_order") as string;
    if (orderRaw) {
      const result = await validateCategoryOrder(orderRaw, style.id);
      if (result && result.available === false) {
        const msg = formatConflictMessage("Display order", orderRaw, result);
        toast.error("Display order is taken", msg);
        setLoading(false);
        return;
      }
    }

    try {
      await updateCategory(style.id, formData);
      toast.success("Style updated", `"${style.name}" has been saved.`);
      router.push("/shasstorebyshahanas/categories");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not update style";
      toast.error("Could not update", msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Admin</p>
        <h1 className="text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Edit Category
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-100 p-8 space-y-6">
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">Style Name *</label>
          <input name="name" required defaultValue={style.name}
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors" />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">Short Description *</label>
          <input name="description" required defaultValue={style.description}
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors" />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-3">
            Cover Image * <span className="normal-case text-stone-400">(upload from your device)</span>
          </label>
          <ImageUploader value={image} onChange={setImage} folder="styles" />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">
            Display Order <span className="normal-case text-stone-400">(1 shows first)</span>
          </label>
          <input name="display_order" type="number" min="1"
            defaultValue={style.display_order}
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors" />
        </div>

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase hover:bg-stone-700 disabled:bg-stone-300 transition-all">
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
