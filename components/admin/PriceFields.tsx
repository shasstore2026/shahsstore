"use client";
import { useState } from "react";
import { getDiscountPercent } from "@/lib/constants";

export default function PriceFields({
  initialPrice,
  initialOriginalPrice,
}: {
  initialPrice?: number;
  initialOriginalPrice?: number | null;
}) {
  const [price, setPrice] = useState<number>(initialPrice ?? 0);
  const [originalPrice, setOriginalPrice] = useState<number | "">(
    initialOriginalPrice ?? ""
  );

  const discount = typeof originalPrice === "number"
    ? getDiscountPercent(price, originalPrice)
    : 0;
  const showDiscount = typeof originalPrice === "number" && originalPrice > price && discount > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Current Price */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">
            Current Price (₹) *
          </label>
          <input
            name="price"
            type="number"
            min={0}
            required
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
            placeholder="e.g. 1499"
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors"
          />
        </div>

        {/* Original Price */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">
            Original Price (₹){" "}
            <span className="normal-case text-stone-400">(MRP — optional)</span>
          </label>
          <input
            name="original_price"
            type="number"
            min={0}
            value={originalPrice}
            onChange={(e) => {
              const v = e.target.value;
              setOriginalPrice(v === "" ? "" : parseInt(v) || 0);
            }}
            placeholder="e.g. 1999"
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500 transition-colors"
          />
        </div>
      </div>

      {/* Discount Preview */}
      {typeof originalPrice === "number" && originalPrice > 0 && (
        <div className="bg-stone-50 border border-stone-100 p-4 rounded">
          <p className="text-xs tracking-widest uppercase text-stone-400 mb-2">
            Customer Will See
          </p>
          {showDiscount ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-stone-900 font-medium text-lg">
                ₹{price.toLocaleString()}
              </span>
              <span className="text-stone-400 line-through text-sm">
                ₹{originalPrice.toLocaleString()}
              </span>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded">
                {discount}% OFF
              </span>
            </div>
          ) : (
            <p className="text-xs text-amber-600">
              ⚠ Original price should be higher than current price to show discount
            </p>
          )}
        </div>
      )}
    </div>
  );
}
