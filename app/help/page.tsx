import { getHelpContent } from "@/lib/products";

function BulletContent({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return (
      <p className="text-[var(--color-shas-muted)] text-sm font-light italic">
        Content coming soon — your atelier team is curating this.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {lines.map((line, i) => (
        <li key={i} className="flex items-start gap-3 text-[var(--color-shas-muted)] text-sm font-light leading-relaxed">
          <span className="text-[var(--color-shas-rose)] mt-1">✦</span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function HelpPage() {
  const help = await getHelpContent();
  if (!help)
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-shas-bg)]">
        <p className="text-[var(--color-shas-muted)] italic">Content unavailable.</p>
      </div>
    );

  return (
    <div className="bg-[var(--color-shas-bg)] min-h-screen pt-28 md:pt-36 pb-24">
      {/* Editorial header */}
      <div className="max-w-3xl mx-auto px-6 md:px-8 mb-12 md:mb-20 reveal">
        <span className="divider-rose mb-4">Support</span>
        <h1 className="font-display text-5xl md:text-7xl text-[var(--color-shas-plum)] font-light leading-[1.05] mb-4">
          Help <em className="text-[var(--color-shas-rose)]">Centre</em>
        </h1>
        <p className="text-[var(--color-shas-muted)] text-base font-light max-w-xl">
          Everything you need — sizing, returns, shipping, jewellery care. We&apos;re here, and so are real humans on WhatsApp.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-8 space-y-16 md:space-y-20">
        <section id="size-guide" className="scroll-mt-32 reveal">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--color-shas-plum)] font-light mb-6 pb-3 border-b border-[var(--color-shas-line)]">
            Size &amp; Fit Guide
          </h2>
          <BulletContent text={help.size_guide} />
        </section>

        <section id="returns" className="scroll-mt-32 reveal">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--color-shas-plum)] font-light mb-6 pb-3 border-b border-[var(--color-shas-line)]">
            Returns &amp; Exchanges
          </h2>
          <BulletContent text={help.returns} />
        </section>

        <section id="shipping" className="scroll-mt-32 reveal">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--color-shas-plum)] font-light mb-6 pb-3 border-b border-[var(--color-shas-line)]">
            Shipping
          </h2>
          <BulletContent text={help.shipping} />
        </section>

        <section id="faq" className="scroll-mt-32 reveal">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--color-shas-plum)] font-light mb-6 pb-3 border-b border-[var(--color-shas-line)]">
            Frequently Asked
          </h2>
          {help.faq.length === 0 ? (
            <p className="text-[var(--color-shas-muted)] text-sm font-light italic">
              FAQ entries will appear here once added in the admin.
            </p>
          ) : (
            <div className="space-y-4">
              {help.faq.map((item, i) => (
                <details key={i} className="group surface-soft p-5 cursor-pointer">
                  <summary className="flex items-center justify-between list-none">
                    <p className="text-[var(--color-shas-plum)] text-sm md:text-base font-medium pr-4">{item.question}</p>
                    <span className="text-[var(--color-shas-rose)] text-2xl leading-none transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="text-[var(--color-shas-muted)] text-sm font-light leading-relaxed mt-4">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
