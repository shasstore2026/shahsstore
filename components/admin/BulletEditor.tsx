"use client";
import { useState } from "react";

export default function BulletEditor({
  initialItems,
  onChange,
}: {
  initialItems: string[];
  onChange: (items: string[]) => void;
}) {
  const [items, setItems] = useState<string[]>(initialItems || []);

  const update = (next: string[]) => {
    setItems(next);
    onChange(next.filter((s) => s.trim() !== ""));
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="text-stone-400 mt-2.5">•</span>
          <textarea
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              update(next);
            }}
            placeholder="e.g. PURE COTTON TWILL: Combines softness with strength"
            rows={2}
            className="flex-1 border border-stone-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-stone-500 resize-none"
          />
          <button
            type="button"
            onClick={() => update(items.filter((_, idx) => idx !== i))}
            className="px-3 py-2 text-stone-400 hover:text-red-500 transition-colors text-sm"
            title="Remove"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => update([...items, ""])}
        className="text-xs px-3 py-1.5 border border-stone-300 text-stone-600 hover:border-stone-700 hover:text-stone-900 transition-colors rounded"
      >
        + Add Bullet Point
      </button>
    </div>
  );
}
