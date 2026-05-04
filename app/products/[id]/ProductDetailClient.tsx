"use client";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Product } from "@/types";
import { getDiscountPercent, getStockForSize, LOW_STOCK_THRESHOLD, getTotalStock } from "@/lib/constants";

// ── Image Lightbox ─────────────────────────────────────────
function ImageLightbox({
  images, activeIndex, onClose, onPrev, onNext,
}: {
  images: string[]; activeIndex: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999, isolation: "isolate" }}
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <Image
          src={images[activeIndex]}
          alt="bg"
          fill
          className="object-cover"
          sizes="100vw"
          style={{ filter: "blur(40px) brightness(0.4)", transform: "scale(1.15)" }}
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div
        className="absolute top-0 left-0 right-0 flex justify-between items-center px-5 py-4"
        style={{ zIndex: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-black/60 text-white text-xs tracking-widest uppercase px-3 py-1.5 rounded-sm">
          {activeIndex + 1} / {images.length}
        </div>
        <button
          onClick={onClose}
          className="bg-black/60 text-white w-10 h-10 flex items-center justify-center text-xl hover:bg-black/90 transition rounded-sm"
        >
          ✕
        </button>
      </div>

      <div
        className="relative"
        style={{ zIndex: 10, width: "min(92vw, 520px)", height: "min(82vh, 720px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[activeIndex]}
          alt={`Image ${activeIndex + 1}`}
          fill
          className="object-contain drop-shadow-2xl"
          sizes="92vw"
        />
      </div>

      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 text-white w-11 h-11 flex items-center justify-center text-3xl hover:bg-black/90 transition rounded-sm"
          style={{ zIndex: 20 }}
        >
          ‹
        </button>
      )}

      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 text-white w-11 h-11 flex items-center justify-center text-3xl hover:bg-black/90 transition rounded-sm"
          style={{ zIndex: 20 }}
        >
          ›
        </button>
      )}

      {images.length > 1 && (
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2"
          style={{ zIndex: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-10 h-12 overflow-hidden border-2 transition-all ${
                i === activeIndex ? "border-white opacity-100" : "border-white/30 opacity-50 hover:opacity-80"
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="40px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Size Guide Modal ───────────────────────────────────────
function SizeGuideModal({ sizeGuide, onClose }: { sizeGuide: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const rows = sizeGuide.split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white max-w-lg w-full p-8 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-5 text-stone-400 hover:text-stone-900 text-xl">✕</button>
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Reference</p>
        <h2 className="text-3xl text-stone-900 font-light mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Shirt Size Guide
        </h2>
        {rows.length > 0 ? (
          <div className="overflow-hidden border border-stone-100">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-stone-400 font-medium border-b border-stone-100">Size</th>
                  <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-stone-400 font-medium border-b border-stone-100">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {rows.map((row, i) => {
                  const dashIndex = row.indexOf("–");
                  const size = dashIndex > -1 ? row.slice(0, dashIndex).trim() : row;
                  const detail = dashIndex > -1 ? row.slice(dashIndex + 1).trim() : "";
                  return (
                    <tr key={i} className="hover:bg-stone-50">
                      <td className="px-4 py-3 text-stone-700 font-medium">{size}</td>
                      <td className="px-4 py-3 text-stone-500 font-light">{detail || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-stone-400 text-sm">No size guide available.</p>
        )}
        <p className="text-xs text-stone-400 mt-4 font-light">Tip: For a relaxed fit, go one size up.</p>
      </div>
    </div>
  );
}

// ── Accordion Section ──────────────────────────────────────
function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-stone-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-sm tracking-[0.2em] uppercase text-stone-700 font-medium group-hover:text-stone-900 transition-colors">
          {title}
        </span>
        <span
          className={`text-stone-400 text-xl transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100 pb-5" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

// ── Related Products Section ───────────────────────────────
function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <div className="bg-white border-t border-stone-100 py-12 md:py-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">You may also like</p>
        <h2
          className="text-3xl md:text-5xl text-stone-900 font-light mb-8 md:mb-12"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Similar Styles
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`} className="group">
              <div className="relative w-full h-56 md:h-80 bg-stone-100 overflow-hidden mb-3">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">{p.category}</p>
              <h3
                className="text-stone-800 text-sm md:text-base font-light leading-snug mb-1 group-hover:text-stone-600 transition-colors"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem" }}
              >
                {p.name}
              </h3>
              <p className="text-stone-700 text-sm font-medium">₹{p.price.toLocaleString()}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function ProductDetailClient({
  product,
  sizeGuide,
  relatedProducts = [],
}: {
  product: Product;
  sizeGuide: string;
  relatedProducts?: Product[];
}) {
  const { addToCart, cartItems } = useCart();
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeError, setSizeError] = useState(false);

  // Is the currently selected variant already in cart?
  const isInCart = !!selectedSize && cartItems.some(
    (i) => i.id === product.id && i.selectedSize === selectedSize
  );

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const thumbStripRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null); // ← NEW

  const allImages =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image];

  const [activeImage, setActiveImage] = useState(allImages[0]);
  const activeIndex = allImages.indexOf(activeImage);

  const totalStock = getTotalStock(product.size_inventory);
  const productInStock = product.inStock && totalStock > 0;

  // ── Add to Cart / Go to Cart handler ──
  const handleAddToCart = () => {
    // If this variant is already in cart, navigate to cart
    if (isInCart) {
      router.push("/cart");
      return;
    }
    if (!selectedSize) {
      setSizeError(true);
      sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setSizeError(false), 600);
      return;
    }
    const stock = getStockForSize(product.size_inventory, selectedSize);
    if (stock === 0) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 600);
      return;
    }
    addToCart(product, selectedSize);
  };

  function scrollThumbs(dir: "left" | "right") {
    if (!thumbStripRef.current) return;
    thumbStripRef.current.scrollBy({ left: dir === "left" ? -140 : 140, behavior: "smooth" });
  }

  return (
    <div className="bg-[#FAFAF8] min-h-screen pt-24">

      {/* ── Shake keyframe injected once ── */}
      <style>{`
        @keyframes shake {
          0%   { transform: translateX(0); }
          15%  { transform: translateX(-6px); }
          30%  { transform: translateX(6px); }
          45%  { transform: translateX(-5px); }
          60%  { transform: translateX(5px); }
          75%  { transform: translateX(-3px); }
          90%  { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
        .shake { animation: shake 0.6s ease; }
      `}</style>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <p className="text-xs tracking-[0.2em] text-stone-400 uppercase">
          <Link href="/" className="hover:text-stone-700 transition-colors">Home</Link>
          {" "}&rsaquo;{" "}
          <Link href="/products" className="hover:text-stone-700 transition-colors">Shirts</Link>
          {" "}&rsaquo;{" "}
          <span className="text-stone-600">{product.name}</span>
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-12 md:pb-24 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">

        {/* Image Gallery — sticky on desktop */}
        <div className="flex flex-col gap-4 md:sticky md:top-28 md:self-start">
          <div
            className="relative w-full h-[360px] md:h-[520px] bg-stone-100 overflow-hidden cursor-zoom-in group"
            onClick={() => {
              setLightboxIndex(activeIndex >= 0 ? activeIndex : 0);
              setLightboxOpen(true);
            }}
          >
            <Image
              src={activeImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-opacity duration-300"
            />
            <div className="absolute bottom-3 right-3 bg-black/30 text-white text-xs px-2.5 py-1.5 tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              ⊕ Zoom
            </div>
            {!product.inStock && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <span className="text-stone-500 text-xs tracking-[0.3em] uppercase border border-stone-300 px-6 py-3">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => scrollThumbs("left")}
                className="flex-shrink-0 w-8 h-8 bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:border-stone-700 hover:text-stone-900 transition-all text-lg"
              >
                ‹
              </button>
              <div
                ref={thumbStripRef}
                className="flex gap-3 overflow-x-auto scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    style={{ width: "72px", height: "80px", position: "relative", flexShrink: 0 }}
                    className={`block overflow-hidden border-2 transition-all duration-200 bg-stone-100 ${
                      activeImage === img ? "border-stone-900" : "border-transparent hover:border-stone-300"
                    }`}
                  >
                    <Image src={img} alt={`${product.name} view ${i + 1}`} fill sizes="72px" className="object-cover" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => scrollThumbs("right")}
                className="flex-shrink-0 w-8 h-8 bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:border-stone-700 hover:text-stone-900 transition-all text-lg"
              >
                ›
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="pt-4">
          <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-3">{product.category} Shirt</p>
          <h1 className="text-2xl md:text-4xl text-stone-900 font-light leading-tight mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {product.name}
          </h1>
          {(() => {
            const discount = getDiscountPercent(product.price, product.original_price);
            return (
              <div className="flex items-baseline gap-3 flex-wrap mb-6">
                <p className="text-xl md:text-2xl text-stone-900 font-medium">
                  ₹{product.price.toLocaleString()}
                </p>
                {discount > 0 && product.original_price && (
                  <>
                    <p className="text-base md:text-lg text-stone-400 line-through font-light">
                      ₹{product.original_price.toLocaleString()}
                    </p>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded tracking-wider">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>
            );
          })()}
          <div className="w-12 h-px bg-stone-300 mb-6" />
          <p className="text-stone-500 font-light leading-relaxed text-sm mb-8">{product.description}</p>

          {/* ── Sizes with per-size stock ── */}
          <div
            ref={sizeRef}
            className={`mb-8 ${sizeError ? "shake" : ""}`}
          >
            <div className="flex justify-between items-center mb-3">
              <p className={`text-xs tracking-[0.2em] uppercase font-medium transition-colors duration-300 ${
                sizeError ? "text-red-500" : "text-stone-700"
              }`}>
                Collar Size
              </p>
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="text-xs text-stone-400 underline underline-offset-4 hover:text-stone-700 transition-colors"
              >
                Size Guide
              </button>
            </div>
            <div className="flex gap-2 flex-wrap pt-2">
              {product.sizes.map((size) => {
                const stock = getStockForSize(product.size_inventory, size);
                // When admin has marked the product sold out, treat every size
                // as out and suppress per-size urgency badges — never tease
                // "1 left" on a product that can't be bought.
                const isOut = !productInStock || stock === 0;
                const isLow = productInStock && stock > 0 && stock <= LOW_STOCK_THRESHOLD;
                return (
                  <button
                    key={size}
                    onClick={() => {
                      if (isOut) return;
                      setSelectedSize(size);
                      setSizeError(false);
                    }}
                    disabled={isOut}
                    className={`relative border px-5 py-2.5 text-xs tracking-widest uppercase font-medium transition-all duration-200 ${
                      isOut
                        ? "border-stone-200 text-stone-300 bg-stone-50 line-through cursor-not-allowed"
                        : selectedSize === size
                        ? "bg-stone-900 text-white border-stone-900"
                        : sizeError
                        ? "border-red-300 text-red-400 hover:border-red-500"
                        : "border-stone-200 text-stone-500 hover:border-stone-600 hover:text-stone-800"
                    }`}
                  >
                    {size}
                    {isLow && !isOut && (
                      <span
                        className="absolute -top-2.5 -right-3 bg-red-500 text-white text-[9px] leading-none px-1.5 py-1 rounded-full font-medium tracking-normal whitespace-nowrap"
                        title={`Only ${stock} ${stock === 1 ? "piece" : "pieces"} left`}
                      >
                        {stock} left
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected size out of stock message */}
            {selectedSize && getStockForSize(product.size_inventory, selectedSize) === 0 && (
              <p className="text-xs text-red-500 mt-3 font-medium">Out of stock — please pick another size</p>
            )}

            {/* Inline error or hint */}
            <p className={`text-xs mt-2 transition-all duration-300 ${
              sizeError ? "text-red-400" : "text-stone-400"
            }`}>
              {sizeError ? "⚠ Please select a collar size to continue" : !selectedSize ? "Please select a size to continue" : ""}
            </p>
          </div>

          {/* Add to Cart / Go to Cart */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={!productInStock}
              className={`flex-1 py-4 text-xs tracking-[0.3em] uppercase font-medium transition-all duration-300 ${
                !productInStock
                  ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                  : isInCart
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-stone-900 text-white hover:bg-stone-700"
              }`}
            >
              {!productInStock ? "Sold Out" : isInCart ? "✓ Go to Cart →" : "Add to Cart"}
            </button>
          </div>

          {/* Badges */}
          <div className="border-t border-stone-100 pt-6 space-y-3 mb-8">
            {[
              ["🚚", "Free delivery on orders over ₹2,000"],
              ["↩️", "14-day hassle-free returns"],
              ["✦", "Premium fabric, precision tailored"],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-base">{icon}</span>
                <p className="text-xs text-stone-500 font-light tracking-wide">{text}</p>
              </div>
            ))}
          </div>

          {/* ── Accordion Sections ── */}
          <div className="border-t border-stone-200">
            {/* Product Details */}
            {product.product_details && Object.keys(product.product_details).length > 0 && (
              <AccordionSection title="Product Details" defaultOpen>
                <div className="space-y-2.5 pt-2">
                  {Object.entries(product.product_details).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 py-2 border-b border-stone-100 text-sm">
                      <span className="text-stone-500 font-light">{key}</span>
                      <span className="text-stone-800 font-medium text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </AccordionSection>
            )}

            {/* About this item */}
            {product.about_items && product.about_items.length > 0 && (
              <AccordionSection title="About this item">
                <ul className="space-y-3 pt-2 text-sm text-stone-600 font-light leading-relaxed">
                  {product.about_items.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-stone-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </AccordionSection>
            )}

            {/* Style Specs */}
            {product.style_specs && Object.keys(product.style_specs).length > 0 && (
              <AccordionSection title="Style Specifications">
                <div className="space-y-2.5 pt-2">
                  {Object.entries(product.style_specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 py-2 border-b border-stone-100 text-sm">
                      <span className="text-stone-500 font-light">{key}</span>
                      <span className="text-stone-800 font-medium text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </AccordionSection>
            )}
          </div>
        </div>
      </div>

      {/* ── Related Products ── */}
      <RelatedProducts products={relatedProducts} />

      {lightboxOpen && (
        <ImageLightbox
          images={allImages}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex((i) => (i - 1 + allImages.length) % allImages.length)}
          onNext={() => setLightboxIndex((i) => (i + 1) % allImages.length)}
        />
      )}

      {sizeGuideOpen && (
        <SizeGuideModal
          sizeGuide={sizeGuide}
          onClose={() => setSizeGuideOpen(false)}
        />
      )}
    </div>
  );
}
