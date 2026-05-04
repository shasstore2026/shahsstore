export interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image: string;
  images?: string[];
  category: string;
  sizes: string[];
  size_inventory?: Record<string, number>;
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
  selectedSize: string;
}
