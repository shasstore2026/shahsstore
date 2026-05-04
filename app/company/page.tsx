import { getCompanyContent } from "@/lib/products";

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

export default async function CompanyPage() {
  const company = await getCompanyContent();
  if (!company) return <p>Content unavailable.</p>;

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-8">
        <p className="text-xs tracking-[0.4em] text-stone-400 uppercase mb-3">Company</p>
        <div className="mb-16">
          <h1 className="text-5xl text-stone-900 font-light leading-none"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Shasstore
          </h1>
          <p className="text-stone-400 text-sm tracking-[0.5em] uppercase mt-2 ml-1">
            Fashion
          </p>
        </div>

        {/* About */}
        <section id="about" className="mb-16 scroll-mt-32">
          <h2 className="text-2xl text-stone-900 font-light mb-6 pb-3 border-b border-stone-100"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            About Shasstore
          </h2>
          <BulletContent text={company.about} />
        </section>

        {/* Contact */}
        <section id="contact" className="scroll-mt-32">
          <h2 className="text-2xl text-stone-900 font-light mb-6 pb-3 border-b border-stone-100"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Contact Us
          </h2>
          <BulletContent text={company.contact} />

          {(company.contact_email || company.contact_whatsapp || company.contact_phone) && (
            <div className="mt-8 space-y-3">
              {company.contact_email && (
                <a
                  href={`mailto:${company.contact_email}`}
                  className="flex items-center gap-3 text-stone-600 hover:text-stone-900 text-sm transition-colors"
                >
                  <span className="text-xs tracking-widest uppercase text-stone-400 w-24">Email</span>
                  <span className="font-light">{company.contact_email}</span>
                </a>
              )}
              {company.contact_whatsapp && (
                <a
                  href={`https://wa.me/${company.contact_whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-stone-600 hover:text-stone-900 text-sm transition-colors"
                >
                  <span className="text-xs tracking-widest uppercase text-stone-400 w-24">WhatsApp</span>
                  <span className="font-light">{company.contact_whatsapp}</span>
                </a>
              )}
              {company.contact_phone && (
                <a
                  href={`tel:${company.contact_phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 text-stone-600 hover:text-stone-900 text-sm transition-colors"
                >
                  <span className="text-xs tracking-widest uppercase text-stone-400 w-24">Call Us</span>
                  <span className="font-light">{company.contact_phone}</span>
                </a>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
