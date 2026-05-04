"use client";
import { useState } from "react";
import { updateDeliverySettings } from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";

export default function DeliverySettingsClient({
  initialCharge,
  initialThreshold,
}: {
  initialCharge: number;
  initialThreshold: number;
}) {
  const toast = useToast();
  const [deliveryCharge, setDeliveryCharge] = useState(initialCharge);
  const [freeThreshold, setFreeThreshold] = useState(initialThreshold);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await updateDeliverySettings(deliveryCharge, freeThreshold);
      setSaved(true);
      toast.success("Delivery charges updated", "New rates apply to all new orders.");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      const msg = err.message || "Failed to save";
      setError(msg);
      toast.error("Could not save", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-1">Settings</p>
        <h1
          className="text-2xl md:text-3xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Delivery Charges
        </h1>
      </div>

      <div className="bg-white border border-stone-100 rounded-lg p-4 md:p-8 max-w-xl">
        {/* Delivery Charge */}
        <div className="mb-6">
          <label className="text-xs tracking-widest uppercase text-stone-400 block mb-2">
            Delivery Charge (₹)
          </label>
          <input
            type="number"
            min={0}
            value={deliveryCharge}
            onChange={(e) => setDeliveryCharge(parseInt(e.target.value) || 0)}
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 font-light focus:outline-none focus:border-stone-500 bg-white"
          />
          <p className="text-xs text-stone-400 mt-1">
            This amount is charged for orders below the free delivery threshold.
          </p>
        </div>

        {/* Free Delivery Threshold */}
        <div className="mb-6">
          <label className="text-xs tracking-widest uppercase text-stone-400 block mb-2">
            Free Delivery Above (₹)
          </label>
          <input
            type="number"
            min={0}
            value={freeThreshold}
            onChange={(e) => setFreeThreshold(parseInt(e.target.value) || 0)}
            className="w-full border border-stone-200 px-4 py-3 text-sm text-stone-800 font-light focus:outline-none focus:border-stone-500 bg-white"
          />
          <p className="text-xs text-stone-400 mt-1">
            Orders above this amount get free delivery. Set to 0 to always charge delivery.
          </p>
        </div>

        {/* Preview */}
        <div className="mb-6 p-4 bg-stone-50 border border-stone-100 rounded">
          <p className="text-xs tracking-widest uppercase text-stone-400 mb-3">Preview</p>
          <div className="space-y-2 text-sm text-stone-600">
            <p>
              Order of ₹500 → Delivery: <span className="font-medium text-stone-900">₹{deliveryCharge}</span>
            </p>
            <p>
              Order of ₹{freeThreshold.toLocaleString()} → Delivery:{" "}
              <span className="font-medium text-emerald-600">Free</span>
            </p>
            <p>
              Order of ₹{(freeThreshold + 500).toLocaleString()} → Delivery:{" "}
              <span className="font-medium text-emerald-600">Free</span>
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-8 py-3 text-xs tracking-[0.2em] uppercase font-medium transition-all duration-300 ${
              saving
                ? "bg-stone-400 text-white cursor-not-allowed"
                : "bg-stone-900 text-white hover:bg-stone-700"
            }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {saved && (
            <span className="text-emerald-600 text-sm flex items-center">
              Saved successfully
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
