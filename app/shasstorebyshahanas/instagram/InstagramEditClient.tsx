"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateHomepageInstagram } from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";
import type { HomepageContent, InstagramPost } from "@/lib/products";

const labelCls = "text-[0.65rem] tracking-[0.3em] text-stone-400 uppercase block mb-2";
const inputCls = "w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors";

export default function InstagramEditClient({ content }: { content: HomepageContent }) {
  const router = useRouter();
  const toast = useToast();
  const [posts, setPosts] = useState<InstagramPost[]>(
    content.instagram_posts.length > 0
      ? content.instagram_posts.slice(0, 6)
      : content.instagram_images.map((image) => ({ image, post_url: "" })).slice(0, 6)
  );
  const [loading, setLoading] = useState(false);

  function setPost(i: number, patch: Partial<InstagramPost>) {
    setPosts((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function addPost() {
    if (posts.length >= 6) return;
    setPosts((prev) => [...prev, { image: "", post_url: "" }]);
  }
  function removePost(i: number) {
    setPosts((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    // Server expects `instagram_posts` as JSON
    fd.set(
      "instagram_posts",
      JSON.stringify(posts.filter((p) => p.image.trim()))
    );
    try {
      await updateHomepageInstagram(fd);
      toast.success("Instagram saved", "Strip updated on the homepage.");
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
          Instagram Strip
        </h1>
        <p className="text-sm text-stone-500 mt-2 font-light">
          Six-tile grid above the closing CTA. Each tile can link to its own
          Instagram post — leave a row&apos;s post URL blank and the tile
          falls back to your profile URL.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white border border-stone-100 p-4 md:p-8 space-y-5">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input name="instagram_eyebrow" defaultValue={content.instagram_eyebrow} maxLength={80} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Title</label>
          <input name="instagram_title" defaultValue={content.instagram_title} maxLength={200} className={inputCls} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Handle</label>
            <input name="instagram_handle" defaultValue={content.instagram_handle} maxLength={60} className={inputCls} placeholder="@shasstore" />
          </div>
          <div>
            <label className={labelCls}>Profile URL (fallback)</label>
            <input name="instagram_profile_url" defaultValue={content.instagram_profile_url} maxLength={500} className={inputCls} placeholder="https://instagram.com/shasstore" />
            <p className="text-[0.65rem] text-stone-400 mt-1">HTTPS only. Tiles without a per-post URL link here.</p>
          </div>
        </div>

        <div>
          <label className={labelCls}>Posts ({posts.length}/6)</label>
          <p className="text-xs text-stone-400 mb-3 font-light">
            For each tile: paste the image URL (must be from images.unsplash.com or your Supabase storage)
            and the Instagram post URL it should link to.
          </p>
          <div className="space-y-4">
            {posts.map((post, i) => (
              <div key={i} className="border border-stone-200 rounded-sm p-4 space-y-3 bg-stone-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 tracking-widest">Tile #{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removePost(i)}
                    className="text-red-300 hover:text-red-500 text-xs"
                  >
                    Remove
                  </button>
                </div>
                <div>
                  <label className="text-[0.6rem] tracking-[0.25em] text-stone-400 uppercase block mb-1">Image URL *</label>
                  <input
                    type="url"
                    value={post.image}
                    onChange={(e) => setPost(i, { image: e.target.value })}
                    className={inputCls}
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>
                <div>
                  <label className="text-[0.6rem] tracking-[0.25em] text-stone-400 uppercase block mb-1">Post URL (optional)</label>
                  <input
                    type="url"
                    value={post.post_url ?? ""}
                    onChange={(e) => setPost(i, { post_url: e.target.value })}
                    className={inputCls}
                    placeholder="https://www.instagram.com/p/abc123/"
                  />
                  <p className="text-[0.6rem] text-stone-400 mt-1">
                    Leave empty to use the profile URL above.
                  </p>
                </div>
              </div>
            ))}
          </div>
          {posts.length < 6 && (
            <button
              type="button"
              onClick={addPost}
              className="mt-3 text-xs tracking-widest uppercase text-stone-500 border border-stone-200 px-4 py-2 hover:border-stone-500"
            >
              + Add Post
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300"
          >
            {loading ? "Saving…" : "Save Instagram"}
          </button>
        </div>
      </form>
    </div>
  );
}
