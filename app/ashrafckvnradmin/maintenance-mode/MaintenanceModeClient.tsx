"use client";
import { useState } from "react";
import { setMaintenanceMode } from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";

// Public env var so this client component and the server-side check in
// lib/actions.ts (requireConfirmation) agree on the expected phrase.
const CONFIRM_PHRASE = (
  process.env.NEXT_PUBLIC_ADMIN_CONFIRMATION_PHRASE ?? "shasstore"
)
  .trim()
  .toLowerCase();

export default function MaintenanceModeClient({
  initialEnabled,
  initialMessage,
  initialPhone1,
  initialPhone2,
}: {
  initialEnabled: boolean;
  initialMessage: string;
  initialPhone1: string;
  initialPhone2: string;
}) {
  const toast = useToast();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState(initialMessage);
  const [phone1, setPhone1] = useState(initialPhone1);
  const [phone2, setPhone2] = useState(initialPhone2);
  const [pendingAction, setPendingAction] = useState<"enable" | "disable" | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [saving, setSaving] = useState(false);

  const isMatch = confirmInput.trim().toLowerCase() === CONFIRM_PHRASE;

  const handleToggleClick = () => {
    setPendingAction(enabled ? "disable" : "enable");
    setConfirmInput("");
  };

  const handleConfirm = async () => {
    if (!isMatch || saving) return;
    setSaving(true);
    const newState = pendingAction === "enable";
    try {
      await setMaintenanceMode(newState, message, phone1, phone2, confirmInput.trim().toLowerCase());
      setEnabled(newState);
      toast.success(
        newState ? "Maintenance mode ON" : "Maintenance mode OFF",
        newState
          ? "Customers will see the maintenance popup. Site is paused."
          : "Site is back online for customers."
      );
      setPendingAction(null);
      setConfirmInput("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update maintenance mode";
      toast.error("Could not update", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContent = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await setMaintenanceMode(enabled, message, phone1, phone2);
      toast.success("Saved", "Maintenance content updated.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      toast.error("Could not save", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-1">Site Control</p>
        <h1
          className="text-2xl md:text-3xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Maintenance Mode
        </h1>
        <p className="text-sm text-stone-500 font-light mt-2">
          Pause the entire customer-facing website. Customers will see a popup and
          cannot browse or buy until you turn it off.
        </p>
      </div>

      {/* Current Status Card */}
      <div
        className={`border rounded-lg p-6 mb-6 ${
          enabled
            ? "bg-red-50 border-red-200"
            : "bg-emerald-50 border-emerald-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              enabled ? "bg-red-100" : "bg-emerald-100"
            }`}
          >
            <span className="text-2xl">{enabled ? "🚧" : "✅"}</span>
          </div>
          <div className="flex-1">
            <p
              className={`text-xs tracking-[0.25em] uppercase font-medium mb-1 ${
                enabled ? "text-red-700" : "text-emerald-700"
              }`}
            >
              Current Status
            </p>
            <h2
              className={`text-2xl font-light ${
                enabled ? "text-red-900" : "text-emerald-900"
              }`}
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {enabled ? "Site is PAUSED" : "Site is LIVE"}
            </h2>
            <p
              className={`text-sm font-light mt-1 ${
                enabled ? "text-red-700" : "text-emerald-700"
              }`}
            >
              {enabled
                ? "Customers see the maintenance popup and cannot place orders."
                : "Customers can browse and buy normally."}
            </p>
          </div>
        </div>
      </div>

      {/* Custom Content (heading + phones) */}
      <div className="bg-white border border-stone-100 rounded-lg p-6 mb-6 space-y-5">
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">
            Maintenance Heading
          </label>
          <p className="text-xs text-stone-400 mb-3">
            Shown as the title on the customer popup. Keep it short and friendly.
          </p>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={60}
            placeholder="Site Under Maintenance"
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
          <div>
            <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">
              Contact Number 1
            </label>
            <input
              type="tel"
              value={phone1}
              onChange={(e) => setPhone1(e.target.value)}
              maxLength={20}
              placeholder="+91 98765 43210"
              className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500"
            />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-stone-500 block mb-2">
              Contact Number 2
            </label>
            <input
              type="tel"
              value={phone2}
              onChange={(e) => setPhone2(e.target.value)}
              maxLength={20}
              placeholder="+91 98765 43211"
              className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-500"
            />
          </div>
          <p className="sm:col-span-2 text-xs text-stone-400 -mt-2">
            Both numbers (if filled) are shown on the maintenance popup so customers can call you for urgent queries. Leave blank to hide.
          </p>
        </div>

        <button
          onClick={handleSaveContent}
          disabled={saving}
          className="px-5 py-2 text-xs tracking-widest uppercase border border-stone-300 text-stone-600 hover:border-stone-700 hover:text-stone-900 transition-colors rounded disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Content"}
        </button>
      </div>

      {/* Toggle */}
      <div className="bg-white border border-stone-100 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-sm font-medium text-stone-800">
              {enabled ? "Bring site back online" : "Pause the site"}
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              {enabled
                ? "Disabling maintenance mode will instantly bring the site back. Customers will see products and can order."
                : "Enabling maintenance mode will instantly stop all customer activity. Use only for genuine downtime/upgrades."}
            </p>
          </div>
          {pendingAction === null && (
            <button
              onClick={handleToggleClick}
              className={`flex-shrink-0 px-5 py-2.5 text-xs tracking-widest uppercase font-medium rounded transition-colors ${
                enabled
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {enabled ? "Bring Online" : "Pause Site"}
            </button>
          )}
        </div>

        {/* Confirmation flow */}
        {pendingAction !== null && (
          <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-lg">
            <p className="text-sm font-medium text-stone-800 mb-2">
              Confirm{" "}
              {pendingAction === "enable" ? "pausing the site" : "bringing the site back"}
            </p>
            <p className="text-xs text-stone-500 mb-4">
              Type{" "}
              <span className="font-mono font-medium text-stone-900">
                {CONFIRM_PHRASE}
              </span>{" "}
              to confirm. This applies instantly to all customers.
            </p>
            <input
              type="text"
              autoComplete="off"
              autoFocus
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className={`w-full border px-4 py-3 text-sm focus:outline-none transition-colors mb-3 ${
                isMatch
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : confirmInput
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-stone-200 bg-white text-stone-800 focus:border-stone-500"
              }`}
            />
            {confirmInput && !isMatch && (
              <p className="text-xs text-red-500 mb-3">
                Phrase doesn&apos;t match. Type &quot;{CONFIRM_PHRASE}&quot; exactly (lowercase)
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setPendingAction(null);
                  setConfirmInput("");
                }}
                disabled={saving}
                className="px-5 py-2.5 border border-stone-200 text-stone-600 text-xs tracking-widest uppercase font-medium hover:border-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!isMatch || saving}
                className={`px-5 py-2.5 text-xs tracking-widest uppercase font-medium transition-colors ${
                  !isMatch || saving
                    ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                    : pendingAction === "enable"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {saving
                  ? "Saving..."
                  : pendingAction === "enable"
                  ? "Confirm Pause"
                  : "Confirm Bring Online"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
