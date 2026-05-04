"use client";
import Link from "next/link";
import Image from "next/image";
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

  return (
    <div className="group relative bg-white">
      {/* Image */}
      <Link href={`/products/${product.id}`}>
        <div className="relative h-56 md:h-80 overflow-hidden bg-stone-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Category badge — top left */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 text-stone-600 text-xs tracking-[0.15em] uppercase px-3 py-1 font-medium">
              {product.category}
            </span>
          </div>

          {/* Low stock badge — bottom left. Hidden when admin marks the
              product as sold out, so we never tease "Only 1 left" on a
              product that can't be bought anyway. */}
          {!isOutOfStock && (isLowStock || onePieceLeftSizes.length > 0) && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-red-500 text-white text-xs tracking-wider font-medium px-2 py-1 rounded animate-pulse">
                {onePieceLeftSizes.length === 1
                  ? `🔥 Only 1 left in ${onePieceLeftSizes[0]}`
                  : onePieceLeftSizes.length > 1
                  ? `🔥 Only 1 left in ${onePieceLeftSizes.length} sizes`
                  : `🔥 Only ${totalStock} ${totalStock === 1 ? "piece" : "pieces"} left`}
              </span>
            </div>
          )}

          {/* Sold Out overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-stone-900/30 flex items-center justify-center">
              <span className="bg-white/90 text-stone-700 text-xs tracking-[0.3em] uppercase px-6 py-3 font-medium">
                Sold Out
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="pt-4 pb-3">
        {/* Name & Price */}
        <Link href={`/products/${product.id}`}>
          <h3
            className="text-stone-800 font-light hover:text-stone-500 transition-colors leading-snug"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.15rem" }}
          >
            {product.name}
          </h3>
        </Link>

        <div className="flex justify-between items-center mt-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-stone-700 text-sm font-medium">
              ₹{product.price.toLocaleString()}
            </p>
            {showDiscount && product.original_price && (
              <>
                <p className="text-stone-400 text-xs line-through">
                  ₹{product.original_price.toLocaleString()}
                </p>
                <span className="text-emerald-600 text-xs font-medium tracking-wide">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>
          {isOutOfStock && (
            <span className="text-xs text-stone-400 tracking-wide">Sold Out</span>
          )}
        </div>

        {/* Size chips preview */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {product.sizes.slice(0, 4).map((size) => {
            const sizeStock = product.size_inventory?.[size] ?? 0;
            const sizeOut = isOutOfStock || sizeStock === 0;
            const sizeLow = !isOutOfStock && sizeStock > 0 && sizeStock <= LOW_STOCK_THRESHOLD;
            return (
              <span
                key={size}
                className={`relative text-xs border px-2 py-0.5 transition-colors ${
                  sizeOut
                    ? "border-stone-100 text-stone-300 line-through bg-stone-50"
                    : "border-stone-200 text-stone-400 hover:border-stone-500 hover:text-stone-700 cursor-pointer"
                }`}
              >
                {size}
                {sizeLow && (
                  <span
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] leading-none min-w-[14px] h-[14px] px-1 rounded-full font-semibold flex items-center justify-center"
                    title={`Only ${sizeStock} left`}
                  >
                    {sizeStock}
                  </span>
                )}
              </span>
            );
          })}
          {product.sizes.length > 4 && (
            <span className="text-xs text-stone-400 px-1 py-0.5">
              +{product.sizes.length - 4}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
