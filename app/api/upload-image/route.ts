import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdminUser } from "@/lib/admin-check";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkSameOrigin } from "@/lib/csrf";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_FOLDERS = new Set(["products", "styles", "banners", "general", "hero", "branding"]);
// 8 MB ceiling matches Vercel Pro's request body limit. IMPORTANT: on
// Vercel **Hobby** plan, the platform itself caps incoming request bodies
// at ~4.5 MB before the route handler runs — uploads above that fail with
// a 413 from the edge regardless of this limit. If you're on Hobby, ask
// uploaders to compress images first (squoosh.app / TinyPNG / ImageOptim
// — most product photos compress to <1 MB without visible quality loss).
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MIN_FILE_SIZE = 100; // bytes — reject empty/tiny files
const MAX_FILE_SIZE_MB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);

export async function POST(req: NextRequest) {
  const csrf = checkSameOrigin(req);
  if (csrf) return csrf;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdminUser(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 30 uploads / minute per admin user — generous for batch product creation
  // but stops a compromised admin session from filling the bucket.
  const rl = checkRateLimit(`upload:${user.id}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folderRaw = (formData.get("folder") as string | null) ?? "products";

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Reject empty / tiny files (suspicious or unusable)
  if (file.size < MIN_FILE_SIZE) {
    return NextResponse.json({ error: "File is empty or invalid" }, { status: 400 });
  }

  // File size cap
  if (file.size > MAX_FILE_SIZE) {
    const actualMb = (file.size / (1024 * 1024)).toFixed(1);
    return NextResponse.json(
      {
        error:
          `Image is ${actualMb} MB — too large. Maximum is ${MAX_FILE_SIZE_MB} MB. ` +
          `Try compressing it at squoosh.app or tinypng.com first (most photos shrink to <1 MB without visible quality loss).`,
      },
      { status: 400 }
    );
  }

  // Strict MIME type allowlist (not just startsWith image/, which would allow image/svg+xml — XSS risk)
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
      { status: 400 }
    );
  }

  // File extension allowlist
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: `Invalid file extension. Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}` },
      { status: 400 }
    );
  }

  // Validate folder strictly — prevent path traversal & arbitrary folder creation
  const folder = String(folderRaw).trim();
  if (!ALLOWED_FOLDERS.has(folder) || folder.includes("..") || folder.includes("/")) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }

  const randomId = crypto.randomUUID();
  const fileName = `${folder}/${randomId}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from("product-images")
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("Upload error:", error.message);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage
    .from("product-images")
    .getPublicUrl(fileName);

  return NextResponse.json({ url: data.publicUrl });
}
