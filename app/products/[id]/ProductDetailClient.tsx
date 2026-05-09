"use client";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Product } from "@/types";
import { getDiscountPercent, getStockForSize, LOW_STOCK_THRESHOLD, getTotalStock } from "@/lib/constants";
import Breadcrumb from "@/components/Breadcrumb";

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
        <button onClick={onClose} className="absolute top-4 right-5 text-[var(--color-shas-muted)] hover:text-[var(--color-shas-plum)] text-xl">✕</button>
        <p className="text-xs tracking-[0.3em] text-[var(--color-shas-rose)] uppercase mb-2">Reference</p>
        <h2 className="font-display text-3xl text-[var(--color-shas-plum)] font-light mb-6">
          Size &amp; Fit Guide
        </h2>
        {rows.length > 0 ? (
          <div className="overflow-hidden border border-[var(--color-shas-cream)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-shas-cream)]/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-[var(--color-shas-muted)] font-medium border-b border-[var(--color-shas-cream)]">Size</th>
                  <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-[var(--color-shas-muted)] font-medium border-b border-[var(--color-shas-cream)]">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-shas-line)]">
                {rows.map((row, i) => {
                  const dashIndex = row.indexOf("–");
                  const size = dashIndex > -1 ? row.slice(0, dashIndex).trim() : row;
                  const detail = dashIndex > -1 ? row.slice(dashIndex + 1).trim() : "";
                  return (
                    <tr key={i} className="hover:bg-[var(--color-shas-cream)]/50">
                      <td className="px-4 py-3 text-[var(--color-shas-plum)] font-medium">{size}</td>
                      <td className="px-4 py-3 text-[var(--color-shas-muted)] font-light">{detail || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[var(--color-shas-muted)] text-sm">No size guide available.</p>
        )}
        <p className="text-xs text-[var(--color-shas-muted)] mt-4 font-light italic">Tip: When between sizes, we suggest going up — you can always cinch with a belt.</p>
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
    <div className="border-b border-[var(--color-shas-line)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-sm tracking-[0.2em] uppercase text-[var(--color-shas-plum)] font-medium group-hover:text-[var(--color-shas-plum)] transition-colors">
          {title}
        </span>
        <span
          className={`text-[var(--color-shas-muted)] text-xl transition-transform duration-300 ${
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
    <div className="bg-white border-t border-[var(--color-shas-cream)] py-12 md:py-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <span className="divider-rose mb-4">You may also love</span>
        <h2 className="font-display text-3xl md:text-5xl text-[var(--color-shas-plum)] font-light mb-8 md:mb-12">
          Pieces that pair beautifully
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`} className="group">
              <div className="relative w-full h-56 md:h-80 bg-[var(--color-shas-cream)] overflow-hidden mb-3">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-shas-blush)] via-[var(--color-shas-cream)] to-white flex items-center justify-center p-4">
                    <p className="font-display italic text-lg md:text-xl text-[var(--color-shas-plum)]/70 text-center leading-tight">
                      {p.name}
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs tracking-widest uppercase text-[var(--color-shas-muted)] mb-1">{p.category}</p>
              <h3
                className="text-[var(--color-shas-plum)] text-sm md:text-base font-light leading-snug mb-1 group-hover:text-[var(--color-shas-plum)] transition-colors"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem" }}
              >
                {p.name}
              </h3>
              <p className="text-[var(--color-shas-plum)] text-sm font-medium">₹{p.price.toLocaleString()}</p>
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
  const [selectedBottomSize, setSelectedBottomSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const [bottomSizeError, setBottomSizeError] = useState(false);

  // Bottom sizes are optional per product — if non-empty, the selector shows.
  const hasBottomSizes =
    Array.isArray(product.bottom_sizes) && product.bottom_sizes.length > 0;

  // Is the currently selected variant already in cart?
  const isInCart =
    !!selectedSize &&
    (!hasBottomSizes || !!selectedBottomSize) &&
    cartItems.some(
      (i) =>
        i.id === product.id &&
        i.selectedSize === selectedSize &&
        (i.selectedBottomSize ?? "") === (hasBottomSizes ? selectedBottomSize : "")
    );

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const thumbStripRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const bottomSizeRef = useRef<HTMLDivElement>(null);

  // Build the gallery — drop empty strings so we never feed Next/Image a "" src.
  // If admin hasn't uploaded any images yet, allImages is [] and we render
  // a tasteful gradient fallback below instead of the gallery.
  const allImages =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images.filter(Boolean)
      : [product.image].filter(Boolean);

  const [activeImage, setActiveImage] = useState<string>(allImages[0] ?? "");
  const activeIndex = allImages.indexOf(activeImage);
  const hasGalleryImage = allImages.length > 0 && !!activeImage;

  const totalStock = getTotalStock(product.size_inventory);
  const productInStock = product.inStock && totalStock > 0;

  // ── Add to Cart / Go to Cart handler ──
  const handleAddToCart = () => {
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
    if (hasBottomSizes) {
      if (!selectedBottomSize) {
        setBottomSizeError(true);
        bottomSizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setBottomSizeError(false), 600);
        return;
      }
      const bottomStock = getStockForSize(product.bottom_size_inventory, selectedBottomSize);
      if (bottomStock === 0) {
        setBottomSizeError(true);
        setTimeout(() => setBottomSizeError(false), 600);
        return;
      }
    }
    addToCart(product, selectedSize, hasBottomSizes ? selectedBottomSize : undefined);
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

      {/* Breadcrumb: Home › Category › <product> */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Category", href: "/collection" },
            { label: product.name },
          ]}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-12 md:pb-24 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">

        {/* Image Gallery — sticky on desktop */}
        <div className="flex flex-col gap-4 md:sticky md:top-28 md:self-start">
          <div
            className={`relative w-full h-[360px] md:h-[520px] bg-[var(--color-shas-cream)] overflow-hidden group ${
              hasGalleryImage ? "cursor-zoom-in" : ""
            }`}
            onClick={() => {
              if (!hasGalleryImage) return;
              setLightboxIndex(activeIndex >= 0 ? activeIndex : 0);
              setLightboxOpen(true);
            }}
          >
            {hasGalleryImage ? (
              <>
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
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-shas-blush)] via-[var(--color-shas-cream)] to-white flex items-center justify-center p-10">
                <span
                  aria-hidden
                  className="absolute -bottom-10 -right-6 font-italiana text-[14rem] text-[var(--color-shas-rose)]/15 leading-none select-none pointer-events-none"
                >
                  ✦
                </span>
                <p className="relative z-10 font-display italic text-3xl md:text-5xl text-[var(--color-shas-plum)]/70 text-center leading-tight">
                  {product.name}
                </p>
              </div>
            )}
            {!product.inStock && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <span className="text-[var(--color-shas-muted)] text-xs tracking-[0.3em] uppercase border border-[var(--color-shas-line-strong)] px-6 py-3">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => scrollThumbs("left")}
                className="flex-shrink-0 w-8 h-8 bg-white border border-[var(--color-shas-line)] flex items-center justify-center text-[var(--color-shas-muted)] hover:border-[var(--color-shas-plum)] hover:text-[var(--color-shas-plum)] transition-all text-lg"
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
                    className={`block overflow-hidden border-2 transition-all duration-200 bg-[var(--color-shas-cream)] ${
                      activeImage === img ? "border-[var(--color-shas-plum)]" : "border-transparent hover:border-[var(--color-shas-line-strong)]"
                    }`}
                  >
                    <Image src={img} alt={`${product.name} view ${i + 1}`} fill sizes="72px" className="object-cover" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => scrollThumbs("right")}
                className="flex-shrink-0 w-8 h-8 bg-white border border-[var(--color-shas-line)] flex items-center justify-center text-[var(--color-shas-muted)] hover:border-[var(--color-shas-plum)] hover:text-[var(--color-shas-plum)] transition-all text-lg"
              >
                ›
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="pt-4">
          <p className="text-xs tracking-[0.3em] text-[var(--color-shas-rose)] uppercase mb-3">{product.category}</p>
          <h1 className="font-display text-3xl md:text-5xl text-[var(--color-shas-plum)] font-light leading-tight mb-4">
            {product.name}
          </h1>
          {(() => {
            const discount = getDiscountPercent(product.price, product.original_price);
            return (
              <div className="flex items-baseline gap-3 flex-wrap mb-6">
                <p className="text-xl md:text-2xl text-[var(--color-shas-plum)] font-medium">
                  ₹{product.price.toLocaleString()}
                </p>
                {discount > 0 && product.original_price && (
                  <>
                    <p className="text-base md:text-lg text-[var(--color-shas-muted)] line-through font-light">
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
          <div className="w-12 h-px bg-[var(--color-shas-line-strong)] mb-6" />
          <p className="text-[var(--color-shas-muted)] font-light leading-relaxed text-sm mb-8">{product.description}</p>

          {/* ── Top Size selector ── */}
          <div
            ref={sizeRef}
            className={`mb-6 ${sizeError ? "shake" : ""}`}
          >
            <div className="flex justify-between items-center mb-3">
              <p className={`text-xs tracking-[0.25em] uppercase font-medium transition-colors duration-300 ${
                sizeError ? "text-red-500" : "text-[var(--color-shas-plum)]"
              }`}>
                {hasBottomSizes ? "Top Size" : "Select Size"}
              </p>
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="text-xs text-[var(--color-shas-rose)] hover:text-[var(--color-shas-rose-deep)] transition-colors underline underline-offset-4"
              >
                Size & Fit Guide
              </button>
            </div>
            <div className="flex gap-2 flex-wrap pt-2">
              {product.sizes.map((size) => {
                const stock = getStockForSize(product.size_inventory, size);
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
                        ? "border-[var(--color-shas-line)] text-[var(--color-shas-line-strong)] bg-[var(--color-shas-cream)]/50 line-through cursor-not-allowed"
                        : selectedSize === size
                        ? "bg-[var(--color-shas-plum)] text-white border-[var(--color-shas-plum)]"
                        : sizeError
                        ? "border-red-300 text-red-400 hover:border-red-500"
                        : "border-[var(--color-shas-line)] text-[var(--color-shas-muted)] hover:border-[var(--color-shas-plum)] hover:text-[var(--color-shas-plum)]"
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

            {selectedSize && getStockForSize(product.size_inventory, selectedSize) === 0 && (
              <p className="text-xs text-red-500 mt-3 font-medium">Out of stock — please pick another size</p>
            )}

            <p className={`text-xs mt-2 transition-all duration-300 ${
              sizeError ? "text-red-400" : "text-[var(--color-shas-muted)]"
            }`}>
              {sizeError ? "Please choose a size to continue" : !selectedSize ? (hasBottomSizes ? "Please select a top size" : "Please select a size to continue") : ""}
            </p>
          </div>

          {/* ── Bottom Size selector (co-ord sets / pant-paired pieces) ── */}
          {hasBottomSizes && (
            <div
              ref={bottomSizeRef}
              className={`mb-8 ${bottomSizeError ? "shake" : ""}`}
            >
              <div className="flex justify-between items-center mb-3">
                <p className={`text-xs tracking-[0.25em] uppercase font-medium transition-colors duration-300 ${
                  bottomSizeError ? "text-red-500" : "text-[var(--color-shas-plum)]"
                }`}>
                  Bottom Size
                </p>
              </div>
              <div className="flex gap-2 flex-wrap pt-2">
                {(product.bottom_sizes ?? []).map((size) => {
                  const stock = getStockForSize(product.bottom_size_inventory, size);
                  const isOut = !productInStock || stock === 0;
                  const isLow = productInStock && stock > 0 && stock <= LOW_STOCK_THRESHOLD;
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        if (isOut) return;
                        setSelectedBottomSize(size);
                        setBottomSizeError(false);
                      }}
                      disabled={isOut}
                      className={`relative border px-5 py-2.5 text-xs tracking-widest uppercase font-medium transition-all duration-200 ${
                        isOut
                          ? "border-[var(--color-shas-line)] text-[var(--color-shas-line-strong)] bg-[var(--color-shas-cream)]/50 line-through cursor-not-allowed"
                          : selectedBottomSize === size
                          ? "bg-[var(--color-shas-plum)] text-white border-[var(--color-shas-plum)]"
                          : bottomSizeError
                          ? "border-red-300 text-red-400 hover:border-red-500"
                          : "border-[var(--color-shas-line)] text-[var(--color-shas-muted)] hover:border-[var(--color-shas-plum)] hover:text-[var(--color-shas-plum)]"
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

              {selectedBottomSize && getStockForSize(product.bottom_size_inventory, selectedBottomSize) === 0 && (
                <p className="text-xs text-red-500 mt-3 font-medium">Out of stock — please pick another bottom size</p>
              )}

              <p className={`text-xs mt-2 transition-all duration-300 ${
                bottomSizeError ? "text-red-400" : "text-[var(--color-shas-muted)]"
              }`}>
                {bottomSizeError ? "Please choose a bottom size to continue" : !selectedBottomSize ? "Please select a bottom size" : ""}
              </p>
            </div>
          )}

          {/* Add to Cart / Go to Cart */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={!productInStock}
              className={`flex-1 py-4 text-xs tracking-[0.3em] uppercase font-medium transition-all duration-300 ${
                !productInStock
                  ? "bg-[var(--color-shas-line)] text-[var(--color-shas-muted)] cursor-not-allowed"
                  : isInCart
                  ? "bg-[var(--color-shas-sage)] text-white hover:opacity-90"
                  : "bg-[var(--color-shas-plum)] text-white hover:bg-[var(--color-shas-plum-soft)]"
              }`}
            >
              {!productInStock ? "Sold Out" : isInCart ? "✓ Go to Bag →" : "Add to Bag"}
            </button>
            <button
              aria-label="Add to wishlist"
              className="px-5 border border-[var(--color-shas-line-strong)] text-[var(--color-shas-plum)] hover:border-[var(--color-shas-rose)] hover:text-[var(--color-shas-rose)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>

          {/* Badges */}
          <div className="border-t border-[var(--color-shas-line)] pt-6 space-y-3 mb-8">
            {[
              ["✦", "Free delivery on orders over ₹2,000"],
              ["✦", "14-day hassle-free returns"],
              ["✦", "Hand-curated, premium materials"],
              ["✦", "Wrapped with care, ready for gifting"],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-[var(--color-shas-rose)]">{icon}</span>
                <p className="text-xs text-[var(--color-shas-muted)] font-light tracking-wide">{text}</p>
              </div>
            ))}
          </div>

          {/* ── Accordion Sections ── */}
          <div className="border-t border-[var(--color-shas-line)]">
            {/* Product Details */}
            {product.product_details && Object.keys(product.product_details).length > 0 && (
              <AccordionSection title="Product Details" defaultOpen>
                <div className="space-y-2.5 pt-2">
                  {Object.entries(product.product_details).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 py-2 border-b border-[var(--color-shas-cream)] text-sm">
                      <span className="text-[var(--color-shas-muted)] font-light">{key}</span>
                      <span className="text-[var(--color-shas-plum)] font-medium text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </AccordionSection>
            )}

            {/* About this item */}
            {product.about_items && product.about_items.length > 0 && (
              <AccordionSection title="About this item">
                <ul className="space-y-3 pt-2 text-sm text-[var(--color-shas-plum)] font-light leading-relaxed">
                  {product.about_items.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-[var(--color-shas-muted)] mt-1">•</span>
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
                    <div key={key} className="flex justify-between gap-4 py-2 border-b border-[var(--color-shas-cream)] text-sm">
                      <span className="text-[var(--color-shas-muted)] font-light">{key}</span>
                      <span className="text-[var(--color-shas-plum)] font-medium text-right">{value}</span>
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
