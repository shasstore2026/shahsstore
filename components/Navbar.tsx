"use client";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import SearchModal from "@/components/SearchModal";

type Category = {
  id: string;
  name: string;
  display_order: number;
};

type Branding = {
  logo_image: string;
  wordmark_image: string;
  brand_text: string;
  brand_subtext: string;
  logo_alt: string;
  logo_height_px: number;
};

export default function Navbar({
  initialBranding = null,
}: {
  /** Server-prefetched branding so the logo renders on first paint. */
  initialBranding?: Branding | null;
}) {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [branding, setBranding] = useState<Branding | null>(initialBranding);
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isProductsPage = pathname.startsWith("/products");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCats() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) return;
        const data = await res.json();
        setCategories(data);
      } catch {
        // Silently fall back to showing only the "Categories" link
      }
    }
    fetchCats();
  }, []);

  // Check if top notification is visible to adjust navbar position
  useEffect(() => {
    fetch("/api/top-notification")
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled && data.items?.length > 0) setNotificationVisible(true);
      })
      .catch(() => {});
  }, []);

  // Fetch site branding only when the server didn't prefetch it
  // (e.g. on routes where the prop wasn't passed). When server-prefetched
  // the logo paints with the first frame — no flash, no spinner, no extra
  // network round-trip.
  useEffect(() => {
    if (initialBranding) return;
    fetch("/api/branding")
      .then((res) => res.json())
      .then((data: Branding) => setBranding(data))
      .catch(() => {});
  }, [initialBranding]);

  const isTransparent = isHome && !scrolled;

  // First nav item → /collection (full category-card page), then the
  // first four categories as direct filter links into /products.
  const dynamicLinks: Record<string, string> = {
    "Categories": "/collection",
  };
  categories.slice(0, 4).forEach((cat) => {
    dynamicLinks[cat.name] = `/products?category=${encodeURIComponent(cat.name)}`;
  });

  return (
    <>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <nav
        className={`fixed left-0 right-0 z-40 transition-[background-color,box-shadow,border-color,backdrop-filter] duration-500 ${
          isTransparent
            ? "bg-transparent"
            : "bg-[var(--color-shas-bg)]/85 backdrop-blur-md shadow-[0_1px_0_var(--color-shas-line)]"
        }`}
        style={{ top: notificationVisible ? "var(--top-bar-height, 0px)" : "0px" }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-5 flex justify-between items-center gap-6">
          {/* Logo / Brand — composed from up to three independent slots
              (any combination is valid):
                · branding.logo_image      — symbol/mark on the left
                · branding.wordmark_image  — brand name as image
                · branding.brand_text      — brand name as text (used when
                                              wordmark_image is empty)
                · branding.brand_subtext   — small tagline beneath
              When the admin hasn't set anything (or branding hasn't loaded
              yet) we fall back to the original SHASSTORE / BY SHAHANAS
              wordmark so the navbar never looks empty. */}
          <Link
            href="/"
            aria-label={branding?.logo_alt || branding?.brand_text || "Shasstore — Home"}
            className="flex items-center gap-3 leading-none text-black"
            style={{ ['--logo-h' as string]: `${branding?.logo_height_px || 44}px` }}
          >
            {/* (1) Logo mark */}
            {branding?.logo_image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={branding.logo_image}
                alt={branding.logo_alt || branding.brand_text || "Logo"}
                className="w-auto h-[calc(var(--logo-h)*0.8)] md:h-[var(--logo-h)] max-h-[60px] md:max-h-[80px] object-contain"
              />
            )}

            {/* (2/3) Wordmark image OR brand text + (optional) tagline */}
            {(() => {
              // No branding loaded yet OR all slots empty → fall back to wordmark
              const hasAnyBrand =
                !!(branding?.logo_image || branding?.wordmark_image || branding?.brand_text);
              if (!hasAnyBrand) {
                return (
                  <span className="flex flex-col leading-none">
                    <span
                      className="font-italiana text-2xl md:text-3xl tracking-[0.32em] uppercase"
                      style={{ fontWeight: 400 }}
                    >
                      Shasstore
                    </span>
                    <span className="text-[0.55rem] md:text-[0.6rem] tracking-[0.55em] uppercase mt-1 self-end pr-0.5 text-black/65">
                      by shahanas
                    </span>
                  </span>
                );
              }
              return (
                <span className="flex flex-col leading-none">
                  {branding?.wordmark_image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={branding.wordmark_image}
                      alt={branding.logo_alt || branding.brand_text || "Brand"}
                      className="w-auto h-[calc(var(--logo-h)*0.56)] md:h-[calc(var(--logo-h)*0.7)] max-h-[44px] md:max-h-[56px] object-contain"
                    />
                  ) : (
                    branding?.brand_text && (
                      <span
                        className="font-italiana text-2xl md:text-3xl tracking-[0.32em] uppercase"
                        style={{ fontWeight: 400 }}
                      >
                        {branding.brand_text}
                      </span>
                    )
                  )}
                  {branding?.brand_subtext && (
                    <span className="text-[0.55rem] md:text-[0.6rem] tracking-[0.55em] uppercase mt-1 self-end pr-0.5 text-black/65">
                      {branding.brand_subtext}
                    </span>
                  )}
                </span>
              );
            })()}
          </Link>

          {/* Desktop Nav — always black, hover rose */}
          {!isProductsPage && (
            <div className="hidden md:flex gap-8 lg:gap-10 text-[0.7rem] font-medium tracking-[0.28em] uppercase text-black/75">
              {Object.keys(dynamicLinks).map((item) => (
                <Link
                  key={item}
                  href={dynamicLinks[item]}
                  className="relative group pb-1 transition-colors duration-300 hover:text-[var(--color-shas-rose)]"
                >
                  {item}
                  <span className="absolute bottom-0 left-0 w-0 h-px bg-[var(--color-shas-rose)] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>
          )}

          {/* Right Icons — always black */}
          <div className="flex items-center gap-4 md:gap-5 text-black">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hover:text-[var(--color-shas-rose)] transition-colors"
              aria-label="Search"
            >
              <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>

            {/* Wishlist (visual only — to be wired later) */}
            <button
              aria-label="Wishlist"
              className="hidden sm:inline-flex hover:text-[var(--color-shas-rose)] transition-colors"
              onClick={() => {
                // Placeholder — admin will wire wishlist later
              }}
            >
              <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>

            {/* Cart */}
            <Link href="/cart" className="relative group" aria-label="Shopping bag">
              <svg className="h-[22px] w-[22px] group-hover:text-[var(--color-shas-rose)] transition-colors" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
              </svg>
              {totalItems > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 bg-[var(--color-shas-rose)] text-white text-[10px] font-medium rounded-full h-[18px] min-w-[18px] px-1 flex items-center justify-center leading-none"
                >
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile toggle */}
            {!isProductsPage && (
              <button
                className="md:hidden"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"}
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && !isProductsPage && (
          <div className="md:hidden bg-[var(--color-shas-bg)] border-t border-[var(--color-shas-line)] px-5 py-7 flex flex-col gap-5 animate-fade-in">
            {Object.keys(dynamicLinks).map((item) => (
              <Link
                key={item}
                href={dynamicLinks[item]}
                onClick={() => setMenuOpen(false)}
                className="text-shas-plum hover:text-[var(--color-shas-rose)] text-xs tracking-[0.3em] uppercase font-medium transition-colors"
              >
                {item}
              </Link>
            ))}
            <button
              onClick={() => { setMenuOpen(false); setSearchOpen(true); }}
              className="text-left text-shas-plum hover:text-[var(--color-shas-rose)] text-xs tracking-[0.3em] uppercase font-medium transition-colors"
            >
              Search
            </button>
            <Link
              href="/help"
              onClick={() => setMenuOpen(false)}
              className="text-shas-muted hover:text-[var(--color-shas-rose)] text-xs tracking-[0.3em] uppercase font-medium transition-colors"
            >
              Help & Support
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}
