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

/** Find smallest unused positive integer for shirt_styles.display_order */
async function suggestNextStyleOrder(): Promise<number> {
  const { data } = await supabaseAdmin.from("shirt_styles").select("display_order");
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
    .from("shirt_styles")
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
      host === "jzbupujpgjhqsqvnktdj.supabase.co" ||
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
  // Derive sizes from size_inventory keys (preserve order from JSON)
  let sizes = Object.keys(size_inventory).filter((k) => k.trim());
  // Backwards-compat fallback to old `sizes` field if size_inventory is empty
  if (sizes.length === 0) {
    const sizesRaw = formData.get("sizes") as string;
    sizes = (sizesRaw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
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
  revalidatePath("/ashrafckvnradmin/products");
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
  // Derive sizes from size_inventory keys (preserve order from JSON)
  let sizes = Object.keys(size_inventory).filter((k) => k.trim());
  // Backwards-compat fallback to old `sizes` field if size_inventory is empty
  if (sizes.length === 0) {
    const sizesRaw = formData.get("sizes") as string;
    sizes = (sizesRaw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
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

  revalidatePath("/ashrafckvnradmin/products");
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

  revalidatePath("/ashrafckvnradmin/products");
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
  revalidatePath("/ashrafckvnradmin/products");
  revalidatePath("/");
}

// ── Shirt Styles ──────────────────────────────────

export async function addShirtStyle(formData: FormData) {
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

  const { error } = await supabaseAdmin.from("shirt_styles").insert([
    {
      name,
      description,
      image,
      display_order,
    },
  ]);

  if (error) {
    console.error("addShirtStyle error:", error.message);
    throw new Error("Failed to add shirt style");
  }
  revalidatePath("/ashrafckvnradmin/shirt-styles");
  revalidatePath("/");
}

export async function updateShirtStyle(id: string, formData: FormData) {
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
    .from("shirt_styles")
    .select("image")
    .eq("id", id)
    .single();

  const { error } = await supabaseAdmin
    .from("shirt_styles")
    .update({
      name,
      description,
      image,
      display_order,
    })
    .eq("id", id);

  if (error) {
    console.error("updateShirtStyle error:", error.message);
    throw new Error("Failed to update shirt style");
  }

  // If the image changed, delete the old one
  if (oldStyle?.image && oldStyle.image !== image) {
    try {
      await deleteImagesByUrls([oldStyle.image as string]);
    } catch (e) {
      console.error("updateShirtStyle: image cleanup failed:", e);
    }
  }

  revalidatePath("/ashrafckvnradmin/shirt-styles");
  revalidatePath("/");
}

export async function deleteShirtStyle(id: string, confirmation?: string) {
  await requireAuth();
  requireConfirmation(confirmation);

  // Fetch the style's image first
  const { data: style } = await supabaseAdmin
    .from("shirt_styles")
    .select("image")
    .eq("id", id)
    .single();

  const { error } = await supabaseAdmin
    .from("shirt_styles")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteShirtStyle error:", error.message);
    throw new Error("Failed to delete shirt style");
  }

  // Delete associated image (best-effort)
  if (style?.image) {
    try {
      await deleteImagesByUrls([style.image as string]);
    } catch (e) {
      console.error("deleteShirtStyle: image cleanup failed:", e);
    }
  }

  revalidatePath("/ashrafckvnradmin/shirt-styles");
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
  revalidatePath("/ashrafckvnradmin/orders");
  revalidatePath(`/ashrafckvnradmin/orders/${orderId}`);
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

  revalidatePath("/ashrafckvnradmin");
  revalidatePath("/ashrafckvnradmin/orders");
  revalidatePath("/ashrafckvnradmin/revenue");
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

  revalidatePath("/ashrafckvnradmin");
  revalidatePath("/ashrafckvnradmin/orders");
  revalidatePath("/ashrafckvnradmin/revenue");
  return cleanIds.length;
}
