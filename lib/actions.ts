"use server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { deleteImagesByUrls, cleanupOrphanedImages } from "@/lib/storage-cleanup";
import { isAdminUser } from "@/lib/admin-check";

/**
 * Verify the caller is an authenticated user AND a member of the admins table.
 * Authenticated alone is NOT enough — anyone with a Supabase account would
 * otherwise pass. Throws on either missing session or non-admin status.
 */
async function requireAuth() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  if (!(await isAdminUser(user.id))) throw new Error("Forbidden");
  return user;
}

/** Find the smallest unused positive integer for a featured_order */
async function suggestNextFeaturedOrder(): Promise<number> {
  const { data } = await supabaseAdmin
    .from("products")
    .select("featured_order")
    .not("featured_order", "is", null);
  const used = new Set(
    (data ?? []).map((r) => r.featured_order as number).filter((n) => n != null)
  );
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

/** Throw friendly error if featured_order is already used by another product */
async function ensureFeaturedOrderAvailable(
  featuredOrder: number | null,
  excludeId?: string
) {
  if (featuredOrder == null) return;

  let query = supabaseAdmin
    .from("products")
    .select("id, name")
    .eq("featured_order", featuredOrder);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query.limit(1);
  if (error) {
    console.error("featured_order check error:", error.message);
    return;
  }
  if (data && data.length > 0) {
    const next = await suggestNextFeaturedOrder();
    const conflictingProduct = data[0].name as string;
    throw new Error(
      `Featured order #${featuredOrder} is already used by "${conflictingProduct}". Try ${next} instead.`
    );
  }
}

/** Find smallest unused positive integer for categories.display_order */
async function suggestNextStyleOrder(): Promise<number> {
  const { data } = await supabaseAdmin.from("categories").select("display_order");
  const used = new Set(
    (data ?? []).map((r) => r.display_order as number).filter((n) => n != null)
  );
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

/** Throw friendly error if display_order is already used by another style */
async function ensureStyleOrderAvailable(
  displayOrder: number,
  excludeId?: string
) {
  if (!displayOrder || displayOrder < 1) return;

  let query = supabaseAdmin
    .from("categories")
    .select("id, name")
    .eq("display_order", displayOrder);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query.limit(1);
  if (error) {
    console.error("display_order check error:", error.message);
    return;
  }
  if (data && data.length > 0) {
    const next = await suggestNextStyleOrder();
    const conflictingStyle = data[0].name as string;
    throw new Error(
      `Display order #${displayOrder} is already used by "${conflictingStyle}". Try ${next} instead.`
    );
  }
}

/** Safely parse JSON, returning fallback on failure. */
function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed as T;
  } catch {
    return fallback;
  }
}

// ── Validation helpers (defense in depth — clients shouldn't be trusted even
// when they pass admin auth, since admin sessions can be hijacked) ──

/** Trim and cap a string to a max length. Returns null if empty/missing. */
function safeString(value: unknown, maxLen = 500): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLen);
}

/** Validate an integer in [min, max]. Returns null if out of range or NaN. */
function safeInt(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "string" ? parseInt(value, 10) : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

/** Validate an enum value. Returns null if not in the allowlist. */
function safeEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  if (typeof value !== "string") return null;
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

/** Sanitize a size_inventory object — only string keys with int >= 0 values. */
function sanitizeSizeInventory(obj: unknown): Record<string, number> {
  if (!obj || typeof obj !== "object") return {};
  const out: Record<string, number> = {};
  let count = 0;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (count >= 20) break;
    const key = String(k).trim().slice(0, 20);
    if (!key) continue;
    const qty = typeof v === "number" ? v : parseInt(String(v), 10);
    if (!Number.isFinite(qty) || qty < 0 || qty > 1000000) continue;
    out[key] = Math.floor(qty);
    count++;
  }
  return out;
}

/**
 * Validate that a URL is HTTPS and from our Supabase storage or a small
 * allow-list of public image hosts. We pin Supabase to our project ID — a
 * wildcard would let a malicious admin point images at any other Supabase
 * project, which Next.js Image would then fetch server-side (SSRF).
 */
function isAllowedImageUrl(url: string): boolean {
  if (typeof url !== "string" || !url.startsWith("https://")) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    return (
      host === "lgixdwopjzuedvqddeig.supabase.co" || // shasstore Supabase project
      host === "images.unsplash.com" ||
      host === "www.printmate.in" ||
      host === "encrypted-tbn0.gstatic.com"
    );
  } catch {
    return false;
  }
}

/** Sanitize an array of image URLs — reject non-HTTPS or unknown hosts. */
function sanitizeImageUrls(urls: unknown[], maxLen = 20): string[] {
  if (!Array.isArray(urls)) return [];
  return urls
    .slice(0, maxLen)
    .filter((u): u is string => typeof u === "string" && isAllowedImageUrl(u));
}

/** Sanitize an array of strings with a length cap per item and count cap. */
function sanitizeStringArray(arr: unknown[], maxItems = 30, maxItemLen = 500): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .map((s) => (typeof s === "string" ? s.trim().slice(0, maxItemLen) : ""))
    .filter(Boolean);
}

/** Sanitize a Record<string, string> with caps on key/value count and lengths. */
function sanitizeStringRecord(
  obj: unknown,
  maxEntries = 30,
  maxKeyLen = 100,
  maxValLen = 2000
): Record<string, string> {
  if (!obj || typeof obj !== "object") return {};
  const out: Record<string, string> = {};
  let count = 0;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (count >= maxEntries) break;
    const key = String(k).trim().slice(0, maxKeyLen);
    if (!key || typeof v !== "string") continue;
    out[key] = v.trim().slice(0, maxValLen);
    count++;
  }
  return out;
}

/**
 * Confirmation phrase for destructive actions. Sourced from env so the value
 * isn't hard-coded in source. We read NEXT_PUBLIC_* so the same value powers
 * both server validation (this file) AND the client modal that shows the
 * admin which phrase to type. Falls back to ADMIN_CONFIRMATION_PHRASE for
 * backward compat with earlier deployments. Hard-fails in production if
 * neither is set.
 */
function getConfirmationPhrase(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_ADMIN_CONFIRMATION_PHRASE ||
    process.env.ADMIN_CONFIRMATION_PHRASE;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv.trim().toLowerCase();
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_ADMIN_CONFIRMATION_PHRASE is not configured");
  }
  return "shasstore";
}

function requireConfirmation(phrase: string | undefined | null) {
  const expected = getConfirmationPhrase();
  if (
    typeof phrase !== "string" ||
    phrase.trim().toLowerCase() !== expected
  ) {
    throw new Error("Confirmation phrase incorrect");
  }
}

const PAYMENT_STATUSES = ["paid", "pending", "failed", "refunded"] as const;
const DELIVERY_STATUSES = ["pending", "confirmed", "handed_to_delivery"] as const;

export async function addProduct(formData: FormData) {
  await requireAuth();

  const name = safeString(formData.get("name") as string, 200);
  const price = safeInt(formData.get("price") as string, 0, 10000000);
  const originalPriceRaw = formData.get("original_price") as string;
  const original_price =
    originalPriceRaw && originalPriceRaw !== ""
      ? safeInt(originalPriceRaw, 0, 10000000)
      : null;
  const image = safeString(formData.get("image") as string, 500);
  const category = safeString(formData.get("category") as string, 100);
  const description = safeString(formData.get("description") as string, 5000);
  const sizeInventoryRaw = formData.get("size_inventory") as string;
  const size_inventory = sanitizeSizeInventory(
    safeJsonParse<Record<string, number>>(sizeInventoryRaw, {})
  );
  // Derive sizes (top sizes) from size_inventory keys
  let sizes = Object.keys(size_inventory).filter((k) => k.trim());
  if (sizes.length === 0) {
    const sizesRaw = formData.get("sizes") as string;
    sizes = (sizesRaw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // Bottom sizes — optional. Empty when not a co-ord/two-piece product.
  const bottomSizeInventoryRaw = formData.get("bottom_size_inventory") as string;
  const bottom_size_inventory = sanitizeSizeInventory(
    safeJsonParse<Record<string, number>>(bottomSizeInventoryRaw, {})
  );
  const bottom_sizes = Object.keys(bottom_size_inventory).filter((k) => k.trim());
  const inStock = formData.get("inStock") === "true";
  const featuredRaw = formData.get("featured_order") as string;
  const featured_order =
    featuredRaw && featuredRaw !== "" ? parseInt(featuredRaw) : null;
  const rawImages = safeJsonParse<string[]>(formData.get("images") as string, []);
  const images = sanitizeImageUrls(rawImages.length > 0 ? rawImages : [image].filter(Boolean));
  const product_details = sanitizeStringRecord(
    safeJsonParse<Record<string, string>>(formData.get("product_details") as string, {})
  );
  const about_items = sanitizeStringArray(
    safeJsonParse<string[]>(formData.get("about_items") as string, [])
  );
  const style_specs = sanitizeStringRecord(
    safeJsonParse<Record<string, string>>(formData.get("style_specs") as string, {})
  );

  if (!name) throw new Error("Product name is required");
  if (price === null) throw new Error("Invalid price (0 – 10,000,000)");
  if (!category) throw new Error("Category is required");
  if (sizes.length === 0) throw new Error("At least one size is required");
  if (image && !isAllowedImageUrl(image)) throw new Error("Invalid image URL");

  // Check featured_order uniqueness
  await ensureFeaturedOrderAvailable(featured_order);

  const { error } = await supabaseAdmin.from("products").insert([
    {
      name,
      price,
      original_price,
      image,
      category,
      description,
      sizes,
      size_inventory,
      bottom_sizes,
      bottom_size_inventory,
      in_stock: inStock,
      featured_order,
      images,
      product_details,
      about_items,
      style_specs,
    },
  ]);

  if (error) {
    console.error("addProduct error:", error.message);
    throw new Error("Failed to add product");
  }
  revalidatePath("/shasstorebyshahanas/products");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAuth();

  const name = safeString(formData.get("name") as string, 200);
  const price = safeInt(formData.get("price") as string, 0, 10000000);
  const originalPriceRaw = formData.get("original_price") as string;
  const original_price =
    originalPriceRaw && originalPriceRaw !== ""
      ? safeInt(originalPriceRaw, 0, 10000000)
      : null;
  const image = safeString(formData.get("image") as string, 500);
  const category = safeString(formData.get("category") as string, 100);
  const description = safeString(formData.get("description") as string, 5000);
  const sizeInventoryRaw = formData.get("size_inventory") as string;
  const size_inventory = sanitizeSizeInventory(
    safeJsonParse<Record<string, number>>(sizeInventoryRaw, {})
  );
  let sizes = Object.keys(size_inventory).filter((k) => k.trim());
  if (sizes.length === 0) {
    const sizesRaw = formData.get("sizes") as string;
    sizes = (sizesRaw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // Bottom sizes — optional
  const bottomSizeInventoryRaw = formData.get("bottom_size_inventory") as string;
  const bottom_size_inventory = sanitizeSizeInventory(
    safeJsonParse<Record<string, number>>(bottomSizeInventoryRaw, {})
  );
  const bottom_sizes = Object.keys(bottom_size_inventory).filter((k) => k.trim());

  const inStock = formData.get("inStock") === "true";
  const featuredRaw = formData.get("featured_order") as string;
  const featured_order =
    featuredRaw && featuredRaw !== "" ? parseInt(featuredRaw) : null;
  const rawImages = safeJsonParse<string[]>(formData.get("images") as string, []);
  const images = sanitizeImageUrls(rawImages.length > 0 ? rawImages : [image].filter(Boolean));
  const product_details = sanitizeStringRecord(
    safeJsonParse<Record<string, string>>(formData.get("product_details") as string, {})
  );
  const about_items = sanitizeStringArray(
    safeJsonParse<string[]>(formData.get("about_items") as string, [])
  );
  const style_specs = sanitizeStringRecord(
    safeJsonParse<Record<string, string>>(formData.get("style_specs") as string, {})
  );

  if (!name) throw new Error("Product name is required");
  if (price === null) throw new Error("Invalid price (0 – 10,000,000)");
  if (!category) throw new Error("Category is required");
  if (sizes.length === 0) throw new Error("At least one size is required");
  if (image && !isAllowedImageUrl(image)) throw new Error("Invalid image URL");

  // Check featured_order uniqueness (excluding this product)
  await ensureFeaturedOrderAvailable(featured_order, id);

  // Get the old images so we can clean up any that are no longer used
  const { data: oldProduct } = await supabaseAdmin
    .from("products")
    .select("image, images")
    .eq("id", id)
    .single();

  const { error } = await supabaseAdmin
    .from("products")
    .update({
      name,
      price,
      original_price,
      image,
      category,
      description,
      sizes,
      size_inventory,
      bottom_sizes,
      bottom_size_inventory,
      in_stock: inStock,
      featured_order,
      images,
      product_details,
      about_items,
      style_specs,
    })
    .eq("id", id);

  if (error) {
    console.error("updateProduct error:", error.message);
    throw new Error("Failed to update product");
  }

  // Delete any old images that are no longer in the new set
  if (oldProduct) {
    const oldUrls = new Set<string>();
    if (oldProduct.image) oldUrls.add(oldProduct.image as string);
    if (Array.isArray(oldProduct.images)) {
      for (const u of oldProduct.images as string[]) if (u) oldUrls.add(u);
    }
    const newUrls = new Set<string>();
    if (image) newUrls.add(image);
    for (const u of images ?? []) if (u) newUrls.add(u);
    const removed = [...oldUrls].filter((u) => !newUrls.has(u));
    if (removed.length > 0) {
      try {
        await deleteImagesByUrls(removed);
      } catch (e) {
        console.error("updateProduct: image cleanup failed:", e);
      }
    }
  }

  revalidatePath("/shasstorebyshahanas/products");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function deleteProduct(id: string, confirmation?: string) {
  await requireAuth();
  requireConfirmation(confirmation);

  // First, fetch the product's images so we can delete them after the row is removed
  const { data: product } = await supabaseAdmin
    .from("products")
    .select("image, images")
    .eq("id", id)
    .single();

  const { error } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteProduct error:", error.message);
    throw new Error("Failed to delete product");
  }

  // Delete associated images (best-effort — don't fail the whole op if storage hiccups)
  if (product) {
    const urls: (string | null | undefined)[] = [product.image as string | null];
    if (Array.isArray(product.images)) {
      urls.push(...(product.images as string[]));
    }
    try {
      await deleteImagesByUrls(urls);
    } catch (e) {
      console.error("deleteProduct: image cleanup failed:", e);
    }
  }

  revalidatePath("/shasstorebyshahanas/products");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function updateFeaturedOrder(id: string, order: number | null) {
  await requireAuth();

  await ensureFeaturedOrderAvailable(order, id);

  const { error } = await supabaseAdmin
    .from("products")
    .update({ featured_order: order })
    .eq("id", id);

  if (error) {
    console.error("updateFeaturedOrder error:", error.message);
    throw new Error("Failed to update featured order");
  }
  revalidatePath("/shasstorebyshahanas/products");
  revalidatePath("/");
}

// ── Categories ──────────────────────────────────

export async function addCategory(formData: FormData) {
  await requireAuth();

  const name = safeString(formData.get("name") as string, 100);
  const description = safeString(formData.get("description") as string, 1000);
  const image = safeString(formData.get("image") as string, 500);
  const display_order =
    parseInt(formData.get("display_order") as string) || 1;

  if (!name) throw new Error("Style name is required");
  if (image && !isAllowedImageUrl(image)) throw new Error("Invalid image URL");

  // Check display_order uniqueness
  await ensureStyleOrderAvailable(display_order);

  const { error } = await supabaseAdmin.from("categories").insert([
    {
      name,
      description,
      image,
      display_order,
    },
  ]);

  if (error) {
    console.error("addCategory error:", error.message);
    throw new Error("Failed to add shirt style");
  }
  revalidatePath("/shasstorebyshahanas/categories");
  revalidatePath("/");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAuth();

  const name = safeString(formData.get("name") as string, 100);
  const description = safeString(formData.get("description") as string, 1000);
  const image = safeString(formData.get("image") as string, 500);
  const display_order =
    parseInt(formData.get("display_order") as string) || 1;

  if (!name) throw new Error("Style name is required");
  if (image && !isAllowedImageUrl(image)) throw new Error("Invalid image URL");

  // Check display_order uniqueness (excluding this style)
  await ensureStyleOrderAvailable(display_order, id);

  // Get the old image to clean up if replaced
  const { data: oldStyle } = await supabaseAdmin
    .from("categories")
    .select("image")
    .eq("id", id)
    .single();

  const { error } = await supabaseAdmin
    .from("categories")
    .update({
      name,
      description,
      image,
      display_order,
    })
    .eq("id", id);

  if (error) {
    console.error("updateCategory error:", error.message);
    throw new Error("Failed to update shirt style");
  }

  // If the image changed, delete the old one
  if (oldStyle?.image && oldStyle.image !== image) {
    try {
      await deleteImagesByUrls([oldStyle.image as string]);
    } catch (e) {
      console.error("updateCategory: image cleanup failed:", e);
    }
  }

  revalidatePath("/shasstorebyshahanas/categories");
  revalidatePath("/");
}

export async function deleteCategory(id: string, confirmation?: string) {
  await requireAuth();
  requireConfirmation(confirmation);

  // Fetch the style's image first
  const { data: style } = await supabaseAdmin
    .from("categories")
    .select("image")
    .eq("id", id)
    .single();

  const { error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteCategory error:", error.message);
    throw new Error("Failed to delete shirt style");
  }

  // Delete associated image (best-effort)
  if (style?.image) {
    try {
      await deleteImagesByUrls([style.image as string]);
    } catch (e) {
      console.error("deleteCategory: image cleanup failed:", e);
    }
  }

  revalidatePath("/shasstorebyshahanas/categories");
  revalidatePath("/");
}

export async function updateHeroBanner(id: string, formData: FormData) {
  await requireAuth();

  const mainImage = safeString(formData.get("main_image") as string, 500);
  if (mainImage && !isAllowedImageUrl(mainImage)) {
    throw new Error("Invalid image URL");
  }

  const accentLink = safeString(formData.get("accent_card_link") as string, 200);
  if (accentLink && !accentLink.startsWith("/")) {
    throw new Error("Accent card link must be a relative path");
  }

  const { error } = await supabaseAdmin
    .from("hero_banner")
    .update({
      season_label: safeString(formData.get("season_label") as string, 100),
      headline_line1: safeString(formData.get("headline_line1") as string, 100),
      headline_line2: safeString(formData.get("headline_line2") as string, 100),
      headline_italic: safeString(formData.get("headline_italic") as string, 100),
      subtext: safeString(formData.get("subtext") as string, 300),
      main_image: mainImage,
      stat1_value: safeString(formData.get("stat1_value") as string, 20),
      stat1_label: safeString(formData.get("stat1_label") as string, 50),
      stat2_value: safeString(formData.get("stat2_value") as string, 20),
      stat2_label: safeString(formData.get("stat2_label") as string, 50),
      stat3_value: safeString(formData.get("stat3_value") as string, 20),
      stat3_label: safeString(formData.get("stat3_label") as string, 50),
      accent_card_title: safeString(formData.get("accent_card_title") as string, 100),
      accent_card_price: safeString(formData.get("accent_card_price") as string, 50),
      accent_card_link: accentLink,
      accent_card_badge: safeString(formData.get("accent_card_badge") as string, 50),
    })
    .eq("id", id);

  if (error) {
    console.error("updateHeroBanner error:", error.message);
    throw new Error("Failed to update hero banner");
  }
  revalidatePath("/");
}

export async function updateHelpContent(id: string, formData: FormData) {
  await requireAuth();

  const rawFaq = safeJsonParse<{ question: string; answer: string }[]>(
    formData.get("faq") as string,
    []
  );
  const faq = (Array.isArray(rawFaq) ? rawFaq : [])
    .slice(0, 50)
    .filter((item) => item && typeof item.question === "string" && typeof item.answer === "string")
    .map((item) => ({
      question: item.question.trim().slice(0, 500),
      answer: item.answer.trim().slice(0, 2000),
    }));

  const { error } = await supabaseAdmin
    .from("help_content")
    .update({
      size_guide: safeString(formData.get("size_guide") as string, 5000),
      returns: safeString(formData.get("returns") as string, 5000),
      shipping: safeString(formData.get("shipping") as string, 5000),
      faq,
    })
    .eq("id", id);

  if (error) {
    console.error("updateHelpContent error:", error.message);
    throw new Error("Failed to update help content");
  }
  revalidatePath("/help");
}

export async function updateMarqueeItems(items: string[]) {
  await requireAuth();

  if (!Array.isArray(items)) throw new Error("Items must be an array");
  if (items.length > 30) throw new Error("Too many marquee items (max 30)");
  const cleaned = items
    .map((s) => (typeof s === "string" ? s.trim().slice(0, 200) : ""))
    .filter(Boolean);

  const { data: existing } = await supabaseAdmin
    .from("homepage_content")
    .select("id")
    .single();

  if (!existing) throw new Error("Homepage content not found");

  const { error } = await supabaseAdmin
    .from("homepage_content")
    .update({ marquee_items: cleaned })
    .eq("id", existing.id);

  if (error) {
    console.error("updateMarqueeItems error:", error.message);
    throw new Error("Failed to update marquee items");
  }
  revalidatePath("/");
}

/**
 * Scan storage for images not referenced by any DB record and delete them.
 * Returns counts so the admin UI can display the result.
 */
export async function cleanupOrphanedStorageImages() {
  await requireAuth();
  return await cleanupOrphanedImages();
}

export async function updateOrderStatus(
  orderId: string,
  updates: {
    status?: string;
    delivered?: boolean;
    delivery_status?: string;
  }
) {
  await requireAuth();

  if (typeof orderId !== "string" || orderId.length < 8) {
    throw new Error("Invalid order id");
  }

  const payload: Record<string, unknown> = {};
  if (updates.status !== undefined) {
    const status = safeEnum(updates.status, PAYMENT_STATUSES);
    if (!status) throw new Error("Invalid payment status");
    payload.status = status;
  }
  if (updates.delivered !== undefined) {
    payload.delivered = Boolean(updates.delivered);
  }
  if (updates.delivery_status !== undefined) {
    const ds = safeEnum(updates.delivery_status, DELIVERY_STATUSES);
    if (!ds) throw new Error("Invalid delivery status");
    payload.delivery_status = ds;
  }

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabaseAdmin
    .from("orders")
    .update(payload)
    .eq("id", orderId);

  if (error) {
    console.error("updateOrderStatus error:", error.message);
    throw new Error("Failed to update order");
  }
  revalidatePath("/shasstorebyshahanas/orders");
  revalidatePath(`/shasstorebyshahanas/orders/${orderId}`);
}

export async function setMaintenanceMode(
  enabled: boolean,
  message?: string,
  phone1?: string,
  phone2?: string,
  confirmation?: string
) {
  await requireAuth();
  // Toggling pause/resume requires the confirmation phrase.
  // (Saving message+phones without changing the enabled state still requires
  // the phrase too — keeps it simple and prevents stealth toggles.)
  requireConfirmation(confirmation);

  // Cap free-text fields
  const safeMessage = message !== undefined ? safeString(message, 60) ?? "" : undefined;
  const safePhone1 = phone1 !== undefined ? safeString(phone1, 20) ?? "" : undefined;
  const safePhone2 = phone2 !== undefined ? safeString(phone2, 20) ?? "" : undefined;

  const { data: existing } = await supabaseAdmin
    .from("homepage_content")
    .select("id")
    .single();
  if (!existing) throw new Error("Homepage content not found");

  const payload: Record<string, unknown> = {
    maintenance_mode_enabled: Boolean(enabled),
  };
  if (safeMessage !== undefined) payload.maintenance_message = safeMessage;
  if (safePhone1 !== undefined) payload.maintenance_phone1 = safePhone1;
  if (safePhone2 !== undefined) payload.maintenance_phone2 = safePhone2;

  const { error } = await supabaseAdmin
    .from("homepage_content")
    .update(payload)
    .eq("id", existing.id);

  if (error) {
    console.error("setMaintenanceMode error:", error.message);
    throw new Error("Failed to update maintenance mode");
  }
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const TOP_NOTIF_FONT_MIN = 10;
const TOP_NOTIF_FONT_MAX = 20;

export async function updateTopNotification(
  enabled: boolean,
  items: string[],
  style?: { bgColor?: string; textColor?: string; fontSize?: number }
) {
  await requireAuth();

  if (!Array.isArray(items)) throw new Error("Items must be an array");
  if (items.length > 30) throw new Error("Too many notification items (max 30)");
  const cleaned = items
    .map((s) => (typeof s === "string" ? s.trim().slice(0, 200) : ""))
    .filter(Boolean);

  const payload: Record<string, unknown> = {
    top_notification_enabled: Boolean(enabled),
    top_notification_items: cleaned,
  };

  if (style?.bgColor !== undefined) {
    if (typeof style.bgColor !== "string" || !HEX_COLOR.test(style.bgColor)) {
      throw new Error("Background color must be a hex value like #1c1917");
    }
    payload.top_notification_bg_color = style.bgColor.toLowerCase();
  }
  if (style?.textColor !== undefined) {
    if (typeof style.textColor !== "string" || !HEX_COLOR.test(style.textColor)) {
      throw new Error("Text color must be a hex value like #ffffff");
    }
    payload.top_notification_text_color = style.textColor.toLowerCase();
  }
  if (style?.fontSize !== undefined) {
    const n = Number(style.fontSize);
    if (!Number.isFinite(n) || n < TOP_NOTIF_FONT_MIN || n > TOP_NOTIF_FONT_MAX) {
      throw new Error(`Font size must be between ${TOP_NOTIF_FONT_MIN} and ${TOP_NOTIF_FONT_MAX}`);
    }
    payload.top_notification_font_size = Math.round(n);
  }

  const { data: existing } = await supabaseAdmin
    .from("homepage_content")
    .select("id")
    .single();

  if (!existing) throw new Error("Homepage content not found");

  const { error } = await supabaseAdmin
    .from("homepage_content")
    .update(payload)
    .eq("id", existing.id);

  if (error) {
    console.error("updateTopNotification error:", error.message);
    throw new Error("Failed to update top notification");
  }
  revalidatePath("/");
}

export async function updateDeliverySettings(
  deliveryCharge: number,
  freeDeliveryThreshold: number
) {
  await requireAuth();

  // Bound both values: ₹0–₹100,000 (sanity check, no one charges more than that for shipping)
  const charge = safeInt(deliveryCharge, 0, 100000);
  const threshold = safeInt(freeDeliveryThreshold, 0, 10000000);
  if (charge === null) throw new Error("Delivery charge must be 0-100000");
  if (threshold === null) throw new Error("Free delivery threshold must be 0-10000000");

  const { data: existing } = await supabaseAdmin
    .from("homepage_content")
    .select("id")
    .single();

  if (!existing) throw new Error("Homepage content not found");

  const { error } = await supabaseAdmin
    .from("homepage_content")
    .update({
      delivery_charge: charge,
      free_delivery_threshold: threshold,
    })
    .eq("id", existing.id);

  if (error) {
    console.error("updateDeliverySettings error:", error.message);
    throw new Error("Failed to update delivery settings");
  }
  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function updateCompanyContent(id: string, formData: FormData) {
  await requireAuth();

  // External-link URLs (Instagram, Facebook) — admin input but still strip
  // javascript:/data: schemes as defense-in-depth before storing in DB.
  const safeExternalUrl = (raw: unknown, max: number): string => {
    const v = safeString(raw as string, max) ?? "";
    if (!v) return "";
    try {
      const u = new URL(v);
      return u.protocol === "https:" || u.protocol === "http:" ? v : "";
    } catch {
      return "";
    }
  };

  const { error } = await supabaseAdmin
    .from("company_content")
    .update({
      about: safeString(formData.get("about") as string, 10000),
      contact: safeString(formData.get("contact") as string, 5000),
      contact_email: safeString(formData.get("contact_email") as string, 120) ?? "",
      contact_whatsapp: safeString(formData.get("contact_whatsapp") as string, 30) ?? "",
      contact_phone: safeString(formData.get("contact_phone") as string, 30) ?? "",
      instagram_url: safeExternalUrl(formData.get("instagram_url"), 500),
      facebook_url: safeExternalUrl(formData.get("facebook_url"), 500),
    })
    .eq("id", id);

  if (error) {
    console.error("updateCompanyContent error:", error.message);
    throw new Error("Failed to update company content");
  }
  revalidatePath("/company");
  revalidatePath("/checkout/success");
}

// ── Orders: delete ───────────────────────────────────

export async function deleteOrder(id: string, confirmation?: string) {
  await requireAuth();
  requireConfirmation(confirmation);

  const { error } = await supabaseAdmin.from("orders").delete().eq("id", id);
  if (error) {
    console.error("deleteOrder error:", error.message);
    throw new Error("Failed to delete order");
  }

  revalidatePath("/shasstorebyshahanas");
  revalidatePath("/shasstorebyshahanas/orders");
  revalidatePath("/shasstorebyshahanas/revenue");
}

export async function deleteOrders(ids: string[], confirmation?: string) {
  await requireAuth();
  requireConfirmation(confirmation);

  const cleanIds = (Array.isArray(ids) ? ids : [])
    .map((x) => String(x).slice(0, 64))
    .filter((x) => x.length > 0);

  if (cleanIds.length === 0) throw new Error("No orders selected");

  const { error } = await supabaseAdmin
    .from("orders")
    .delete()
    .in("id", cleanIds);

  if (error) {
    console.error("deleteOrders error:", error.message);
    throw new Error("Failed to delete orders");
  }

  revalidatePath("/shasstorebyshahanas");
  revalidatePath("/shasstorebyshahanas/orders");
  revalidatePath("/shasstorebyshahanas/revenue");
  return cleanIds.length;
}

// ────────────────────────────────────────────────────────────────────
// Homepage section editors — write to the singleton homepage_content row.
// Each function targets ONE section so admin saves are surgical and
// easy to validate. All revalidate the storefront homepage (`/`).
// ────────────────────────────────────────────────────────────────────

/** Get the singleton homepage_content row id (creates the row if missing). */
async function singletonHomepageId(): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("homepage_content")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("homepage_content lookup error:", error.message);
    throw new Error("Failed to load homepage content");
  }
  if (data?.id) return data.id as string;
  // No row — insert an empty one so subsequent updates target it.
  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("homepage_content")
    .insert({})
    .select("id")
    .single();
  if (insertErr || !inserted?.id) {
    throw new Error("Failed to initialize homepage content row");
  }
  return inserted.id as string;
}

async function updateHomepageRow(payload: Record<string, unknown>) {
  const id = await singletonHomepageId();
  const { error } = await supabaseAdmin
    .from("homepage_content")
    .update(payload)
    .eq("id", id);
  if (error) {
    console.error("homepage update error:", error.message);
    throw new Error("Failed to update homepage section");
  }
  revalidatePath("/");
  revalidatePath("/shasstorebyshahanas/homepage-sections");
}

/** Story / editorial spotlight section. */
export async function updateHomepageStory(formData: FormData) {
  await requireAuth();

  const image = safeString(formData.get("story_image") as string, 500);
  if (image && !isAllowedImageUrl(image)) throw new Error("Invalid story image URL");

  const ctaLink = safeString(formData.get("story_cta_link") as string, 200);
  if (ctaLink && !ctaLink.startsWith("/")) {
    throw new Error("CTA link must be a relative path (start with /)");
  }

  await updateHomepageRow({
    story_eyebrow: safeString(formData.get("story_eyebrow") as string, 80) ?? "",
    story_title: safeString(formData.get("story_title") as string, 200) ?? "",
    story_subtitle: safeString(formData.get("story_subtitle") as string, 1000) ?? "",
    story_paragraph: safeString(formData.get("story_paragraph") as string, 1000) ?? "",
    story_image: image ?? "",
    story_cta_text: safeString(formData.get("story_cta_text") as string, 60) ?? "",
    story_cta_link: ctaLink ?? "/products",
  });
}

/** Lookbook gallery — up to 4 images with optional links + labels. */
export async function updateHomepageLookbook(formData: FormData) {
  await requireAuth();

  const rawItems = safeJsonParse<unknown[]>(
    formData.get("lookbook_images") as string,
    []
  );
  const items = (Array.isArray(rawItems) ? rawItems : [])
    .slice(0, 4)
    .map((raw) => {
      const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      const image = typeof obj.image === "string" ? obj.image.trim() : "";
      const link = typeof obj.link === "string" ? obj.link.trim() : "";
      const label = typeof obj.label === "string" ? obj.label.trim() : "";
      // Each image MUST be allow-listed; otherwise drop it
      if (!image || !isAllowedImageUrl(image)) return null;
      // Links must be relative or empty
      const safeLink = link && link.startsWith("/") ? link.slice(0, 200) : "";
      return {
        image: image.slice(0, 500),
        link: safeLink,
        label: label.slice(0, 60),
      };
    })
    .filter((x): x is { image: string; link: string; label: string } => x !== null);

  await updateHomepageRow({
    lookbook_eyebrow: safeString(formData.get("lookbook_eyebrow") as string, 80) ?? "",
    lookbook_title: safeString(formData.get("lookbook_title") as string, 200) ?? "",
    lookbook_subtitle: safeString(formData.get("lookbook_subtitle") as string, 500) ?? "",
    lookbook_images: items,
  });
}

/** Testimonials list — up to 12 entries. */
export async function updateHomepageTestimonials(formData: FormData) {
  await requireAuth();

  const rawItems = safeJsonParse<unknown[]>(
    formData.get("testimonials") as string,
    []
  );
  const items = (Array.isArray(rawItems) ? rawItems : [])
    .slice(0, 12)
    .map((raw) => {
      const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      const quote = typeof obj.quote === "string" ? obj.quote.trim() : "";
      const name = typeof obj.name === "string" ? obj.name.trim() : "";
      const place = typeof obj.place === "string" ? obj.place.trim() : "";
      if (!quote || !name) return null;
      return {
        quote: quote.slice(0, 600),
        name: name.slice(0, 80),
        place: place.slice(0, 80),
      };
    })
    .filter((x): x is { quote: string; name: string; place: string } => x !== null);

  await updateHomepageRow({
    testimonials_eyebrow: safeString(formData.get("testimonials_eyebrow") as string, 80) ?? "",
    testimonials_title: safeString(formData.get("testimonials_title") as string, 200) ?? "",
    testimonials: items,
  });
}

/**
 * Instagram strip — handle, profile URL, and up to 6 per-post entries.
 * Each post = { image, post_url? }. post_url is the link a tile clicks
 * through to (the IG post itself); empty string means fall back to the
 * profile URL on the storefront.
 */
export async function updateHomepageInstagram(formData: FormData) {
  await requireAuth();

  const profileUrlRaw = formData.get("instagram_profile_url") as string | null;
  const profileUrlTrim = (profileUrlRaw ?? "").trim();
  let profile = "";
  if (profileUrlTrim) {
    if (!profileUrlTrim.startsWith("https://")) {
      throw new Error("Instagram profile URL must use https://");
    }
    profile = profileUrlTrim.slice(0, 500);
  }

  const rawPosts = safeJsonParse<unknown[]>(formData.get("instagram_posts") as string, []);
  const posts = (Array.isArray(rawPosts) ? rawPosts : [])
    .slice(0, 6)
    .map((raw) => {
      const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      const image = typeof obj.image === "string" ? obj.image.trim() : "";
      const post_url = typeof obj.post_url === "string" ? obj.post_url.trim() : "";
      if (!image || !isAllowedImageUrl(image)) return null;
      // Per-tile post URL must be HTTPS if provided
      if (post_url && !post_url.startsWith("https://")) {
        throw new Error("Instagram post URLs must use https://");
      }
      return {
        image: image.slice(0, 500),
        post_url: post_url.slice(0, 500),
      };
    })
    .filter((x): x is { image: string; post_url: string } => x !== null);

  // Keep the legacy text[] in sync so older homepage rows / read paths
  // continue to render even if they read from the old column.
  const legacyImages = posts.map((p) => p.image);

  await updateHomepageRow({
    instagram_eyebrow: safeString(formData.get("instagram_eyebrow") as string, 80) ?? "",
    instagram_title: safeString(formData.get("instagram_title") as string, 200) ?? "",
    instagram_handle: safeString(formData.get("instagram_handle") as string, 60) ?? "",
    instagram_profile_url: profile,
    instagram_posts: posts,
    instagram_images: legacyImages,
  });
}

/** Closing CTA — eyebrow, title (+ italic accent), subtitle, two buttons. */
/** Categories section header (eyebrow + title + accent word). */
export async function updateHomepageCategoriesSection(formData: FormData) {
  await requireAuth();
  await updateHomepageRow({
    categories_eyebrow:      safeString(formData.get("categories_eyebrow")      as string, 80) ?? "",
    categories_title:        safeString(formData.get("categories_title")        as string, 200) ?? "",
    categories_title_accent: safeString(formData.get("categories_title_accent") as string, 80) ?? "",
  });
}

/** New Arrivals section header (eyebrow + title + subtitle). */
export async function updateHomepageNewArrivals(formData: FormData) {
  await requireAuth();
  await updateHomepageRow({
    new_arrivals_eyebrow:  safeString(formData.get("new_arrivals_eyebrow")  as string, 80) ?? "",
    new_arrivals_title:    safeString(formData.get("new_arrivals_title")    as string, 200) ?? "",
    new_arrivals_subtitle: safeString(formData.get("new_arrivals_subtitle") as string, 500) ?? "",
  });
}

export async function updateHomepageClosingCta(formData: FormData) {
  await requireAuth();

  const primaryLink = safeString(formData.get("closing_cta_primary_link") as string, 200) ?? "/products";
  const secondaryLink = safeString(formData.get("closing_cta_secondary_link") as string, 200) ?? "";
  if (primaryLink && !primaryLink.startsWith("/")) {
    throw new Error("Primary CTA link must be a relative path");
  }
  if (secondaryLink && !secondaryLink.startsWith("/")) {
    throw new Error("Secondary CTA link must be a relative path");
  }

  await updateHomepageRow({
    closing_cta_eyebrow: safeString(formData.get("closing_cta_eyebrow") as string, 80) ?? "",
    closing_cta_title: safeString(formData.get("closing_cta_title") as string, 200) ?? "",
    closing_cta_title_accent: safeString(formData.get("closing_cta_title_accent") as string, 200) ?? "",
    closing_cta_subtitle: safeString(formData.get("closing_cta_subtitle") as string, 500) ?? "",
    closing_cta_primary_text: safeString(formData.get("closing_cta_primary_text") as string, 60) ?? "",
    closing_cta_primary_link: primaryLink,
    closing_cta_secondary_text: safeString(formData.get("closing_cta_secondary_text") as string, 60) ?? "",
    closing_cta_secondary_link: secondaryLink,
  });
}

/** Section visibility toggles — all 8 booleans in one shot. */
export async function updateHomepageVisibility(toggles: {
  show_usp_strip: boolean;
  show_categories: boolean;
  show_featured: boolean;
  show_story: boolean;
  show_lookbook: boolean;
  show_testimonials: boolean;
  show_instagram: boolean;
  show_closing_cta: boolean;
}) {
  await requireAuth();

  // Coerce to actual booleans so the DB never receives undefined
  const safe = {
    show_usp_strip: !!toggles.show_usp_strip,
    show_categories: !!toggles.show_categories,
    show_featured: !!toggles.show_featured,
    show_story: !!toggles.show_story,
    show_lookbook: !!toggles.show_lookbook,
    show_testimonials: !!toggles.show_testimonials,
    show_instagram: !!toggles.show_instagram,
    show_closing_cta: !!toggles.show_closing_cta,
  };

  await updateHomepageRow(safe);
}
