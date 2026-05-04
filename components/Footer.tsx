import Link from "next/link";
import { getShirtStyles, getCompanyContent } from "@/lib/products";

export default async function Footer() {
  const [shirtStyles, company] = await Promise.all([
    getShirtStyles(),
    getCompanyContent(),
  ]);

  const shopLinks = [
    { label: "All Shirts", href: "/products" },
    ...shirtStyles.slice(0, 4).map((style) => ({
      label: style.name,
      href: `/products?category=${encodeURIComponent(style.name)}`,
    })),
  ];

  // Build WhatsApp link from the digits-only number admin already saves.
  const whatsappDigits = (company?.contact_whatsapp ?? "").replace(/\D+/g, "");
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : "";
  const instagramHref = (company?.instagram_url ?? "").trim();
  const facebookHref = (company?.facebook_url ?? "").trim();

  const socials: { label: string; href: string; icon: React.ReactNode }[] = [
    {
      label: "WhatsApp",
      href: whatsappHref,
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24Zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885a9.825 9.825 0 0 0-2.892-7.001 9.825 9.825 0 0 0-6.989-2.91c-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.512 5.262l-.999 3.648 3.976-1.04Zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.298-1.04 1.016-1.04 2.479 0 1.463 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414Z" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      href: instagramHref,
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: facebookHref,
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
          <path d="M24 12.073C24 5.446 18.627.073 12 .073S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854V15.54H7.078v-3.467h3.047V9.43c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.875v2.249h3.328l-.532 3.467h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
        </svg>
      ),
    },
  ].filter((s) => s.href);

  return (
    <footer className="bg-stone-900 text-stone-400 py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">

        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="mb-5">
            <h4 className="text-white text-3xl font-light tracking-widest leading-none"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Shasstore
            </h4>
            <p className="text-stone-400 text-[0.65rem] tracking-[0.5em] uppercase mt-1.5 ml-0.5">
              Fashion
            </p>
          </div>
          <p className="text-stone-500 text-sm font-light leading-relaxed">
            India's premium men's shirt specialist — crafted for comfort, tailored for life.
          </p>
          {socials.length > 0 && (
            <div className="flex gap-3 mt-6">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 flex items-center justify-center text-stone-500 hover:text-white border border-stone-700 hover:border-stone-400 transition-colors duration-300"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Shop Shirts — dynamic */}
        <div>
          <h4 className="text-stone-300 text-xs tracking-[0.25em] uppercase font-medium mb-6">Shop Shirts</h4>
          <ul className="space-y-3">
            {shopLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href}
                  className="text-stone-500 text-sm font-light hover:text-stone-200 transition-colors duration-200">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help */}
        <div>
          <h4 className="text-stone-300 text-xs tracking-[0.25em] uppercase font-medium mb-6">Help</h4>
          <ul className="space-y-3">
            {[
              { label: "Shirt Size Guide", href: "/help#size-guide" },
              { label: "Returns",          href: "/help#returns" },
              { label: "Shipping",         href: "/help#shipping" },
              { label: "FAQ",              href: "/help#faq" },
            ].map((link) => (
              <li key={link.label}>
                <a href={link.href}
                  className="text-stone-500 text-sm font-light hover:text-stone-200 transition-colors duration-200">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company ✅ fixed — <a> → <Link> */}
        <div>
          <h4 className="text-stone-300 text-xs tracking-[0.25em] uppercase font-medium mb-6">Company</h4>
          <ul className="space-y-3">
            {[
              { label: "About Shasstore", href: "/company#about" },
              { label: "Contact Us",   href: "/company#contact" },
            ].map((link) => (
              <li key={link.label}>
                <Link href={link.href}
                  className="text-stone-500 text-sm font-light hover:text-stone-200 transition-colors duration-200">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10 md:mt-16 pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-3">
        <p className="text-stone-600 text-xs tracking-wide">© Shasstore. All rights reserved.</p>
      </div>
    </footer>
  );
}
