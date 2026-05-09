export interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image: string;
  images?: string[];
  category: string;
  /** Top-half sizes (renamed UI-side from "Sizes"). Empty array → no top selector. */
  sizes: string[];
  /** Per-top-size stock count. */
  size_inventory?: Record<string, number>;
  /** Bottom-half sizes (skirts / pants / co-ord set bottoms). Empty → no bottom selector. */
  bottom_sizes?: string[];
  /** Per-bottom-size stock count. */
  bottom_size_inventory?: Record<string, number>;
  description: string;
  inStock: boolean;
  featuredOrder?: number | null;
  free_delivery?: boolean;
  returns_days?: number;
  premium_fabric?: boolean;
  product_details?: Record<string, string>;
  about_items?: string[];
  style_specs?: Record<string, string>;
}

export interface CartItem extends Product {
  quantity: number;
  /** Top size selected. Always required (UI defaults to first size if no top sizes). */
  selectedSize: string;
  /** Bottom size selected — only present when the product has bottom_sizes. */
  selectedBottomSize?: string;
}
