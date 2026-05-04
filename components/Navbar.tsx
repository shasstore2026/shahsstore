"use client";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import SearchModal from "@/components/SearchModal";

type ShirtStyle = {
  id: string;
  name: string;
  display_order: number;
};

export default function Navbar() {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shirtStyles, setShirtStyles] = useState<ShirtStyle[]>([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isProductsPage = pathname.startsWith("/products");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch shirt styles on mount
  useEffect(() => {
    async function fetchStyles() {
      try {
        const res = await fetch("/api/shirt-styles");
        if (!res.ok) return;
        const data = await res.json();
        setShirtStyles(data);
      } catch {
        // Silently fall back to showing only "All Shirts" link
      }
    }
    fetchStyles();
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

  const isTransparent = isHome && !scrolled;

  // Build nav links: "All Shirts" fixed first, then first 4 shirt styles dynamically
  const dynamicLinks: Record<string, string> = {
    "All Shirts": "/products",
  };
  shirtStyles.slice(0, 4).forEach((style) => {
    dynamicLinks[style.name] = `/products?category=${encodeURIComponent(style.name)}`;
  });

  return (
    <>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <nav
        className={`fixed left-0 right-0 z-40 transition-[background-color,box-shadow,border-color] duration-500 ${
          isTransparent
            ? "bg-transparent"
            : "bg-white/95 backdrop-blur-sm shadow-sm border-b border-stone-100"
        }`}
        style={{ top: notificationVisible ? "var(--top-bar-height, 0px)" : "0px" }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-5 flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            aria-label="Shasstore — Home"
            className="flex flex-col leading-none text-stone-900"
          >
            <span
              className="text-2xl md:text-3xl tracking-[0.25em] uppercase"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
            >
              Shasstore
            </span>
            <span className="text-[0.6rem] md:text-xs tracking-[0.5em] uppercase text-stone-500 mt-0.5 self-end pr-0.5">
              Fashion
            </span>
          </Link>

          {/* Desktop Nav — hidden on /products pages */}
          {!isProductsPage && (
            <div className="hidden md:flex gap-10 text-xs font-medium tracking-[0.2em] uppercase text-stone-500">
              {Object.keys(dynamicLinks).map((item) => (
                <Link
                  key={item}
                  href={dynamicLinks[item]}
                  className="hover:text-stone-900 transition-colors duration-300 relative group pb-0.5"
                >
                  {item}
                  <span className="absolute bottom-0 left-0 w-0 h-px bg-stone-400 transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>
          )}

          {/* Right Icons */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="text-stone-400 hover:text-stone-900 transition-colors"
              aria-label="Search"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>

            {/* Cart */}
            <Link href="/cart" className="relative group" aria-label="Shopping cart">
              <svg className="h-6 w-6 text-stone-400 group-hover:text-stone-900 transition-colors" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-stone-800 text-white text-[10px] font-medium rounded-full h-[18px] w-[18px] flex items-center justify-center leading-none">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile toggle */}
            {!isProductsPage && (
              <button
                className="md:hidden text-stone-500"
                onClick={() => setMenuOpen(!menuOpen)}
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
          <div className="md:hidden bg-white border-t border-stone-100 px-4 py-6 flex flex-col gap-5">
            {Object.keys(dynamicLinks).map((item) => (
              <Link
                key={item}
                href={dynamicLinks[item]}
                onClick={() => setMenuOpen(false)}
                className="text-stone-500 hover:text-stone-900 text-xs tracking-[0.2em] uppercase font-medium transition-colors"
              >
                {item}
              </Link>
            ))}
            <button
              onClick={() => { setMenuOpen(false); setSearchOpen(true); }}
              className="text-left text-stone-500 hover:text-stone-900 text-xs tracking-[0.2em] uppercase font-medium transition-colors"
            >
              Search
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
