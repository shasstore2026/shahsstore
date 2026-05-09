"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateHomepageStory,
  updateHomepageLookbook,
  updateHomepageTestimonials,
  updateHomepageInstagram,
  updateHomepageClosingCta,
  updateHomepageVisibility,
} from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";
import ImageUploader from "@/components/admin/ImageUploader";
import type {
  HomepageContent,
  LookbookImage,
  Testimonial,
} from "@/lib/products";

// ── Reusable bits ────────────────────────────────────────────────────
const labelCls =
  "text-[0.65rem] tracking-[0.3em] text-stone-400 uppercase block mb-2";
const inputCls =
  "w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors";
const textareaCls = inputCls + " min-h-[90px] resize-y";

function SectionShell({
  title,
  hint,
  children,
  defaultOpen = false,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group bg-white border border-stone-100 rounded-sm"
    >
      <summary className="cursor-pointer list-none flex items-center justify-between p-5 md:p-6 hover:bg-stone-50 transition-colors">
        <div>
          <h2
            className="text-xl md:text-2xl text-stone-900 font-light"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {title}
          </h2>
          {hint && (
            <p className="text-xs text-stone-400 mt-1 font-light">{hint}</p>
          )}
        </div>
        <span className="text-stone-400 text-2xl leading-none transition-transform duration-300 group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="px-5 pb-6 md:px-6 md:pb-7 border-t border-stone-100 pt-6">
        {children}
      </div>
    </details>
  );
}

function SaveBar({
  loading,
  label = "Save Section",
}: {
  loading: boolean;
  label?: string;
}) {
  return (
    <div className="flex justify-end mt-6">
      <button
        type="submit"
        disabled={loading}
        className="bg-stone-900 text-white px-8 py-3 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300"
      >
        {loading ? "Saving..." : label}
      </button>
    </div>
  );
}

// ── Visibility toggle row ────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <div>
        <p className="text-sm text-stone-700">{label}</p>
        {hint && <p className="text-xs text-stone-400 mt-0.5 font-light">{hint}</p>}
      </div>
      <span
        className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-stone-900" : "bg-stone-300"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
        <input
          type="checkbox"
          className="absolute inset-0 opacity-0 cursor-pointer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      </span>
    </label>
  );
}

// ── Main editor ──────────────────────────────────────────────────────
export default function HomepageSectionsEditClient({
  content,
}: {
  content: HomepageContent;
}) {
  const router = useRouter();
  const toast = useToast();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Admin</p>
        <h1
          className="text-3xl md:text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Homepage Sections
        </h1>
        <p className="text-sm text-stone-500 mt-2 font-light">
          Edit copy and imagery for every section of the public homepage.
          Each section saves independently.
        </p>
      </div>

      <div className="space-y-4">
        <VisibilityCard initial={content} onSaved={() => router.refresh()} toast={toast} />
        <StoryCard initial={content} onSaved={() => router.refresh()} toast={toast} />
        <LookbookCard initial={content} onSaved={() => router.refresh()} toast={toast} />
        <TestimonialsCard initial={content} onSaved={() => router.refresh()} toast={toast} />
        <InstagramCard initial={content} onSaved={() => router.refresh()} toast={toast} />
        <ClosingCtaCard initial={content} onSaved={() => router.refresh()} toast={toast} />
      </div>
    </div>
  );
}

// ── Section: Visibility ──────────────────────────────────────────────
function VisibilityCard({
  initial,
  onSaved,
  toast,
}: {
  initial: HomepageContent;
  onSaved: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [state, setState] = useState({
    show_usp_strip: initial.show_usp_strip,
    show_categories: initial.show_categories,
    show_featured: initial.show_featured,
    show_story: initial.show_story,
    show_lookbook: initial.show_lookbook,
    show_testimonials: initial.show_testimonials,
    show_instagram: initial.show_instagram,
    show_closing_cta: initial.show_closing_cta,
  });
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      try {
        await updateHomepageVisibility(state);
        toast.success("Visibility saved", "Sections updated on the homepage.");
        onSaved();
      } catch (e) {
        toast.error("Could not save", e instanceof Error ? e.message : "");
      }
    });
  };

  return (
    <SectionShell
      title="Section Visibility"
      hint="Toggle any section off without losing its content."
      defaultOpen
    >
      <div className="divide-y divide-stone-100">
        <Toggle checked={state.show_usp_strip} onChange={(v) => setState({ ...state, show_usp_strip: v })} label="USP Marquee Strip" hint="Plum band scrolling under the hero" />
        <Toggle checked={state.show_categories} onChange={(v) => setState({ ...state, show_categories: v })} label="Shop by Category" hint="4-tile category grid" />
        <Toggle checked={state.show_featured} onChange={(v) => setState({ ...state, show_featured: v })} label="Just Arrived" hint="Featured products grid" />
        <Toggle checked={state.show_story} onChange={(v) => setState({ ...state, show_story: v })} label="Editorial Story" hint="Image + story split" />
        <Toggle checked={state.show_lookbook} onChange={(v) => setState({ ...state, show_lookbook: v })} label="Lookbook" hint="Plum gallery" />
        <Toggle checked={state.show_testimonials} onChange={(v) => setState({ ...state, show_testimonials: v })} label="Testimonials" hint="Customer quotes carousel" />
        <Toggle checked={state.show_instagram} onChange={(v) => setState({ ...state, show_instagram: v })} label="Instagram Strip" hint="6-image grid" />
        <Toggle checked={state.show_closing_cta} onChange={(v) => setState({ ...state, show_closing_cta: v })} label="Closing CTA" hint="Final blush call-to-action" />
      </div>
      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="bg-stone-900 text-white px-8 py-3 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300"
        >
          {pending ? "Saving..." : "Save Visibility"}
        </button>
      </div>
    </SectionShell>
  );
}

// ── Section: Story ──────────────────────────────────────────────────
function StoryCard({
  initial,
  onSaved,
  toast,
}: {
  initial: HomepageContent;
  onSaved: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [image, setImage] = useState(initial.story_image);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("story_image", image);
    try {
      await updateHomepageStory(fd);
      toast.success("Story saved", "Editorial section updated.");
      onSaved();
    } catch (err) {
      toast.error("Could not save", err instanceof Error ? err.message : "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionShell title="Editorial Story" hint="The image + copy split section.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input name="story_eyebrow" defaultValue={initial.story_eyebrow} maxLength={80} className={inputCls} placeholder="Our Story" />
        </div>
        <div>
          <label className={labelCls}>Headline</label>
          <input name="story_title" defaultValue={initial.story_title} maxLength={200} className={inputCls} placeholder="Curated for the moments…" />
        </div>
        <div>
          <label className={labelCls}>Subtitle</label>
          <textarea name="story_subtitle" defaultValue={initial.story_subtitle} maxLength={1000} className={textareaCls} rows={3} placeholder="Every piece in our boutique…" />
        </div>
        <div>
          <label className={labelCls}>Italic accent paragraph</label>
          <textarea name="story_paragraph" defaultValue={initial.story_paragraph} maxLength={1000} className={textareaCls} rows={3} placeholder="From the hand-finished silhouettes…" />
        </div>
        <div>
          <label className={labelCls}>Story Image</label>
          <ImageUploader value={image} onChange={setImage} folder="banners" />
          <p className="text-xs text-stone-400 mt-2 font-light">
            Or paste a URL (Supabase, Unsplash):
          </p>
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className={inputCls + " mt-1"}
            placeholder="https://images.unsplash.com/…"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>CTA Text</label>
            <input name="story_cta_text" defaultValue={initial.story_cta_text} maxLength={60} className={inputCls} placeholder="Shop the Collection" />
          </div>
          <div>
            <label className={labelCls}>CTA Link</label>
            <input name="story_cta_link" defaultValue={initial.story_cta_link} maxLength={200} className={inputCls} placeholder="/collection" />
            <p className="text-[0.65rem] text-stone-400 mt-1">Must start with /</p>
          </div>
        </div>
        <SaveBar loading={loading} />
      </form>
    </SectionShell>
  );
}

// ── Section: Lookbook ────────────────────────────────────────────────
function LookbookCard({
  initial,
  onSaved,
  toast,
}: {
  initial: HomepageContent;
  onSaved: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [items, setItems] = useState<LookbookImage[]>(
    Array.isArray(initial.lookbook_images)
      ? initial.lookbook_images.slice(0, 4)
      : []
  );
  const [loading, setLoading] = useState(false);

  function setItem(i: number, patch: Partial<LookbookImage>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function add() {
    if (items.length >= 4) return;
    setItems((prev) => [...prev, { image: "", link: "/products", label: "" }]);
  }
  function remove(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("lookbook_images", JSON.stringify(items));
    try {
      await updateHomepageLookbook(fd);
      toast.success("Lookbook saved", "Gallery updated.");
      onSaved();
    } catch (err) {
      toast.error("Could not save", err instanceof Error ? err.message : "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionShell title="Lookbook" hint="Up to 4 editorial images. Layout: 1 large + 3 smaller.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input name="lookbook_eyebrow" defaultValue={initial.lookbook_eyebrow} maxLength={80} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Title</label>
          <input name="lookbook_title" defaultValue={initial.lookbook_title} maxLength={200} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Subtitle</label>
          <textarea name="lookbook_subtitle" defaultValue={initial.lookbook_subtitle} maxLength={500} className={textareaCls} rows={2} />
        </div>

        <div>
          <label className={labelCls}>Images ({items.length}/4)</label>
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="border border-stone-200 rounded-sm p-4 space-y-3 bg-stone-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 tracking-widest">#{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="text-red-300 hover:text-red-500 text-xs"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="url"
                  value={item.image}
                  onChange={(e) => setItem(i, { image: e.target.value })}
                  className={inputCls}
                  placeholder="Image URL (https://lgix...supabase.co/... or images.unsplash.com)"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={item.link ?? ""}
                    onChange={(e) => setItem(i, { link: e.target.value })}
                    className={inputCls}
                    placeholder="Link e.g. /products"
                  />
                  <input
                    value={item.label ?? ""}
                    onChange={(e) => setItem(i, { label: e.target.value })}
                    className={inputCls}
                    placeholder="Label e.g. Edit 01"
                  />
                </div>
              </div>
            ))}
          </div>
          {items.length < 4 && (
            <button
              type="button"
              onClick={add}
              className="mt-3 text-xs tracking-widest uppercase text-stone-500 border border-stone-200 px-4 py-2 hover:border-stone-500"
            >
              + Add Image
            </button>
          )}
        </div>

        <SaveBar loading={loading} />
      </form>
    </SectionShell>
  );
}

// ── Section: Testimonials ────────────────────────────────────────────
function TestimonialsCard({
  initial,
  onSaved,
  toast,
}: {
  initial: HomepageContent;
  onSaved: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [items, setItems] = useState<Testimonial[]>(initial.testimonials || []);
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
      toast.success("Testimonials saved", "Customer quotes updated.");
      onSaved();
    } catch (err) {
      toast.error("Could not save", err instanceof Error ? err.message : "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionShell title="Testimonials" hint="Up to 12 quotes — first 3 show on desktop, all swipe through on mobile.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input name="testimonials_eyebrow" defaultValue={initial.testimonials_eyebrow} maxLength={80} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Title</label>
          <input name="testimonials_title" defaultValue={initial.testimonials_title} maxLength={200} className={inputCls} />
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

        <SaveBar loading={loading} />
      </form>
    </SectionShell>
  );
}

// ── Section: Instagram ───────────────────────────────────────────────
function InstagramCard({
  initial,
  onSaved,
  toast,
}: {
  initial: HomepageContent;
  onSaved: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [images, setImages] = useState<string[]>(initial.instagram_images || []);
  const [loading, setLoading] = useState(false);

  function setImg(i: number, value: string) {
    setImages((prev) => prev.map((u, idx) => (idx === i ? value : u)));
  }
  function addImg() {
    if (images.length >= 6) return;
    setImages((prev) => [...prev, ""]);
  }
  function removeImg(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("instagram_images", JSON.stringify(images.filter(Boolean)));
    try {
      await updateHomepageInstagram(fd);
      toast.success("Instagram saved", "Strip updated.");
      onSaved();
    } catch (err) {
      toast.error("Could not save", err instanceof Error ? err.message : "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionShell title="Instagram Strip" hint="6 image URLs + your handle / profile link.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input name="instagram_eyebrow" defaultValue={initial.instagram_eyebrow} maxLength={80} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Title</label>
          <input name="instagram_title" defaultValue={initial.instagram_title} maxLength={200} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Handle</label>
            <input name="instagram_handle" defaultValue={initial.instagram_handle} maxLength={60} className={inputCls} placeholder="@shasstore" />
          </div>
          <div>
            <label className={labelCls}>Profile URL</label>
            <input name="instagram_profile_url" defaultValue={initial.instagram_profile_url} maxLength={500} className={inputCls} placeholder="https://instagram.com/shasstore" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Images ({images.length}/6)</label>
          <div className="space-y-2">
            {images.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-stone-300 w-6 text-center flex-shrink-0">{i + 1}</span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setImg(i, e.target.value)}
                  className={inputCls}
                  placeholder="https://images.unsplash.com/..."
                />
                <button
                  type="button"
                  onClick={() => removeImg(i)}
                  className="text-red-300 hover:text-red-500 text-sm px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {images.length < 6 && (
            <button
              type="button"
              onClick={addImg}
              className="mt-3 text-xs tracking-widest uppercase text-stone-500 border border-stone-200 px-4 py-2 hover:border-stone-500"
            >
              + Add Image
            </button>
          )}
        </div>

        <SaveBar loading={loading} />
      </form>
    </SectionShell>
  );
}

// ── Section: Closing CTA ─────────────────────────────────────────────
function ClosingCtaCard({
  initial,
  onSaved,
  toast,
}: {
  initial: HomepageContent;
  onSaved: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateHomepageClosingCta(new FormData(e.currentTarget));
      toast.success("Closing CTA saved", "Final section updated.");
      onSaved();
    } catch (err) {
      toast.error("Could not save", err instanceof Error ? err.message : "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionShell title="Closing CTA" hint="The final blush call-to-action with two buttons.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input name="closing_cta_eyebrow" defaultValue={initial.closing_cta_eyebrow} maxLength={80} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Headline (main)</label>
          <input name="closing_cta_title" defaultValue={initial.closing_cta_title} maxLength={200} className={inputCls} placeholder="For the woman who's" />
        </div>
        <div>
          <label className={labelCls}>Headline (rose-gold italic accent)</label>
          <input name="closing_cta_title_accent" defaultValue={initial.closing_cta_title_accent} maxLength={200} className={inputCls} placeholder="already her own muse." />
          <p className="text-[0.65rem] text-stone-400 mt-1">Will appear in italic rose-gold next to the headline.</p>
        </div>
        <div>
          <label className={labelCls}>Subtitle</label>
          <textarea name="closing_cta_subtitle" defaultValue={initial.closing_cta_subtitle} maxLength={500} className={textareaCls} rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Primary Button</label>
            <input name="closing_cta_primary_text" defaultValue={initial.closing_cta_primary_text} maxLength={60} className={inputCls} placeholder="Shop the Collection" />
          </div>
          <div>
            <label className={labelCls}>Primary Link</label>
            <input name="closing_cta_primary_link" defaultValue={initial.closing_cta_primary_link} maxLength={200} className={inputCls} placeholder="/products" />
          </div>
          <div>
            <label className={labelCls}>Secondary Button</label>
            <input name="closing_cta_secondary_text" defaultValue={initial.closing_cta_secondary_text} maxLength={60} className={inputCls} placeholder="Size & Fit Guide" />
          </div>
          <div>
            <label className={labelCls}>Secondary Link</label>
            <input name="closing_cta_secondary_link" defaultValue={initial.closing_cta_secondary_link} maxLength={200} className={inputCls} placeholder="/help" />
          </div>
        </div>
        <SaveBar loading={loading} />
      </form>
    </SectionShell>
  );
}
