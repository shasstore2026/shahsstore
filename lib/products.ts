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
export type Category = {
  id: string;
  name: string;
  description: string;
  image: string;
  display_order: number;
};

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) { console.error(error.message); return []; }
  return data;
}

// ── Homepage content ──────────────────────────────
export type LookbookImage = { image: string; link?: string; label?: string };
export type Testimonial = { quote: string; name: string; place: string };

export type HomepageContent = {
  // legacy / hero
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  hero_cta_link: string;
  hero_image: string;
  // USP marquee strip on homepage (also still used by old marquee admin page)
  marquee_items: string[];
  // legacy story/cta fields — kept for backwards compatibility
  why_title: string;
  cta_title: string;
  cta_subtitle: string;
  cta_button_text: string;
  // top notification (separate row component, also lives on homepage)
  top_notification_enabled?: boolean;
  top_notification_items?: string[];

  // ── Story / editorial spotlight ────────────────────
  story_eyebrow: string;
  story_title: string;
  story_subtitle: string;
  story_paragraph: string;
  story_image: string;
  story_cta_text: string;
  story_cta_link: string;

  // ── Lookbook ───────────────────────────────────────
  lookbook_eyebrow: string;
  lookbook_title: string;
  lookbook_subtitle: string;
  lookbook_images: LookbookImage[];

  // ── Testimonials ───────────────────────────────────
  testimonials_eyebrow: string;
  testimonials_title: string;
  testimonials: Testimonial[];

  // ── Instagram ──────────────────────────────────────
  instagram_eyebrow: string;
  instagram_title: string;
  instagram_handle: string;
  instagram_profile_url: string;
  instagram_images: string[];

  // ── Closing CTA ────────────────────────────────────
  closing_cta_eyebrow: string;
  closing_cta_title: string;
  closing_cta_title_accent: string;
  closing_cta_subtitle: string;
  closing_cta_primary_text: string;
  closing_cta_primary_link: string;
  closing_cta_secondary_text: string;
  closing_cta_secondary_link: string;

  // ── Section visibility toggles ─────────────────────
  show_usp_strip: boolean;
  show_categories: boolean;
  show_featured: boolean;
  show_story: boolean;
  show_lookbook: boolean;
  show_testimonials: boolean;
  show_instagram: boolean;
  show_closing_cta: boolean;

  // Surfaced for admin form (passed back when editing)
  id?: string;
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

/**
 * Default fallback shape — every field has a friendly placeholder so the
 * homepage renders gracefully even before the admin fills anything in.
 */
function emptyHomepageContent(): HomepageContent {
  return {
    hero_title: "Curated Pieces, Just For You",
    hero_subtitle: "",
    hero_cta_text: "Explore",
    hero_cta_link: "/products",
    hero_image: "",
    marquee_items: [
      "Free Shipping Over ₹2000",
      "Hand-curated Edits",
      "14-Day Easy Returns",
      "Premium Fabrics & Finishes",
      "Made With Love in India",
    ],
    why_title: "",
    cta_title: "",
    cta_subtitle: "",
    cta_button_text: "Shop All",
    top_notification_enabled: false,
    top_notification_items: [],

    story_eyebrow: "Our Story",
    story_title: "Curated for the moments you'll remember.",
    story_subtitle:
      "Every piece in our boutique is chosen with care.",
    story_paragraph: "",
    story_image: "",
    story_cta_text: "Shop the Edit",
    story_cta_link: "/products",

    lookbook_eyebrow: "The Lookbook",
    lookbook_title: "Styled for the season",
    lookbook_subtitle: "",
    lookbook_images: [],

    testimonials_eyebrow: "Loved By",
    testimonials_title: "From our community",
    testimonials: [],

    instagram_eyebrow: "Follow Along",
    instagram_title: "@shasstore on Instagram",
    instagram_handle: "@shasstore",
    instagram_profile_url: "",
    instagram_images: [],

    closing_cta_eyebrow: "The Shasstore Promise",
    closing_cta_title: "",
    closing_cta_title_accent: "",
    closing_cta_subtitle: "",
    closing_cta_primary_text: "Shop the Collection",
    closing_cta_primary_link: "/products",
    closing_cta_secondary_text: "",
    closing_cta_secondary_link: "",

    show_usp_strip: true,
    show_categories: true,
    show_featured: true,
    show_story: true,
    show_lookbook: true,
    show_testimonials: true,
    show_instagram: true,
    show_closing_cta: true,
  };
}

export async function getHomepageContent(): Promise<HomepageContent> {
  const { data, error } = await supabase
    .from("homepage_content")
    .select("*")
    .single();

  if (error || !data) {
    if (error) console.error(error.message);
    return emptyHomepageContent();
  }

  // Coerce jsonb columns into typed arrays. Postgres returns them as parsed
  // JS objects, but if older rows have null we fill with empty arrays.
  const lookbook = Array.isArray(data.lookbook_images)
    ? (data.lookbook_images as LookbookImage[])
    : [];
  const testimonials = Array.isArray(data.testimonials)
    ? (data.testimonials as Testimonial[])
    : [];

  // Merge with defaults so the homepage works even if a column is null.
  const fallback = emptyHomepageContent();
  return {
    ...fallback,
    ...data,
    lookbook_images: lookbook,
    testimonials,
    marquee_items: Array.isArray(data.marquee_items) ? data.marquee_items : fallback.marquee_items,
    instagram_images: Array.isArray(data.instagram_images) ? data.instagram_images : [],
  };
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
