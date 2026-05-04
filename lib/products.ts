import { supabase } from "@/lib/supabase";
import { Product } from "@/types";

function mapProduct(row: Record<string, unknown>): Product {
  const primaryImage = row.image as string;

  // Safely parse images — handles both JS array and null
  let images: string[] = [primaryImage];
  if (Array.isArray(row.images) && row.images.length > 0) {
    images = row.images as string[];
  }

  return {
    id: row.id as string,
    name: row.name as string,
    price: row.price as number,
    original_price: (row.original_price as number | null) ?? null,
    image: primaryImage,
    images,
    category: row.category as string,
    sizes: row.sizes as string[],
    size_inventory: (row.size_inventory as Record<string, number>) ?? {},
    description: row.description as string,
    inStock: row.in_stock as boolean,
    featuredOrder: row.featured_order as number | null,
    product_details: (row.product_details as Record<string, string>) ?? {},
    about_items: (row.about_items as string[]) ?? [],
    style_specs: (row.style_specs as Record<string, string>) ?? {},
  };
}


export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) { console.error(error.message); return []; }
  return data.map(mapProduct);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: true });

  if (error) { console.error(error.message); return []; }
  return data.map(mapProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) { console.error(error.message); return null; }
  return mapProduct(data);
}

export async function getRelatedProducts(category: string, excludeId: string, limit = 4): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .neq("id", excludeId)
    .limit(limit);

  if (error) { console.error(error.message); return []; }
  return data.map(mapProduct);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .not("featured_order", "is", null)
    .order("featured_order", { ascending: true })
    .limit(4);

  if (error) { console.error(error.message); return []; }
  return data.map(mapProduct);
}

// ── Shirt styles ──────────────────────────────────
export type ShirtStyle = {
  id: string;
  name: string;
  description: string;
  image: string;
  display_order: number;
};

export async function getShirtStyles(): Promise<ShirtStyle[]> {
  const { data, error } = await supabase
    .from("shirt_styles")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) { console.error(error.message); return []; }
  return data;
}

// ── Homepage content ──────────────────────────────
export type HomepageContent = {
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  hero_cta_link: string;
  hero_image: string;
  marquee_items: string[];
  why_title: string;
  cta_title: string;
  cta_subtitle: string;
  cta_button_text: string;
  top_notification_enabled?: boolean;
  top_notification_items?: string[];
};

export type MaintenanceStatus = {
  enabled: boolean;
  message: string;
  phone1: string;
  phone2: string;
};

export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
  const { data, error } = await supabase
    .from("homepage_content")
    .select("maintenance_mode_enabled, maintenance_message, maintenance_phone1, maintenance_phone2")
    .single();
  if (error || !data) {
    return { enabled: false, message: "Site Under Maintenance", phone1: "", phone2: "" };
  }
  return {
    enabled: (data.maintenance_mode_enabled as boolean) ?? false,
    message: (data.maintenance_message as string) ?? "Site Under Maintenance",
    phone1: (data.maintenance_phone1 as string) ?? "",
    phone2: (data.maintenance_phone2 as string) ?? "",
  };
}

export async function getTopNotification(): Promise<{
  enabled: boolean;
  items: string[];
  bgColor: string;
  textColor: string;
  fontSize: number;
}> {
  const fallback = {
    enabled: false,
    items: [] as string[],
    bgColor: "#1c1917",
    textColor: "#ffffff",
    fontSize: 12,
  };
  const { data, error } = await supabase
    .from("homepage_content")
    .select("top_notification_enabled, top_notification_items, top_notification_bg_color, top_notification_text_color, top_notification_font_size")
    .single();
  if (error || !data) return fallback;
  return {
    enabled: data.top_notification_enabled ?? false,
    items: (data.top_notification_items as string[]) ?? [],
    bgColor: (data.top_notification_bg_color as string) ?? fallback.bgColor,
    textColor: (data.top_notification_text_color as string) ?? fallback.textColor,
    fontSize: (data.top_notification_font_size as number) ?? fallback.fontSize,
  };
}

export async function getHomepageContent(): Promise<HomepageContent> {
  const { data, error } = await supabase
    .from("homepage_content")
    .select("*")
    .single();

  if (error) {
    console.error(error.message);
    return {
      hero_title: "A Shirt for Every Moment",
      hero_subtitle: "Premium men's shirts crafted for comfort and style",
      hero_cta_text: "Explore Collection",
      hero_cta_link: "/products",
      hero_image: "",
      marquee_items: [
        "Free Delivery Over ₹2000",
        "14 Day Returns",
        "Premium Shirt Fabrics",
        "Specialist in Men's Shirts",
      ],
      why_title: "The Shirt Specialists",
      cta_title: "A Shirt for Every Chapter of Your Day.",
      cta_subtitle:
        "Morning meetings. Weekend brunches. Evening events. Shasstore has the perfect shirt for every moment — crafted to last, designed to impress.",
      cta_button_text: "Shop All Shirts",
    };
  }
  return data;
}
// Hero banner------------------------
export type HeroBanner = {
  id: string;
  season_label: string;
  headline_line1: string;
  headline_line2: string;
  headline_italic: string;
  subtext: string;
  main_image: string;
  stat1_value: string;
  stat1_label: string;
  stat2_value: string;
  stat2_label: string;
  stat3_value: string;
  stat3_label: string;
  accent_card_title: string;
  accent_card_price: string;
  accent_card_link: string;
  accent_card_badge: string;
};

export async function getHeroBanner(): Promise<HeroBanner | null> {
  const { data, error } = await supabase
    .from("hero_banner")
    .select("*")
    .single();

  if (error) { console.error(error.message); return null; }
  return data;
}

export type HelpContent = {
  id: string;
  size_guide: string;
  returns: string;
  shipping: string;
  faq: { question: string; answer: string }[];
};

export async function getHelpContent(): Promise<HelpContent | null> {
  const { data, error } = await supabase
    .from("help_content")
    .select("*")
    .single();
  if (error) { console.error(error.message); return null; }
  return data;
}

export type CompanyContent = {
  id: string;
  about: string;
  contact: string;
  contact_email: string;
  contact_whatsapp: string;
  contact_phone: string;
  instagram_url: string;
  facebook_url: string;
};

export async function getCompanyContent(): Promise<CompanyContent | null> {
  const { data, error } = await supabase
    .from("company_content")
    .select("*")
    .single();
  if (error) { console.error(error.message); return null; }
  return {
    id: data.id,
    about: data.about ?? "",
    contact: data.contact ?? "",
    contact_email: data.contact_email ?? "",
    contact_whatsapp: data.contact_whatsapp ?? "",
    contact_phone: data.contact_phone ?? "",
    instagram_url: data.instagram_url ?? "",
    facebook_url: data.facebook_url ?? "",
  };
}
