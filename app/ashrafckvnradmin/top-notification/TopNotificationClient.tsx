"use client";
import { useState } from "react";
import { updateTopNotification } from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";

const FONT_MIN = 10;
const FONT_MAX = 20;

export default function TopNotificationClient({
  initialEnabled,
  initialItems,
  initialBgColor,
  initialTextColor,
  initialFontSize,
}: {
  initialEnabled: boolean;
  initialItems: string[];
  initialBgColor: string;
  initialTextColor: string;
  initialFontSize: number;
}) {
  const toast = useToast();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [items, setItems] = useState<string[]>(
    initialItems.length > 0 ? initialItems : [""]
  );
  const [bgColor, setBgColor] = useState(initialBgColor);
  const [textColor, setTextColor] = useState(initialTextColor);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const adjustFont = (delta: number) => {
    setFontSize((f) => Math.min(FONT_MAX, Math.max(FONT_MIN, f + delta)));
  };

  const updateItem = (i: number, value: string) => {
    const next = [...items];
    next[i] = value;
    setItems(next);
  };

  const addItem = () => setItems([...items, ""]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...items];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setItems(next);
  };
  const moveDown = (i: number) => {
    if (i === items.length - 1) return;
    const next = [...items];
    [next[i + 1], next[i]] = [next[i], next[i + 1]];
    setItems(next);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const cleaned = items.map((s) => s.trim()).filter(Boolean);
      await updateTopNotification(enabled, cleaned, { bgColor, textColor, fontSize });
      setSaved(true);
      toast.success(
        enabled ? "Notification bar live" : "Notification bar saved",
        enabled ? "Customers will see the bar at the top." : "Bar is currently disabled."
      );
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
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-1">Settings</p>
        <h1
          className="text-2xl md:text-3xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Top Notification Bar
        </h1>
        <p className="text-sm text-stone-500 font-light mt-2">
          Scrolling announcement bar shown at the very top of every customer page.
        </p>
      </div>

      <div className="bg-white border border-stone-100 rounded-lg p-4 md:p-8 space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between p-4 bg-stone-50 rounded">
          <div>
            <p className="text-sm font-medium text-stone-800">Show Top Notification Bar</p>
            <p className="text-xs text-stone-500 mt-1">
              Toggle on/off without losing your messages
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? "bg-emerald-500" : "bg-stone-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Items */}
        <div>
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-3">
            Notification Messages
          </label>
          <p className="text-xs text-stone-400 mb-4">
            Add multiple messages — they will scroll continuously across the top bar.
          </p>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-stone-400 text-xs w-6 text-center">{i + 1}</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem(i, e.target.value)}
                  placeholder="e.g. Free delivery on orders above ₹2000"
                  className="flex-1 border border-stone-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-stone-500"
                />
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    className="text-stone-400 hover:text-stone-700 disabled:opacity-30 px-2 text-xs"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(i)}
                    disabled={i === items.length - 1}
                    className="text-stone-400 hover:text-stone-700 disabled:opacity-30 px-2 text-xs"
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-stone-400 hover:text-red-500 px-2 transition-colors"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-4 text-xs px-3 py-1.5 border border-stone-300 text-stone-600 hover:border-stone-700 hover:text-stone-900 transition-colors rounded"
          >
            + Add Message
          </button>
        </div>

        {/* Appearance */}
        <div className="border-t border-stone-100 pt-6">
          <label className="text-xs tracking-widest uppercase text-stone-500 block mb-3">
            Appearance
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-stone-500 mb-2">Background</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer border border-stone-200 rounded"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  maxLength={7}
                  placeholder="#1c1917"
                  className="flex-1 border border-stone-200 px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-stone-500"
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-2">Text</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer border border-stone-200 rounded"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  maxLength={7}
                  placeholder="#ffffff"
                  className="flex-1 border border-stone-200 px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-stone-500"
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-2">Font size ({FONT_MIN}–{FONT_MAX}px)</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustFont(-1)}
                  disabled={fontSize <= FONT_MIN}
                  className="h-10 w-10 border border-stone-200 text-stone-600 hover:border-stone-700 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                  title="Decrease"
                >
                  −
                </button>
                <span className="flex-1 text-center text-sm font-medium text-stone-800 border border-stone-200 px-3 py-2 rounded">
                  {fontSize}px
                </span>
                <button
                  type="button"
                  onClick={() => adjustFont(1)}
                  disabled={fontSize >= FONT_MAX}
                  className="h-10 w-10 border border-stone-200 text-stone-600 hover:border-stone-700 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                  title="Increase"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        {enabled && items.filter((s) => s.trim()).length > 0 && (
          <div>
            <label className="text-xs tracking-widest uppercase text-stone-500 block mb-3">
              Live Preview
            </label>
            <div
              className="py-2 px-4 rounded overflow-hidden"
              style={{ backgroundColor: bgColor, color: textColor }}
            >
              <div className="flex gap-12 whitespace-nowrap"
                style={{ animation: "preview-scroll 30s linear infinite" }}>
                {[...items.filter((s) => s.trim()), ...items.filter((s) => s.trim())].map((item, i) => (
                  <span
                    key={i}
                    className="tracking-[0.2em] uppercase font-light flex items-center gap-3"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    <span style={{ opacity: 0.5 }}>✦</span>
                    {item}
                  </span>
                ))}
              </div>
              <style>{`
                @keyframes preview-scroll {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
              `}</style>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        {/* Save */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-100">
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
              ✓ Saved successfully
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
