import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "product-images";

/**
 * Extract the storage path (relative to the bucket) from a Supabase public URL.
 * Returns null if:
 *   - URL is empty/null
 *   - URL doesn't match our bucket's public path
 *   - Extracted path contains traversal (`..`) or absolute markers
 *   - URL host doesn't match our Supabase project
 *
 * Defense-in-depth — Supabase storage SDK already rejects `..` paths, but if
 * a future version loosens that, we still won't let a crafted URL escape.
 */
export function extractStoragePath(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;

  // Only accept URLs from OUR Supabase project — not just any supabase.co domain.
  // This prevents an admin who can paste arbitrary URLs into product fields
  // from triggering deletes via path collisions on a different project.
  const expectedBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (expectedBase && !url.startsWith(expectedBase)) return null;

  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  // Strip query/fragment
  const raw = url.slice(idx + marker.length).split("?")[0].split("#")[0];

  // Reject path traversal and absolute paths
  if (!raw || raw.includes("..") || raw.startsWith("/") || raw.includes("\\")) {
    return null;
  }

  // Reject decoded traversal (% encoded)
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (decoded.includes("..") || decoded.startsWith("/")) return null;

  return raw;
}

/**
 * Delete one or more images from storage by their public URLs.
 * Silently ignores URLs that aren't recognized storage URLs.
 */
export async function deleteImagesByUrls(urls: (string | null | undefined)[]): Promise<{
  deleted: number;
  errors: string[];
}> {
  const paths = urls
    .map(extractStoragePath)
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return { deleted: 0, errors: [] };

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).remove(paths);

  if (error) {
    console.error("storage delete error:", error.message);
    return { deleted: 0, errors: [error.message] };
  }

  return { deleted: data?.length ?? 0, errors: [] };
}

/**
 * List all storage paths under a given prefix (recursively).
 */
async function listAllPaths(prefix: string): Promise<string[]> {
  const out: string[] = [];

  async function walk(p: string) {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(p, { limit: 1000 });
    if (error || !data) return;

    for (const item of data) {
      // Skip placeholder files
      if (item.name === ".emptyFolderPlaceholder") continue;
      const fullPath = p ? `${p}/${item.name}` : item.name;
      if (item.id === null) {
        // It's a folder — recurse
        await walk(fullPath);
      } else {
        out.push(fullPath);
      }
    }
  }

  await walk(prefix);
  return out;
}

/**
 * Get all storage paths currently referenced by any record in the database.
 */
async function getReferencedPaths(): Promise<Set<string>> {
  const referenced = new Set<string>();

  const addUrl = (url: string | null | undefined) => {
    const path = extractStoragePath(url);
    if (path) referenced.add(path);
  };

  // Products: image (string) and images (jsonb array)
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("image, images");
  for (const p of products ?? []) {
    addUrl(p.image as string | null);
    if (Array.isArray(p.images)) {
      for (const img of p.images as string[]) addUrl(img);
    }
  }

  // Shirt styles: image
  const { data: styles } = await supabaseAdmin.from("shirt_styles").select("image");
  for (const s of styles ?? []) addUrl(s.image as string | null);

  // Hero banner: main_image
  const { data: heroes } = await supabaseAdmin.from("hero_banner").select("main_image");
  for (const h of heroes ?? []) addUrl(h.main_image as string | null);

  // Homepage content: hero_image (if column exists)
  try {
    const { data: hp } = await supabaseAdmin.from("homepage_content").select("hero_image");
    for (const r of hp ?? []) addUrl(r.hero_image as string | null);
  } catch {
    // column may not exist
  }

  return referenced;
}

/**
 * Find and delete orphaned images — files in storage that aren't referenced
 * by any record in the database.
 */
export async function cleanupOrphanedImages(): Promise<{
  scanned: number;
  orphans: number;
  deleted: number;
  errors: string[];
}> {
  const allPaths = await listAllPaths("");
  const referenced = await getReferencedPaths();

  const orphans = allPaths.filter((p) => !referenced.has(p));

  if (orphans.length === 0) {
    return { scanned: allPaths.length, orphans: 0, deleted: 0, errors: [] };
  }

  // Batch delete (Supabase handles up to 1000 at a time)
  const errors: string[] = [];
  let deleted = 0;
  const chunkSize = 100;
  for (let i = 0; i < orphans.length; i += chunkSize) {
    const chunk = orphans.slice(i, i + chunkSize);
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).remove(chunk);
    if (error) {
      errors.push(error.message);
    } else {
      deleted += data?.length ?? 0;
    }
  }

  return {
    scanned: allPaths.length,
    orphans: orphans.length,
    deleted,
    errors,
  };
}
