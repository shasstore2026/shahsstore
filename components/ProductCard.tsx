"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Product } from "@/types";
import { getDiscountPercent, getTotalStock, LOW_STOCK_THRESHOLD } from "@/lib/constants";

export default function ProductCard({ product }: { product: Product }) {
  const discount = getDiscountPercent(product.price, product.original_price);
  const showDiscount = discount > 0;

  const totalStock = getTotalStock(product.size_inventory);
  const isOutOfStock = !product.inStock || totalStock === 0;
  const isLowStock = !isOutOfStock && totalStock <= LOW_STOCK_THRESHOLD;

  const onePieceLeftSizes = product.size_inventory
    ? Object.entries(product.size_inventory).filter(([, q]) => q === 1).map(([s]) => s)
    : [];

  const hasImage = !!product.image;
  // Use second image as hover swap if available AND different from primary
  const hoverImage =
    Array.isArray(product.images) && product.images.length > 1
      ? product.images[1]
      : product.image;

  const [wished, setWished] = useState(false);

  return (
    <div className="group relative">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative h-60 sm:h-72 md:h-[26rem] overflow-hidden bg-[var(--color-shas-cream)]">
          {hasImage ? (
            <>
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-opacity duration-700 group-hover:opacity-0"
              />
              {hoverImage && hoverImage !== product.image && (
                <Image
                  src={hoverImage}
                  alt={`${product.name} alternate view`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover scale-105 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            /* No image yet → boutique gradient with italic product name */
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-shas-blush)] via-[var(--color-shas-cream)] to-white flex items-center justify-center p-6">
              <span
                aria-hidden
                className="absolute -bottom-6 -right-2 font-italiana text-[7rem] text-[var(--color-shas-rose)]/15 leading-none select-none pointer-events-none"
              >
                ✦
              </span>
              <p className="relative z-10 font-display italic text-xl md:text-2xl text-[var(--color-shas-plum)]/70 text-center leading-tight">
                {product.name}
              </p>
            </div>
          )}

          {/* Soft gradient at bottom for legibility of badges */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />

          {/* Category eyebrow — top left */}
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-white/85 backdrop-blur-sm text-[var(--color-shas-plum)] text-[0.6rem] tracking-[0.25em] uppercase px-3 py-1 font-medium">
              {product.category}
            </span>
          </div>

          {/* Discount tag — top right */}
          {showDiscount && !isOutOfStock && (
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-[var(--color-shas-rose)] text-white text-[0.6rem] tracking-[0.2em] uppercase px-3 py-1 font-medium">
                {discount}% off
              </span>
            </div>
          )}

          {/* Low stock — bottom left */}
          {!isOutOfStock && (isLowStock || onePieceLeftSizes.length > 0) && (
            <div className="absolute bottom-3 left-3 z-10">
              <span className="bg-[var(--color-shas-plum)] text-white text-[0.6rem] tracking-[0.2em] uppercase px-2.5 py-1 font-medium">
                {onePieceLeftSizes.length === 1
                  ? `Only 1 left in ${onePieceLeftSizes[0]}`
                  : onePieceLeftSizes.length > 1
                  ? `Last pieces in ${onePieceLeftSizes.length} sizes`
                  : `Only ${totalStock} left`}
              </span>
            </div>
          )}

          {/* Sold Out overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-[var(--color-shas-bg)]/60 flex items-center justify-center z-10">
              <span className="bg-white/90 text-[var(--color-shas-plum)] text-[0.65rem] tracking-[0.4em] uppercase px-6 py-3 font-medium">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Quick action — appears on hover */}
        <div className="absolute left-3 right-3 bottom-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20 hidden md:block">
          <div className="flex justify-center">
            <span className="block bg-white text-[var(--color-shas-plum)] px-6 py-3 text-[0.65rem] tracking-[0.3em] uppercase font-medium border border-[var(--color-shas-line)] hover:bg-[var(--color-shas-plum)] hover:text-white transition-colors duration-300">
              Quick View
            </span>
          </div>
        </div>
      </Link>

      {/* Wishlist heart — outside the Link so it doesn't navigate */}
      <button
        onClick={(e) => { e.preventDefault(); setWished((w) => !w); }}
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        className="absolute top-3 right-3 md:right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:translate-y-0"
        style={{ pointerEvents: "auto" }}
      >
        {/* On mobile we show always; nudge it below the discount tag if present */}
        <span className={`flex items-center justify-center w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-colors ${wished ? "text-[var(--color-shas-rose)]" : "text-[var(--color-shas-plum)]"} ${showDiscount && !isOutOfStock ? "translate-y-9" : ""}`}>
          <svg className="w-4 h-4" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </span>
      </button>

      {/* Info */}
      <div className="pt-4 pb-3">
        <Link href={`/products/${product.id}`}>
          <h3
            className="font-display text-[var(--color-shas-charcoal)] hover:text-[var(--color-shas-rose)] transition-colors leading-snug text-lg md:text-xl font-light"
          >
            {product.name}
          </h3>
        </Link>

        <div className="flex justify-between items-center mt-1.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-[var(--color-shas-plum)] text-sm md:text-base font-medium">
              ₹{product.price.toLocaleString()}
            </p>
            {showDiscount && product.original_price && (
              <p className="text-[var(--color-shas-muted)] text-xs line-through">
                ₹{product.original_price.toLocaleString()}
              </p>
            )}
          </div>
          {isOutOfStock && (
            <span className="text-[0.65rem] text-[var(--color-shas-muted)] tracking-[0.2em] uppercase">Sold Out</span>
          )}
        </div>

        {/* Size chips preview */}
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {product.sizes.slice(0, 4).map((size) => {
            const sizeStock = product.size_inventory?.[size] ?? 0;
            const sizeOut = isOutOfStock || sizeStock === 0;
            return (
              <span
                key={size}
                className={`text-[0.65rem] tracking-wider px-2 py-0.5 transition-colors ${
                  sizeOut
                    ? "border border-[var(--color-shas-line)] text-[var(--color-shas-line-strong)] line-through"
                    : "border border-[var(--color-shas-line-strong)] text-[var(--color-shas-muted)] hover:border-[var(--color-shas-rose)] hover:text-[var(--color-shas-rose)]"
                }`}
              >
                {size}
              </span>
            );
          })}
          {product.sizes.length > 4 && (
            <span className="text-[0.65rem] text-[var(--color-shas-muted)]">
              +{product.sizes.length - 4}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
