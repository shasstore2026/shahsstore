"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCompanyContent } from "@/lib/actions";
import type { CompanyContent } from "@/lib/products";
import { useToast } from "@/components/admin/Toast";

export default function CompanyContentEditClient({ company }: { company: CompanyContent }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateCompanyContent(company.id, formData);
      router.refresh();
      toast.success("Company content updated", "About and contact pages are now live.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save company content";
      toast.error("Could not save", msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const textArea = (label: string, name: string, defaultValue: string) => (
    <div>
      <label className="text-xs tracking-widest uppercase text-stone-500 block mb-1">{label}</label>
      <p className="text-xs text-stone-400 mb-2">One point per line — each line shows as a bullet</p>
      <textarea name={name} defaultValue={defaultValue} rows={8}
        className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 resize-y" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Admin</p>
        <h1 className="text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Company Content
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-100 p-8 space-y-6">
        {textArea("About Shasstore", "about", company.about)}
        {textArea("Contact Us — Intro", "contact", company.contact)}

        <div className="space-y-4 pt-2 border-t border-stone-100">
          <p className="text-xs tracking-widest uppercase text-stone-500 pt-4">Direct Contact</p>
          <p className="text-xs text-stone-400 -mt-2">
            Used for the Contact Us section and the order-confirmation icons (email, WhatsApp, call).
          </p>

          <div>
            <label className="text-xs tracking-widest uppercase text-stone-500 block mb-1">Email</label>
            <input
              type="email"
              name="contact_email"
              defaultValue={company.contact_email}
              maxLength={120}
              placeholder="support@shasstorefashion.com"
              className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500"
            />
          </div>

          <div>
            <label className="text-xs tracking-widest uppercase text-stone-500 block mb-1">WhatsApp Number</label>
            <p className="text-xs text-stone-400 mb-1">Include country code, digits only — e.g. 919876543210</p>
            <input
              type="tel"
              name="contact_whatsapp"
              defaultValue={company.contact_whatsapp}
              maxLength={30}
              placeholder="919876543210"
              className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500"
            />
          </div>

          <div>
            <label className="text-xs tracking-widest uppercase text-stone-500 block mb-1">Call Us Number</label>
            <p className="text-xs text-stone-400 mb-1">Shown on the contact page and used for the call button</p>
            <input
              type="tel"
              name="contact_phone"
              defaultValue={company.contact_phone}
              maxLength={30}
              placeholder="+91 98765 43210"
              className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-stone-100">
          <p className="text-xs tracking-widest uppercase text-stone-500 pt-4">Social Links</p>
          <p className="text-xs text-stone-400 -mt-2">
            Shown as icons in the footer. Leave empty to hide an icon. WhatsApp uses the number above.
          </p>

          <div>
            <label className="text-xs tracking-widest uppercase text-stone-500 block mb-1">Instagram URL</label>
            <input
              type="url"
              name="instagram_url"
              defaultValue={company.instagram_url}
              maxLength={500}
              placeholder="https://instagram.com/shasstorefashion"
              className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500"
            />
          </div>

          <div>
            <label className="text-xs tracking-widest uppercase text-stone-500 block mb-1">Facebook URL</label>
            <input
              type="url"
              name="facebook_url"
              defaultValue={company.facebook_url}
              maxLength={500}
              placeholder="https://facebook.com/shasstorefashion"
              className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500"
            />
          </div>
        </div>

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
