"use client";
import { useState } from "react";
import Image from "next/image";

type Props = {
  value: string;           // current image URL
  onChange: (url: string) => void;
  folder?: string;
};

/**
 * Resize + recompress an image in the browser before uploading.
 *
 * Why: Vercel Hobby caps API-route request bodies at ~4.5 MB. Phone photos
 * are routinely 5–10 MB, so we'd see a 413 from the platform with the
 * generic "Request Entity Too Large" body before our handler ever ran.
 * Shrinking client-side fixes that AND reduces uploads → cheaper egress
 * + faster page loads everywhere those images are reused.
 *
 * Strategy:
 *   - GIFs are passed through (compressing would kill animation).
 *   - PNG/WebP → re-encode as WebP at q=0.82 (preserves alpha, ~30 % smaller than JPEG).
 *   - JPEG/everything else → re-encode as JPEG at q=0.85.
 *   - Max longest edge: 1800 px. Big enough for retina product pages, far
 *     under any platform body limit.
 *   - If the recompressed file is somehow LARGER than the source, keep the source.
 */
async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  if (file.size <= 800 * 1024) return file; // already small — skip

  const MAX_EDGE = 1800;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const i = new window.Image();
    i.onload = () => {
      URL.revokeObjectURL(url);
      resolve(i);
    };
    i.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image"));
    };
    i.src = url;
  });

  // Scale to fit MAX_EDGE on the longest side
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, w, h);

  // PNG/WebP may carry alpha → keep WebP. JPEG → JPEG.
  const keepAlpha = file.type === "image/png" || file.type === "image/webp";
  const targetType = keepAlpha ? "image/webp" : "image/jpeg";
  const targetExt = keepAlpha ? "webp" : "jpg";
  const quality = keepAlpha ? 0.82 : 0.85;

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, targetType, quality)
  );
  if (!blob) return file;
  if (blob.size >= file.size) return file;

  const newName =
    (file.name.replace(/\.[^.]+$/, "") || "image") + "." + targetExt;
  return new File([blob], newName, { type: targetType });
}

/** Read upload-image response safely — handles HTML/text 413 from Vercel edge. */
async function parseUploadResponse(res: Response): Promise<{ url?: string; error?: string }> {
  const text = await res.text();
  // The handler always returns JSON. If it doesn't, we hit a platform-level
  // error (typically 413 from Vercel's edge with "Request Entity Too Large").
  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 413) {
      return {
        error:
          "Image is too large for the server (Vercel caps uploads at ~4.5 MB). " +
          "Compression should normally bring it below that — try a smaller source image.",
      };
    }
    // Surface a concise version of whatever Vercel sent
    return { error: text.slice(0, 200) || `Upload failed (status ${res.status})` };
  }
}

export default function ImageUploader({ value, onChange, folder = "products" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const [progressNote, setProgressNote] = useState<string | null>(null);
  const [errorNote, setErrorNote] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorNote(null);

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      // 1. Compress if needed
      let toUpload = file;
      const startMb = (file.size / (1024 * 1024)).toFixed(1);
      if (file.size > 800 * 1024 && file.type !== "image/gif") {
        setProgressNote(`Compressing (${startMb} MB → smaller)…`);
        toUpload = await compressImage(file);
      }
      const finalMb = (toUpload.size / (1024 * 1024)).toFixed(1);
      setProgressNote(`Uploading (${finalMb} MB)…`);

      // 2. Upload
      const formData = new FormData();
      formData.append("file", toUpload);
      formData.append("folder", folder);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await parseUploadResponse(res);
      if (!res.ok || !data.url) {
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      onChange(data.url);
      setProgressNote(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setErrorNote(msg);
      console.error(err);
    } finally {
      setUploading(false);
    }
    // Reset the input so re-selecting the same file re-fires the change handler
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      {preview && (
        <div className="w-40 h-40 bg-stone-100 overflow-hidden relative">
          <Image src={preview} alt="Preview" fill className="object-cover" />
        </div>
      )}

      {/* Upload button */}
      <label className={`flex items-center gap-3 cursor-pointer w-fit border px-5 py-3 text-xs tracking-[0.2em] uppercase transition-all duration-200 ${
        uploading
          ? "border-stone-200 text-stone-300 cursor-not-allowed"
          : "border-stone-300 text-stone-600 hover:border-stone-600 hover:text-stone-900"
      }`}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        {uploading ? "Uploading…" : preview ? "Change Image" : "Upload Image"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={uploading}
          onChange={handleFileChange}
        />
      </label>

      {progressNote && (
        <p className="text-xs text-stone-500 tracking-wide animate-pulse">{progressNote}</p>
      )}
      {errorNote && (
        <p className="text-xs text-red-500 tracking-wide max-w-md">{errorNote}</p>
      )}
    </div>
  );
}
