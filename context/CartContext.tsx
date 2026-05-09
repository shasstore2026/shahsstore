"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { CartItem, Product } from "@/types";

export type StockIssue = {
  id: string;
  size: string;
  name: string;
  requested: number;
  available: number;
  reason: "out_of_stock" | "insufficient_stock" | "product_unavailable" | "product_removed";
};

export type QuantityUpdateResult =
  | { ok: true; quantity: number }
  | { ok: false; quantity: number; reason: "max_stock_reached"; available: number };

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, size: string, bottomSize?: string) => void;
  removeFromCart: (id: string, size: string) => void;
  updateQuantity: (id: string, selectedSize: string, qty: number) => QuantityUpdateResult;
  updateSize: (id: string, oldSize: string, newSize: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  validateStock: () => Promise<StockIssue[]>;
  applyStockFixes: (issues: StockIssue[]) => void;
  /** Stock available for a given (productId, size) based on the cart item's
   *  cached size_inventory. Returns null if the item isn't in the cart or
   *  inventory data is missing. */
  getAvailableStock: (id: string, size: string) => number | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_KEY = "shasstore_cart";

/**
 * Validate one localStorage cart entry. Returns null if the row is malformed
 * or contains anything we didn't expect — defense against tampered cart data
 * (XSS in another tab, malicious browser extension, dev-tools edit) trying to
 * inject prototype-polluting keys or impossible quantities into our state.
 */
function sanitizeStoredCartItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  // JSON.parse already returns null prototype values for __proto__ keys in
  // modern V8 (Node 22+, all recent browsers). We additionally never spread
  // `o` into our return value — only read explicit keys — so the only safe
  // path forward is a strict allowlist of fields below.
  const o = raw as Record<string, unknown>;

  const id = typeof o.id === "string" ? o.id.slice(0, 64) : null;
  const name = typeof o.name === "string" ? o.name.slice(0, 200) : null;
  const price = typeof o.price === "number" && Number.isFinite(o.price) ? o.price : null;
  const image = typeof o.image === "string" ? o.image.slice(0, 500) : null;
  const category = typeof o.category === "string" ? o.category.slice(0, 100) : null;
  const selectedSize =
    typeof o.selectedSize === "string" ? o.selectedSize.slice(0, 20) : null;
  const selectedBottomSize =
    typeof o.selectedBottomSize === "string" && o.selectedBottomSize.trim()
      ? o.selectedBottomSize.slice(0, 20)
      : undefined;
  const quantityRaw = Number(o.quantity);
  const quantity = Number.isFinite(quantityRaw)
    ? Math.max(1, Math.min(10, Math.floor(quantityRaw)))
    : null;

  if (!id || !name || price === null || !selectedSize || quantity === null) {
    return null;
  }

  // Sanitise inventory maps — only string keys with non-negative ints
  function sanitizeInventoryMap(raw: unknown): Record<string, number> | undefined {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
    const inv: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const key = String(k).trim().slice(0, 20);
      if (!key) continue;
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(n) && n >= 0) inv[key] = Math.floor(n);
    }
    return inv;
  }

  const size_inventory = sanitizeInventoryMap(o.size_inventory);
  const bottom_size_inventory = sanitizeInventoryMap(o.bottom_size_inventory);

  // Build a fresh object — never spread the untrusted source
  return {
    id,
    name,
    price,
    image: image ?? "",
    category: category ?? "",
    selectedSize,
    selectedBottomSize,
    quantity,
    description: typeof o.description === "string" ? o.description.slice(0, 5000) : "",
    inStock: typeof o.inStock === "boolean" ? o.inStock : true,
    sizes: Array.isArray(o.sizes)
      ? (o.sizes as unknown[])
          .filter((s): s is string => typeof s === "string")
          .slice(0, 20)
      : [],
    bottom_sizes: Array.isArray(o.bottom_sizes)
      ? (o.bottom_sizes as unknown[])
          .filter((s): s is string => typeof s === "string")
          .slice(0, 20)
      : [],
    size_inventory,
    bottom_size_inventory,
  } as CartItem;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // ── Load from localStorage on first render ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;
      const safe = parsed
        .slice(0, 50)
        .map(sanitizeStoredCartItem)
        .filter((i): i is CartItem => i !== null);
      setCartItems(safe);
    } catch {
      // Malformed JSON — start with an empty cart
      localStorage.removeItem(CART_KEY);
    }
  }, []);

  // ── Save to localStorage whenever cart changes ──
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, size: string, bottomSize?: string) => {
    const cleanBottom = bottomSize && bottomSize.trim() ? bottomSize : undefined;
    setCartItems((prev) => {
      // A line is unique on (id, top size, bottom size) — co-ord sets with
      // different bottom sizes are separate cart entries.
      const existing = prev.find(
        (item) =>
          item.id === product.id &&
          item.selectedSize === size &&
          (item.selectedBottomSize ?? undefined) === cleanBottom
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id &&
          item.selectedSize === size &&
          (item.selectedBottomSize ?? undefined) === cleanBottom
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          quantity: 1,
          selectedSize: size,
          selectedBottomSize: cleanBottom,
        },
      ];
    });
  };

  const removeFromCart = (id: string, size: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.id === id && item.selectedSize === size))
    );
  };

  const getAvailableStock = useCallback(
    (id: string, size: string): number | null => {
      const item = cartItems.find((i) => i.id === id && i.selectedSize === size);
      if (!item || !item.size_inventory) return null;
      const v = item.size_inventory[size];
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    },
    [cartItems]
  );

  // ── Update quantity, clamped against cached size_inventory ──
  // Returns { ok: false, available } if the requested quantity exceeds stock
  // we know about, so the UI can show inline "Only N left" messaging
  // without a popup. The check is best-effort — actual validation against
  // current DB state still happens on cart load + at checkout.
  const updateQuantity = (
    id: string,
    selectedSize: string,
    qty: number
  ): QuantityUpdateResult => {
    const safeQty = Math.max(1, Math.floor(qty));
    const available = getAvailableStock(id, selectedSize);
    const cap = available !== null ? Math.min(safeQty, available) : safeQty;

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && item.selectedSize === selectedSize
          ? { ...item, quantity: cap }
          : item
      )
    );

    if (available !== null && safeQty > available) {
      return { ok: false, quantity: cap, reason: "max_stock_reached", available };
    }
    return { ok: true, quantity: cap };
  };

  // ── NEW: Update size ──
  const updateSize = (id: string, oldSize: string, newSize: string) => {
    if (oldSize === newSize) return;
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === id && i.selectedSize === newSize);
      if (existing) {
        // Merge quantities if new size already exists in cart
        return prev
          .map((i) =>
            i.id === id && i.selectedSize === newSize
              ? { ...i, quantity: i.quantity + (prev.find((x) => x.id === id && x.selectedSize === oldSize)?.quantity ?? 1) }
              : i
          )
          .filter((i) => !(i.id === id && i.selectedSize === oldSize));
      }
      return prev.map((i) =>
        i.id === id && i.selectedSize === oldSize ? { ...i, selectedSize: newSize } : i
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(CART_KEY);
  };

  // Validate cart stock against current DB state.
  // The same call also silently syncs price/name/image so a customer never
  // sees stale data after an admin edit — applied in the background without
  // any user-facing "price changed" message.
  const validateStock = useCallback(async (): Promise<StockIssue[]> => {
    if (cartItems.length === 0) return [];
    try {
      const res = await fetch("/api/validate-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((i) => ({
            id: i.id,
            selectedSize: i.selectedSize,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });
      const data = await res.json();

      // Silent product-data sync (price, name, image) — no UI surfaced.
      const updates = Array.isArray(data.updates) ? data.updates : [];
      if (updates.length > 0) {
        setCartItems((prev) => {
          let dirty = false;
          const next = prev.map((item) => {
            const u = updates.find(
              (x: { id: string; size: string }) =>
                x.id === item.id && x.size === item.selectedSize
            );
            if (!u) return item;
            const priceChanged =
              typeof u.price === "number" &&
              Number.isFinite(u.price) &&
              u.price !== item.price;
            const nameChanged = typeof u.name === "string" && u.name !== item.name;
            const imageChanged = typeof u.image === "string" && u.image && u.image !== item.image;
            if (!priceChanged && !nameChanged && !imageChanged) return item;
            dirty = true;
            return {
              ...item,
              price: priceChanged ? u.price : item.price,
              name: nameChanged ? u.name : item.name,
              image: imageChanged ? u.image : item.image,
            };
          });
          return dirty ? next : prev;
        });
      }

      if (data.valid === false) return data.issues ?? [];
      return [];
    } catch {
      return [];
    }
  }, [cartItems]);

  // Apply fixes for stock issues automatically
  const applyStockFixes = (issues: StockIssue[]) => {
    if (issues.length === 0) return;
    setCartItems((prev) => {
      const next = [...prev];
      for (const issue of issues) {
        const idx = next.findIndex(
          (i) => i.id === issue.id && i.selectedSize === issue.size
        );
        if (idx === -1) continue;
        if (
          issue.reason === "out_of_stock" ||
          issue.reason === "product_unavailable" ||
          issue.reason === "product_removed"
        ) {
          next.splice(idx, 1);
        } else if (issue.reason === "insufficient_stock") {
          next[idx] = { ...next[idx], quantity: Math.max(1, issue.available) };
        }
      }
      return next;
    });
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateSize,
        clearCart,
        totalItems,
        totalPrice,
        validateStock,
        applyStockFixes,
        getAvailableStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
