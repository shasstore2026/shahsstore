import Link from "next/link";
import { getCompanyContent } from "@/lib/products";

export default async function OrderSuccessPage() {
  const company = await getCompanyContent();
  const email = company?.contact_email ?? "";
  const whatsapp = company?.contact_whatsapp ?? "";
  const phone = company?.contact_phone ?? "";

  const channels = [
    email && {
      key: "email",
      label: "Email",
      href: `mailto:${email}`,
      svg: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      ),
    },
    whatsapp && {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/${whatsapp.replace(/\D/g, "")}`,
      external: true,
      svg: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6.45 3.094 1.227 4.366l-1.18 4.31 4.39-1.158a8.94 8.94 0 004.41 1.123h.005c4.97 0 9.01-4.04 9.01-9.005 0-2.402-.94-4.66-2.64-6.36a8.95 8.95 0 00-6.37-2.643c-4.97 0-9.01 4.04-9.01 9.005zM7.46 8.27c.13-.36.26-.37.38-.37h.32c.1 0 .26.04.4.39.15.39.5 1.36.55 1.46.05.1.08.21.02.34l-.16.27c-.06.1-.13.21-.27.34l-.16.17c-.13.13-.27.27-.12.53.16.27.7 1.16 1.5 1.88 1.04.92 1.91 1.21 2.18 1.34.27.13.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.22.61-.13.25.09 1.59.75 1.86.89.27.13.45.2.52.32.07.11.07.65-.16 1.28-.23.63-1.34 1.21-1.84 1.28-.5.07-.94.07-1.45-.09-.51-.16-2.27-.84-3.45-2.04-1.57-1.6-2.62-3.55-2.74-3.74-.13-.18-.7-.93-.7-1.78 0-.84.44-1.27.6-1.45z" />
      ),
    },
    phone && {
      key: "phone",
      label: "Call Us",
      href: `tel:${phone.replace(/\s/g, "")}`,
      svg: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      ),
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    href: string;
    external?: boolean;
    svg: React.ReactNode;
  }>;

  return (
    <div className="bg-[var(--color-shas-bg)] min-h-screen flex items-center justify-center px-4 pt-24 pb-16 relative overflow-hidden">
      {/* Soft ambient circles */}
      <div aria-hidden className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--color-shas-blush)]/40 blur-3xl pointer-events-none" />
      <div aria-hidden className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[var(--color-shas-cream)]/60 blur-3xl pointer-events-none" />

      <div className="text-center max-w-xl reveal relative z-10">
        {/* Animated check */}
        <div className="relative w-24 h-24 mx-auto mb-10">
          <div aria-hidden className="absolute inset-0 rounded-full bg-[var(--color-shas-rose)]/15 animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-[var(--color-shas-rose)] flex items-center justify-center shadow-[0_15px_40px_-10px_rgba(201,162,125,0.5)]">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <span className="divider-rose mb-5">Confirmed</span>

        <h1 className="font-display text-4xl md:text-6xl text-[var(--color-shas-plum)] font-light mb-4 leading-tight">
          Your order is on its way <em className="text-[var(--color-shas-rose)]">✦</em>
        </h1>

        <p className="text-[var(--color-shas-muted)] text-base md:text-lg font-light leading-relaxed mb-10 max-w-md mx-auto">
          Thank you. We&apos;re wrapping your pieces with care — we&apos;ll send updates on WhatsApp and email so you know exactly when to expect them.
        </p>

        {channels.length > 0 && (
          <>
            <p className="text-[0.65rem] tracking-[0.35em] uppercase text-[var(--color-shas-muted)] mb-5">
              Need anything? We&apos;re a message away
            </p>
            <div className="flex justify-center gap-5 sm:gap-7 mb-12 flex-wrap">
              {channels.map(({ key, label, href, external, svg }) => (
                <a
                  key={key}
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex flex-col items-center gap-2.5 w-24"
                >
                  <span className="w-14 h-14 rounded-full border border-[var(--color-shas-line-strong)] flex items-center justify-center bg-white group-hover:border-[var(--color-shas-rose)] group-hover:bg-[var(--color-shas-blush)]/30 transition-all duration-300">
                    <svg className="w-5 h-5 text-[var(--color-shas-plum)] group-hover:text-[var(--color-shas-rose)] transition-colors" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      {svg}
                    </svg>
                  </span>
                  <span className="text-[0.65rem] text-[var(--color-shas-muted)] tracking-[0.25em] uppercase group-hover:text-[var(--color-shas-rose)] transition-colors">
                    {label}
                  </span>
                </a>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/collection" className="btn-plum">
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-[var(--color-shas-line-strong)] text-[var(--color-shas-plum)] px-10 py-4 text-xs tracking-[0.3em] uppercase font-medium hover:border-[var(--color-shas-rose)] hover:text-[var(--color-shas-rose)] transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
