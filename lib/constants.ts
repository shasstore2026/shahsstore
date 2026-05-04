/** Default delivery charge in INR (used as fallback) */
export const DEFAULT_DELIVERY_CHARGE = 99;

/** Default free delivery threshold in INR (used as fallback) */
export const DEFAULT_FREE_DELIVERY_THRESHOLD = 2000;

/** Calculate total stock from size_inventory */
export function getTotalStock(sizeInventory?: Record<string, number>): number {
  if (!sizeInventory) return 0;
  return Object.values(sizeInventory).reduce((sum, qty) => sum + (qty || 0), 0);
}

/** Get available stock for a specific size */
export function getStockForSize(
  sizeInventory: Record<string, number> | undefined,
  size: string
): number {
  if (!sizeInventory) return 0;
  return sizeInventory[size] ?? 0;
}

/** Low stock threshold — show "Only X left" warning when stock is at or below this */
export const LOW_STOCK_THRESHOLD = 3;

/** Calculate discount percentage from original and current price */
export function getDiscountPercent(
  currentPrice: number,
  originalPrice?: number | null
): number {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round((1 - currentPrice / originalPrice) * 100);
}

/** Calculate delivery charge based on subtotal and settings */
export function getDeliveryCharge(
  subtotal: number,
  deliveryCharge: number = DEFAULT_DELIVERY_CHARGE,
  freeThreshold: number = DEFAULT_FREE_DELIVERY_THRESHOLD
): number {
  if (freeThreshold > 0 && subtotal >= freeThreshold) return 0;
  return deliveryCharge;
}
