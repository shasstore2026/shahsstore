"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoutButton from "./LogoutButton";
import { ToastProvider } from "@/components/admin/Toast";

type NavItem = { label: string; href: string; icon: string };
type NavSection = { section: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    section: "Dashboards",
    items: [
      { label: "Order Dashboard", href: "/shasstorebyshahanas", icon: "▦" },
      { label: "Stock Dashboard", href: "/shasstorebyshahanas/stock", icon: "📦" },
      { label: "Revenue Dashboard", href: "/shasstorebyshahanas/revenue", icon: "₹" },
    ],
  },
  {
    section: "Catalog",
    items: [
      { label: "All Products", href: "/shasstorebyshahanas/products",     icon: "☰" },
      { label: "Add Product",  href: "/shasstorebyshahanas/products/new", icon: "+" },
      { label: "Categories",   href: "/shasstorebyshahanas/categories",   icon: "◈" },
    ],
  },
  {
    section: "Orders",
    items: [
      { label: "Orders", href: "/shasstorebyshahanas/orders", icon: "◎" },
    ],
  },
  {
    section: "Delivery",
    items: [
      { label: "Delivery Charges", href: "/shasstorebyshahanas/delivery-settings", icon: "🚚" },
    ],
  },
  {
    section: "Site Control",
    items: [
      { label: "Maintenance Mode", href: "/shasstorebyshahanas/maintenance-mode", icon: "🚧" },
    ],
  },
  {
    section: "Homepage",
    items: [
      { label: "Hero Banner",        href: "/shasstorebyshahanas/hero-banner",        icon: "◻" },
      { label: "Story Section",      href: "/shasstorebyshahanas/story-section",      icon: "✎" },
      { label: "Marquee Banner",     href: "/shasstorebyshahanas/marquee",            icon: "≡" },
      { label: "Lookbook",           href: "/shasstorebyshahanas/lookbook",           icon: "▦" },
      { label: "Testimonials",       href: "/shasstorebyshahanas/testimonials",       icon: "❝" },
      { label: "Instagram Strip",    href: "/shasstorebyshahanas/instagram",          icon: "◉" },
      { label: "Closing CTA",        href: "/shasstorebyshahanas/closing-cta",        icon: "✦" },
      { label: "Section Visibility", href: "/shasstorebyshahanas/section-visibility", icon: "◐" },
      { label: "Top Notification",   href: "/shasstorebyshahanas/top-notification",   icon: "📢" },
      { label: "Help Content",       href: "/shasstorebyshahanas/help-content",       icon: "?" },
      { label: "Company Content",    href: "/shasstorebyshahanas/company-content",    icon: "◉" },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isLoginPage = pathname === "/shasstorebyshahanas/login";

  // Restore collapsed state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin_sidebar_collapsed");
      if (stored === "true") setCollapsed(true);
    } catch {}
  }, []);

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem("admin_sidebar_collapsed", String(collapsed));
    } catch {}
  }, [collapsed]);

  // Clear loading state when pathname changes (navigation complete)
  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  const handleNavClick = (href: string) => {
    if (href === pathname) return;
    setSidebarOpen(false);
    setNavigatingTo(href);
    startTransition(() => {
      router.push(href);
    });
  };

  const isLoading = navigatingTo !== null || isPending;

  if (isLoginPage) {
    return <>{children}</>;
  }

  const sidebarWidth = collapsed ? "w-16" : "w-64";
  const mainMargin = collapsed ? "md:ml-16" : "md:ml-64";

  return (
    <ToastProvider>
    <div className="min-h-screen bg-stone-50 flex">

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 h-full ${sidebarWidth} bg-white border-r border-stone-100 z-40 flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0`}
      >
        {/* Logo + Collapse button */}
        <div className={`${collapsed ? "p-4" : "p-6"} border-b border-stone-100 flex items-center justify-between`}>
          {!collapsed ? (
            <div>
              <Link
                href="/"
                className="flex flex-col leading-none text-stone-900"
              >
                <span
                  className="text-2xl tracking-widest uppercase"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Shasstore
                </span>
                <span className="text-[0.6rem] tracking-[0.4em] uppercase text-stone-500 mt-0.5 self-end pr-0.5">
                  Fashion
                </span>
              </Link>
              <p className="text-xs text-stone-400 tracking-widest uppercase mt-1">
                Admin Panel
              </p>
            </div>
          ) : (
            <Link
              href="/"
              className="text-xl tracking-widest uppercase text-stone-900"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              title="Shasstore"
            >
              C
            </Link>
          )}

          {/* Collapse button — desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-7 h-7 items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
              />
            </svg>
          </button>

          {/* Close button — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-stone-400 hover:text-stone-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav Links */}
        <nav className={`${collapsed ? "px-2" : "px-4"} py-4 flex flex-col flex-1 overflow-y-auto`}>
          {navSections.map((section, sIndex) => (
            <div key={section.section} className={sIndex > 0 ? "mt-4" : ""}>
              {/* Section Label — hidden when collapsed (replaced by divider) */}
              {!collapsed ? (
                <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-semibold px-3 mb-2">
                  {section.section}
                </p>
              ) : sIndex > 0 ? (
                <div className="border-t border-stone-100 my-2 mx-1" />
              ) : null}

              {/* Section Items */}
              <div className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const isNavigating = navigatingTo === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavClick(item.href)}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 ${
                        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                      } text-sm rounded-lg transition-all duration-200 tracking-wide text-left w-full ${
                        isActive
                          ? "bg-stone-900 text-white"
                          : isNavigating
                          ? "bg-stone-100 text-stone-700"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 ${
                          isActive ? "text-white" : "text-stone-400"
                        } ${collapsed ? "text-lg" : ""}`}
                      >
                        {isNavigating ? (
                          <span className="inline-block w-4 h-4 border-2 border-stone-400 border-t-stone-700 rounded-full animate-spin" />
                        ) : (
                          item.icon
                        )}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className={`mt-6 pt-4 border-t border-stone-100`}>
            <Link
              href="/"
              onClick={() => setSidebarOpen(false)}
              title={collapsed ? "View Store" : undefined}
              className={`flex items-center gap-3 ${
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
              } text-sm text-stone-400 hover:text-stone-700 transition-colors`}
            >
              <span className={collapsed ? "text-lg" : ""}>{collapsed ? "←" : "← View Store"}</span>
            </Link>
            <LogoutButton collapsed={collapsed} />
          </div>
        </nav>
      </aside>

      {/* ── Main area ── */}
      <div className={`flex-1 flex flex-col ${mainMargin} transition-all duration-300`}>

        {/* Mobile topbar */}
        <header className="md:hidden sticky top-0 z-20 bg-white border-b border-stone-100 px-5 py-4 flex items-center gap-4">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-stone-500 hover:text-stone-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
          <span
            className="text-xl tracking-widest uppercase text-stone-900"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Shasstore Admin
          </span>
        </header>

        {/* Loading bar at top */}
        {isLoading && (
          <div className={`fixed top-0 left-0 right-0 z-50 ${collapsed ? "md:left-16" : "md:left-64"}`}>
            <div className="h-1 bg-stone-200 overflow-hidden">
              <div className="h-full bg-stone-900 animate-loading-bar" />
            </div>
            <style>{`
              @keyframes loading-bar {
                0% { width: 0; margin-left: 0; }
                50% { width: 70%; margin-left: 15%; }
                100% { width: 100%; margin-left: 0; }
              }
              .animate-loading-bar {
                animation: loading-bar 1.2s ease-in-out infinite;
              }
            `}</style>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-6 md:p-10">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-2 border-stone-200 border-t-stone-700 rounded-full animate-spin mb-4" />
                <p className="text-xs tracking-widest uppercase text-stone-400">Loading...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

    </div>
    </ToastProvider>
  );
}
