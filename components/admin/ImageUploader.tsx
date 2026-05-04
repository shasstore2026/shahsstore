"use client";
import { useState } from "react";
import Image from "next/image";

type Props = {
  value: string;           // current image URL
  onChange: (url: string) => void;
  folder?: string;
};

export default function ImageUploader({ value, onChange, folder = "products" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onChange(data.url); // pass public URL back to parent form
    } catch (err) {
      alert("Upload failed. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
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
        {uploading ? "Uploading..." : preview ? "Change Image" : "Upload Image"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={handleFileChange}
        />
      </label>

      {uploading && (
        <p className="text-xs text-stone-400 tracking-wide animate-pulse">Uploading to cloud...</p>
      )}
    </div>
  );
}
