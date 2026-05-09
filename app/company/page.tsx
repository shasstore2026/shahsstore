import { getCompanyContent } from "@/lib/products";
import Link from "next/link";

function Bullets({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return (
      <p className="text-[var(--color-shas-muted)] text-sm font-light italic">
        Add your story in the admin.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {lines.map((line, i) => (
        <p key={i} className="text-[var(--color-shas-muted)] text-base font-light leading-relaxed">
          {line}
        </p>
      ))}
    </div>
  );
}

export default async function CompanyPage() {
  const company = await getCompanyContent();
  if (!company)
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-shas-bg)]">
        <p className="text-[var(--color-shas-muted)] italic">Content unavailable.</p>
      </div>
    );

  return (
    <div className="bg-[var(--color-shas-bg)] min-h-screen pt-28 md:pt-36 pb-24">
      {/* Hero — the brand mark, large */}
      <div className="max-w-4xl mx-auto px-6 md:px-8 mb-16 md:mb-24 reveal text-center">
        <span className="divider-rose mb-5">The Atelier</span>
        <h1 className="font-italiana text-6xl md:text-8xl lg:text-9xl text-[var(--color-shas-plum)] tracking-[0.18em] leading-none mb-3 uppercase">
          Shasstore
        </h1>
        <p className="text-[var(--color-shas-rose)] text-xs md:text-sm tracking-[0.55em] uppercase mt-3">
          by shahanas
        </p>
        <p className="font-display italic text-2xl md:text-3xl text-[var(--color-shas-muted)] mt-8 max-w-xl mx-auto leading-snug">
          A boutique for the woman who values
          <br />
          considered design and quiet luxury.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-8 space-y-16 md:space-y-20">
        <section id="about" className="scroll-mt-32 reveal">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--color-shas-plum)] font-light mb-6 pb-3 border-b border-[var(--color-shas-line)]">
            Our Story
          </h2>
          <Bullets text={company.about} />
        </section>

        <section id="contact" className="scroll-mt-32 reveal">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--color-shas-plum)] font-light mb-6 pb-3 border-b border-[var(--color-shas-line)]">
            Get in Touch
          </h2>
          <Bullets text={company.contact} />

          {(company.contact_email || company.contact_whatsapp || company.contact_phone) && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {company.contact_email && (
                <a
                  href={`mailto:${company.contact_email}`}
                  className="surface-soft p-5 group hover:border-[var(--color-shas-rose)] transition-colors"
                >
                  <p className="text-[0.65rem] tracking-[0.35em] uppercase text-[var(--color-shas-rose)]">Email</p>
                  <p className="text-[var(--color-shas-plum)] text-sm mt-2 font-light break-all group-hover:text-[var(--color-shas-rose)] transition-colors">
                    {company.contact_email}
                  </p>
                </a>
              )}
              {company.contact_whatsapp && (
                <a
                  href={`https://wa.me/${company.contact_whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="surface-soft p-5 group hover:border-[var(--color-shas-rose)] transition-colors"
                >
                  <p className="text-[0.65rem] tracking-[0.35em] uppercase text-[var(--color-shas-rose)]">WhatsApp</p>
                  <p className="text-[var(--color-shas-plum)] text-sm mt-2 font-light group-hover:text-[var(--color-shas-rose)] transition-colors">
                    {company.contact_whatsapp}
                  </p>
                </a>
              )}
              {company.contact_phone && (
                <a
                  href={`tel:${company.contact_phone.replace(/\s/g, "")}`}
                  className="surface-soft p-5 group hover:border-[var(--color-shas-rose)] transition-colors"
                >
                  <p className="text-[0.65rem] tracking-[0.35em] uppercase text-[var(--color-shas-rose)]">Call Us</p>
                  <p className="text-[var(--color-shas-plum)] text-sm mt-2 font-light group-hover:text-[var(--color-shas-rose)] transition-colors">
                    {company.contact_phone}
                  </p>
                </a>
              )}
            </div>
          )}
        </section>

        <section className="text-center pt-6 reveal">
          <p className="font-display italic text-xl text-[var(--color-shas-muted)] mb-6">
            Style is a quiet conversation between you and your wardrobe.
          </p>
          <Link href="/collection" className="btn-plum">
            Shop the Collection
          </Link>
        </section>
      </div>
    </div>
  );
}
