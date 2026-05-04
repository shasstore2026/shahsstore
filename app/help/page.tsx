import { getHelpContent } from "@/lib/products";

function BulletContent({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <ul className="space-y-3">
      {lines.map((line, i) => (
        <li key={i} className="flex items-start gap-3 text-stone-500 text-sm font-light leading-relaxed">
          <span className="text-stone-300 mt-1">✦</span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function HelpPage() {
  const help = await getHelpContent();
  if (!help) return <p>Content unavailable.</p>;

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-8">
        <p className="text-xs tracking-[0.4em] text-stone-400 uppercase mb-3">Support</p>
        <h1 className="text-5xl text-stone-900 font-light mb-16"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Help Centre
        </h1>

        {/* Size Guide */}
        <section id="size-guide" className="mb-16 scroll-mt-32">
          <h2 className="text-2xl text-stone-900 font-light mb-6 pb-3 border-b border-stone-100"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Shirt Size Guide
          </h2>
          <BulletContent text={help.size_guide} />
        </section>

        {/* Returns */}
        <section id="returns" className="mb-16 scroll-mt-32">
          <h2 className="text-2xl text-stone-900 font-light mb-6 pb-3 border-b border-stone-100"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Returns Policy
          </h2>
          <BulletContent text={help.returns} />
        </section>

        {/* Shipping */}
        <section id="shipping" className="mb-16 scroll-mt-32">
          <h2 className="text-2xl text-stone-900 font-light mb-6 pb-3 border-b border-stone-100"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Shipping Info
          </h2>
          <BulletContent text={help.shipping} />
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-32">
          <h2 className="text-2xl text-stone-900 font-light mb-6 pb-3 border-b border-stone-100"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            FAQ
          </h2>
          <div className="space-y-6">
            {help.faq.map((item, i) => (
              <div key={i} className="border-b border-stone-100 pb-6">
                <p className="text-stone-800 text-sm font-medium mb-2">{item.question}</p>
                <p className="text-stone-500 text-sm font-light leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
