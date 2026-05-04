"use client";
import { useState, useEffect, ReactNode } from "react";

// Public env var so this client component and the server-side check in
// lib/actions.ts (requireConfirmation) agree on the expected phrase.
// Falls back to "shasstore" only in local dev — production env must set it.
const CONFIRM_PHRASE = (
  process.env.NEXT_PUBLIC_ADMIN_CONFIRMATION_PHRASE ?? "shasstore"
)
  .trim()
  .toLowerCase();

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemType,
  details,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (phrase: string) => void | Promise<void>;
  title: string;
  itemType: string; // e.g., "shirt", "shirt style", "image"
  details: ReactNode;
}) {
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmInput("");
      setError("");
      setDeleting(false);
    }
  }, [isOpen]);

  // Lock scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMatch = confirmInput.trim().toLowerCase() === CONFIRM_PHRASE;

  const handleConfirm = async () => {
    if (!isMatch || deleting) return;
    setDeleting(true);
    setError("");
    try {
      await onConfirm(confirmInput.trim().toLowerCase());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      setError(msg);
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs tracking-[0.25em] uppercase text-red-600 font-medium mb-1">
              Permanent Delete
            </p>
            <h2
              className="text-xl text-stone-900 font-light leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem" }}
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-stone-600 leading-relaxed">
            You are about to <span className="font-medium text-red-600">permanently delete</span> this {itemType}. This action <span className="font-medium">cannot be undone</span>.
          </p>

          {/* Item details */}
          <div className="bg-stone-50 border border-stone-100 rounded p-4 text-sm">
            {details}
          </div>

          {/* Confirmation input */}
          <div>
            <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">
              Type <span className="font-mono font-medium text-stone-900">{CONFIRM_PHRASE}</span> to confirm
            </label>
            <input
              type="text"
              autoComplete="off"
              autoFocus
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className={`w-full border px-4 py-3 text-sm focus:outline-none transition-colors ${
                isMatch
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : confirmInput
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-stone-200 bg-white text-stone-800 focus:border-stone-500"
              }`}
            />
            {confirmInput && !isMatch && (
              <p className="text-xs text-red-500 mt-1">Phrase doesn&apos;t match. Type &quot;{CONFIRM_PHRASE}&quot; exactly (lowercase)</p>
            )}
            {isMatch && (
              <p className="text-xs text-emerald-600 mt-1">✓ Phrase matched. You can now delete.</p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-6 py-3 border border-stone-200 text-stone-600 text-xs tracking-widest uppercase font-medium hover:border-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isMatch || deleting}
            className={`px-6 py-3 text-xs tracking-widest uppercase font-medium transition-colors ${
              !isMatch || deleting
                ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {deleting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
