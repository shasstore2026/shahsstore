"use client";
import { useState } from "react";

type Pair = { key: string; value: string };

export default function KeyValueEditor({
  initialData,
  onChange,
  keyPlaceholder = "Field",
  valuePlaceholder = "Value",
  presets = [],
}: {
  initialData: Record<string, string>;
  onChange: (data: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  presets?: string[];
}) {
  const [pairs, setPairs] = useState<Pair[]>(
    Object.entries(initialData || {}).map(([key, value]) => ({ key, value })) || []
  );

  const updatePairs = (newPairs: Pair[]) => {
    setPairs(newPairs);
    const obj: Record<string, string> = {};
    newPairs.forEach((p) => {
      if (p.key.trim()) obj[p.key.trim()] = p.value;
    });
    onChange(obj);
  };

  const addPair = (key = "") => {
    updatePairs([...pairs, { key, value: "" }]);
  };

  const updatePair = (index: number, field: "key" | "value", value: string) => {
    const next = [...pairs];
    next[index][field] = value;
    updatePairs(next);
  };

  const removePair = (index: number) => {
    updatePairs(pairs.filter((_, i) => i !== index));
  };

  const usedKeys = new Set(pairs.map((p) => p.key.toLowerCase()));
  const availablePresets = presets.filter((p) => !usedKeys.has(p.toLowerCase()));

  return (
    <div className="space-y-2">
      {pairs.map((pair, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            value={pair.key}
            onChange={(e) => updatePair(i, "key", e.target.value)}
            placeholder={keyPlaceholder}
            className="w-1/3 border border-stone-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-stone-500"
          />
          <input
            type="text"
            value={pair.value}
            onChange={(e) => updatePair(i, "value", e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 border border-stone-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-stone-500"
          />
          <button
            type="button"
            onClick={() => removePair(i)}
            className="px-3 py-2 text-stone-400 hover:text-red-500 transition-colors text-sm"
            title="Remove"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={() => addPair("")}
          className="text-xs px-3 py-1.5 border border-stone-300 text-stone-600 hover:border-stone-700 hover:text-stone-900 transition-colors rounded"
        >
          + Add Custom Field
        </button>
        {availablePresets.length > 0 &&
          availablePresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => addPair(preset)}
              className="text-xs px-3 py-1.5 border border-stone-200 text-stone-500 hover:border-stone-500 hover:text-stone-800 transition-colors rounded"
            >
              + {preset}
            </button>
          ))}
      </div>
    </div>
  );
}
