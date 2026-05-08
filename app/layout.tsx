import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import MaintenanceOverlay from "@/components/MaintenanceOverlay";
import TopNotification from "@/components/TopNotification";
import RealtimeRefresher from "@/components/RealtimeRefresher";
import OverlayScrollbar from "@/components/OverlayScrollbar";
import { CartProvider } from "@/context/CartContext";
import { headers } from "next/headers";
import { getMaintenanceStatus } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shasstore — Curated Dresses & Jewellery",
  description:
    "A curated boutique for ladies' dresses and jewellery — pieces designed to feel as good as they look.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || "";
  const isAdmin = pathname.startsWith("/shasstorebyshahanas");

  // Fetch initial maintenance status server-side so the overlay is
  // visible IMMEDIATELY on page load (no fetch delay)
  const initialMaintenance = isAdmin
    ? { enabled: false, message: "", phone1: "", phone2: "" }
    : await getMaintenanceStatus().catch(() => ({
        enabled: false,
        message: "Site Under Maintenance",
        phone1: "",
        phone2: "",
      }));

  return (
    <html lang="en">
      <body>
        <CartProvider>
          <OverlayScrollbar />
          <ScrollToTop />
          <MaintenanceOverlay
            initialEnabled={initialMaintenance.enabled}
            initialMessage={initialMaintenance.message}
            initialPhone1={initialMaintenance.phone1}
            initialPhone2={initialMaintenance.phone2}
          />
          {!isAdmin && <TopNotification />}
          {!isAdmin && <Navbar />}
          {!isAdmin && <RealtimeRefresher />}
          {/* When the top notification is visible, push every customer page
              down by its height so content never slides under the navbar.
              Each page still owns its own pt-* spacing for the navbar. */}
          {isAdmin ? (
            children
          ) : (
            <div style={{ marginTop: "var(--top-bar-height, 0px)" }}>
              {children}
            </div>
          )}
          {!isAdmin && <Footer />}
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
