"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addShirtStyle } from "@/lib/actions";
import ImageUploader from "@/components/admin/ImageUploader";
import { useToast } from "@/components/admin/Toast";
import { validateStyleOrder, formatConflictMessage } from "@/lib/admin-validators";

export default function NewShirtStylePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!image) {
      toast.error("Image required", "Please upload a cover image for this style.");
      return;
    }
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("image", image);
    const styleName = (formData.get("name") as string) ?? "Style";

    // Pre-validate display_order
    const orderRaw = formData.get("display_order") as string;
    if (orderRaw) {
      const result = await validateStyleOrder(orderRaw);
      if (result && result.available === false) {
        const msg = formatConflictMessage("Display order", orderRaw, result);
        toast.error("Display order is taken", msg);
        setLoading(false);
        return;
      }
    }

    try {
      await addShirtStyle(formData);
      toast.success("Style added", `"${styleName}" has been added.`);
      router.push("/ashrafckvnradmin/shirt-styles");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not add style";
      toast.error("Could not add style", msg);
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
          Add Shirt Style
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-100 p-8 space-y-6">
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">Style Name *</label>
          <input name="name" required placeholder="e.g. Formal Shirts"
            className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-500" />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">Short Description *</label>
          <input name="description" required placeholder="e.g. Boardroom ready"
            className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-500" />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-3">
            Image * <span className="normal-case text-stone-400">(style cover photo)</span>
          </label>
          <ImageUploader value={image} onChange={setImage} folder="styles" />
        </div>

        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">
            Display Order <span className="normal-case text-stone-400">(1 shows first)</span>
          </label>
          <input name="display_order" type="number" min="1" defaultValue={1}
            className="w-full border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-500" />
        </div>

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase hover:bg-stone-700 disabled:bg-stone-300 transition-all">
            {loading ? "Adding..." : "Add Style"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-8 border border-stone-200 text-stone-500 text-xs tracking-widest uppercase hover:border-stone-500">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
