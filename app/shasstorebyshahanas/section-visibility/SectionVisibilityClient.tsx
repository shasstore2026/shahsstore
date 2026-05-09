"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateHomepageVisibility } from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";
import type { HomepageContent } from "@/lib/products";

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

export default function SectionVisibilityClient({ content }: { content: HomepageContent }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState({
    show_usp_strip: content.show_usp_strip,
    show_categories: content.show_categories,
    show_featured: content.show_featured,
    show_story: content.show_story,
    show_lookbook: content.show_lookbook,
    show_testimonials: content.show_testimonials,
    show_instagram: content.show_instagram,
    show_closing_cta: content.show_closing_cta,
  });

  const save = () => {
    startTransition(async () => {
      try {
        await updateHomepageVisibility(state);
        toast.success("Visibility saved", "Section toggles updated on the homepage.");
        router.refresh();
      } catch (e) {
        toast.error("Could not save", e instanceof Error ? e.message : "");
      }
    });
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Homepage</p>
        <h1
          className="text-3xl md:text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Section Visibility
        </h1>
        <p className="text-sm text-stone-500 mt-2 font-light">
          Hide or show any homepage section without losing its content. Edits stay in the DB even when a section is off.
        </p>
      </div>

      <div className="bg-white border border-stone-100 p-4 md:p-8">
        <div className="divide-y divide-stone-100">
          <Toggle checked={state.show_usp_strip}     onChange={(v) => setState({ ...state, show_usp_strip: v })}     label="USP Marquee Strip" hint="Plum band scrolling under the hero" />
          <Toggle checked={state.show_categories}    onChange={(v) => setState({ ...state, show_categories: v })}    label="Shop by Category"  hint="4-tile preview grid (full grid lives at /collection)" />
          <Toggle checked={state.show_featured}      onChange={(v) => setState({ ...state, show_featured: v })}      label="Just Arrived"      hint="Featured products grid (currently hidden in code regardless)" />
          <Toggle checked={state.show_story}         onChange={(v) => setState({ ...state, show_story: v })}         label="Editorial Story"   hint="Image + story split" />
          <Toggle checked={state.show_lookbook}      onChange={(v) => setState({ ...state, show_lookbook: v })}      label="Lookbook"          hint="Plum gallery" />
          <Toggle checked={state.show_testimonials}  onChange={(v) => setState({ ...state, show_testimonials: v })}  label="Testimonials"      hint="Customer quotes carousel" />
          <Toggle checked={state.show_instagram}     onChange={(v) => setState({ ...state, show_instagram: v })}     label="Instagram Strip"   hint="6-image grid" />
          <Toggle checked={state.show_closing_cta}   onChange={(v) => setState({ ...state, show_closing_cta: v })}   label="Closing CTA"       hint="Final blush call-to-action" />
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="bg-stone-900 text-white px-8 py-3 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300"
          >
            {pending ? "Saving…" : "Save Visibility"}
          </button>
        </div>
      </div>
    </div>
  );
}
