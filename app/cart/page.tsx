"use client";
import { useCart, type StockIssue } from "@/context/CartContext";
import { DEFAULT_DELIVERY_CHARGE, DEFAULT_FREE_DELIVERY_THRESHOLD, getDeliveryCharge } from "@/lib/constants";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, updateSize, totalPrice, validateStock, applyStockFixes, getAvailableStock } = useCart();
  const router = useRouter();
  const [deliveryCharge, setDeliveryCharge] = useState(DEFAULT_DELIVERY_CHARGE);
  const [freeThreshold, setFreeThreshold] = useState(DEFAULT_FREE_DELIVERY_THRESHOLD);
  const [stockIssues, setStockIssues] = useState<StockIssue[]>([]);
  // Per-row "Only N left" hint shown briefly when user tries to exceed stock.
  // Keyed by `${id}-${size}`; cleared after a few seconds.
  const [stockHints, setStockHints] = useState<Record<string, { available: number; expires: number }>>({});
  const [checkingOut, setCheckingOut] = useState(false);

  // Auto-clear expired hints
  useEffect(() => {
    if (Object.keys(stockHints).length === 0) return;
    const t = setTimeout(() => {
      const now = Date.now();
      setStockHints((prev) => {
        const next: typeof prev = {};
        for (const [k, v] of Object.entries(prev)) {
          if (v.expires > now) next[k] = v;
        }
        return next;
      });
    }, 3500);
    return () => clearTimeout(t);
  }, [stockHints]);

  const handleIncrement = (id: string, size: string, currentQty: number) => {
    const result = updateQuantity(id, size, currentQty + 1);
    if (!result.ok && result.reason === "max_stock_reached") {
      setStockHints((prev) => ({
        ...prev,
        [`${id}-${size}`]: { available: result.available, expires: Date.now() + 3000 },
      }));
    }
  };

  const handleProceedToCheckout = async () => {
    setCheckingOut(true);
    const issues = await validateStock();
    setStockIssues(issues);
    if (issues.length > 0) {
      setCheckingOut(false);
      // Scroll the issues banner into view
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push("/checkout");
  };

  useEffect(() => {
    fetch("/api/delivery-settings")
      .then((res) => res.json())
      .then((data) => {
        setDeliveryCharge(data.delivery_charge ?? DEFAULT_DELIVERY_CHARGE);
        setFreeThreshold(data.free_delivery_threshold ?? DEFAULT_FREE_DELIVERY_THRESHOLD);
      })
      .catch(() => {});
  }, []);

  // Validate stock when cart page loads or when cart changes
  useEffect(() => {
    if (cartItems.length === 0) {
      setStockIssues([]);
      return;
    }
    let cancelled = false;
    validateStock().then((issues) => {
      if (!cancelled) setStockIssues(issues);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.length]);

  const handleApplyFixes = () => {
    applyStockFixes(stockIssues);
    setStockIssues([]);
  };

  const formatIssue = (issue: StockIssue) => {
    if (issue.reason === "out_of_stock") return `${issue.name} (Size ${issue.size}) is no longer available`;
    if (issue.reason === "insufficient_stock")
      return `${issue.name} (Size ${issue.size}): only ${issue.available} available, you have ${issue.requested}`;
    if (issue.reason === "product_unavailable") return `${issue.name} is no longer available`;
    if (issue.reason === "product_removed") return `An item in your cart has been removed`;
    return issue.name;
  };

  if (cartItems.length === 0)
    return (
      <div className="bg-[var(--color-shas-bg)] min-h-screen flex items-center justify-center pt-24">
        <div className="text-center px-8 max-w-md reveal">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-shas-blush)]/40 flex items-center justify-center">
            <svg className="w-9 h-9 text-[var(--color-shas-rose)]" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
          </div>
          <p className="font-display text-4xl md:text-5xl text-[var(--color-shas-plum)] font-light mb-4">
            Your bag is empty.
          </p>
          <p className="text-[var(--color-shas-muted)] text-sm font-light mb-8 italic">
            Take your time. Your perfect piece is waiting.
          </p>
          <Link href="/products" className="btn-plum">
            Browse the Collection
          </Link>
        </div>
      </div>
    );

  return (
    <div className="bg-[var(--color-shas-bg)] min-h-screen pt-24 md:pt-32 pb-12 md:pb-24">
      <div className="max-w-5xl mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="mb-8 md:mb-12 reveal">
          <span className="divider-rose mb-3">Review</span>
          <h1 className="font-display text-4xl md:text-6xl text-[var(--color-shas-plum)] font-light">
            Your Bag
          </h1>
          <p className="text-[var(--color-shas-muted)] text-sm font-light mt-2">
            {cartItems.length} {cartItems.length === 1 ? "piece" : "pieces"} ready for you
          </p>
        </div>

        {/* Stock issues banner */}
        {stockIssues.length > 0 && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4 md:p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-amber-500 text-lg">⚠</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  Availability has changed since you added these items
                </p>
                <ul className="text-xs text-amber-700 space-y-1 mb-3">
                  {stockIssues.map((issue, i) => (
                    <li key={i}>• {formatIssue(issue)}</li>
                  ))}
                </ul>
                <button
                  onClick={handleApplyFixes}
                  className="text-xs bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition-colors uppercase tracking-widest font-medium"
                >
                  Update My Cart
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => {
              const available = getAvailableStock(item.id, item.selectedSize);
              const atMax = available !== null && item.quantity >= available;
              const hint = stockHints[`${item.id}-${item.selectedSize}`];
              return (
              <div
                key={`${item.id}-${item.selectedSize}`}
                className="flex gap-6 surface-soft p-5"
              >
                {/* Image */}
                <div className="relative w-24 h-28 bg-[var(--color-shas-cream)] flex-shrink-0 overflow-hidden">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-[0.65rem] tracking-[0.25em] text-[var(--color-shas-rose)] uppercase mb-1">
                    {item.category}
                  </p>
                  <h3 className="font-display text-[var(--color-shas-plum)] font-light leading-snug text-lg">
                    {item.name}
                  </h3>

                  {/* ── Size dropdown ── */}
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs text-[var(--color-shas-muted)] tracking-wide">Size:</label>
                    <select
                      value={item.selectedSize}
                      onChange={(e) => updateSize(item.id, item.selectedSize, e.target.value)}
                      className="text-xs text-[var(--color-shas-plum)] border border-[var(--color-shas-line)] bg-white px-2 py-1 focus:outline-none focus:border-[var(--color-shas-muted)] transition-colors cursor-pointer hover:border-[var(--color-shas-muted)]"
                    >
                      {item.sizes.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* ── Quantity + price ── */}
                  <div className="flex justify-between items-end mt-4">

                    {/* Quantity stepper — minus at qty 1 removes the item */}
                    <div className="flex items-center gap-0 border border-[var(--color-shas-line)]">
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) {
                            removeFromCart(item.id, item.selectedSize);
                          } else {
                            updateQuantity(item.id, item.selectedSize, item.quantity - 1);
                          }
                        }}
                        title={item.quantity <= 1 ? "Remove from cart" : "Decrease quantity"}
                        className="w-8 h-8 flex items-center justify-center text-[var(--color-shas-muted)] hover:bg-[var(--color-shas-cream)] hover:text-red-500 transition-colors text-base"
                      >
                        {item.quantity <= 1 ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        ) : (
                          "−"
                        )}
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center text-xs font-medium text-[var(--color-shas-plum)] border-x border-[var(--color-shas-line)]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleIncrement(item.id, item.selectedSize, item.quantity)}
                        disabled={atMax}
                        title={atMax ? `Only ${available} available in size ${item.selectedSize}` : "Increase quantity"}
                        className="w-8 h-8 flex items-center justify-center text-[var(--color-shas-muted)] hover:bg-[var(--color-shas-cream)] transition-colors text-base disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        +
                      </button>
                    </div>

                    {/* Price only */}
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-[var(--color-shas-plum)] text-sm font-medium">
                        ₹{(item.price * item.quantity).toLocaleString()}
                        {item.quantity > 1 && (
                          <span className="text-[var(--color-shas-muted)] font-light ml-1 text-xs">
                            (₹{item.price.toLocaleString()} each)
                          </span>
                        )}
                      </p>
                    </div>

                  </div>

                  {/* Stock hint — appears briefly when user hits the cap */}
                  {hint && (
                    <p className="mt-2 text-xs text-amber-600">
                      Only {hint.available} available in size {item.selectedSize}.
                    </p>
                  )}
                  {atMax && !hint && (
                    <p className="mt-2 text-xs text-[var(--color-shas-muted)]">
                      Maximum available: {available}
                    </p>
                  )}
                </div>
              </div>
            );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="surface-soft p-8 sticky top-28">
              <h2 className="font-display text-2xl text-[var(--color-shas-plum)] font-light mb-6">
                Bag Summary
              </h2>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-[var(--color-shas-muted)]">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[var(--color-shas-muted)]">
                  <span>Delivery</span>
                  <span className={getDeliveryCharge(totalPrice, deliveryCharge, freeThreshold) === 0 ? "text-[var(--color-shas-sage)] font-medium" : ""}>
                    {getDeliveryCharge(totalPrice, deliveryCharge, freeThreshold) === 0 ? "Complimentary" : `₹${deliveryCharge}`}
                  </span>
                </div>
                {freeThreshold > 0 && totalPrice < freeThreshold && (
                  <div className="bg-[var(--color-shas-blush)]/30 px-3 py-2 -mx-1 rounded-sm">
                    <p className="text-xs text-[var(--color-shas-plum)] font-light">
                      Add <span className="font-medium">₹{(freeThreshold - totalPrice).toLocaleString()}</span> more for free shipping
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--color-shas-line)] pt-5 mb-6 flex justify-between items-center">
                <span className="font-display text-xl text-[var(--color-shas-plum)]">Total</span>
                <span className="text-lg font-medium text-[var(--color-shas-plum)]">
                  ₹{(totalPrice + getDeliveryCharge(totalPrice, deliveryCharge, freeThreshold)).toLocaleString()}
                </span>
              </div>

              {stockIssues.length > 0 ? (
                <button
                  disabled
                  className="block w-full text-center bg-[var(--color-shas-line)] text-[var(--color-shas-muted)] py-4 text-xs tracking-[0.3em] uppercase font-medium cursor-not-allowed"
                  title="Resolve availability issues to proceed"
                >
                  Resolve Availability Issues
                </button>
              ) : (
                <button
                  onClick={handleProceedToCheckout}
                  disabled={checkingOut}
                  className="flex w-full items-center justify-center bg-[var(--color-shas-plum)] text-white py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-[var(--color-shas-plum-soft)] transition-all duration-300 disabled:bg-[var(--color-shas-line-strong)] disabled:cursor-not-allowed"
                >
                  {checkingOut ? (
                    <span
                      aria-label="Loading"
                      className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    />
                  ) : (
                    "Proceed to Checkout"
                  )}
                </button>
              )}

              <Link
                href="/products"
                className="block text-center text-[0.65rem] text-[var(--color-shas-muted)] hover:text-[var(--color-shas-rose)] tracking-[0.3em] uppercase mt-4 transition-colors"
              >
                ← Continue Shopping
              </Link>

              {/* Trust badges */}
              <div className="mt-6 pt-6 border-t border-[var(--color-shas-line)] space-y-2">
                {[
                  ["✦", "Secure payment via Razorpay"],
                  ["✦", "14-day easy returns"],
                  ["✦", "Wrapped with care"],
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <span className="text-[var(--color-shas-rose)] text-xs">{icon}</span>
                    <p className="text-[0.7rem] text-[var(--color-shas-muted)] font-light">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
