"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateHelpContent } from "@/lib/actions";
import type { HelpContent } from "@/lib/products";
import { useToast } from "@/components/admin/Toast";

export default function HelpContentEditClient({ help }: { help: HelpContent }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [faqs, setFaqs] = useState(help.faq);

  function addFaq() {
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  }

  function updateFaq(i: number, field: "question" | "answer", value: string) {
    setFaqs((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      return updated;
    });
  }

  function removeFaq(i: number) {
    setFaqs((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("faq", JSON.stringify(faqs.filter((f) => f.question.trim())));
    try {
      await updateHelpContent(help.id, formData);
      router.refresh();
      toast.success("Help content updated", "Customers will see the changes instantly.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save help content";
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
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={6}
        className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 resize-y"
      />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Admin</p>
        <h1 className="text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Help Content
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-100 p-4 md:p-8 space-y-6">

        {textArea("Size & Fit Guide", "size_guide", help.size_guide)}
        {textArea("Returns Policy", "returns", help.returns)}
        {textArea("Shipping Info", "shipping", help.shipping)}

        {/* FAQ */}
        <div className="border-t border-stone-100 pt-6">
          <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-4">FAQ</p>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-stone-100 p-4 space-y-3">
                <input
                  value={faq.question}
                  onChange={(e) => updateFaq(i, "question", e.target.value)}
                  placeholder="Question"
                  className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500"
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) => updateFaq(i, "answer", e.target.value)}
                  placeholder="Answer"
                  rows={3}
                  className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 resize-none"
                />
                <button type="button" onClick={() => removeFaq(i)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors tracking-widest uppercase">
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addFaq}
            className="mt-4 text-xs tracking-widest uppercase text-stone-500 border border-stone-200 px-4 py-2 hover:border-stone-500 transition-colors">
            + Add FAQ
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-stone-900 text-white py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all disabled:bg-stone-300">
            {loading ? "Saving..." : "Save Changes"}
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
