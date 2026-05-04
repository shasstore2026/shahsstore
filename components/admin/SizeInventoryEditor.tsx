"use client";
import { useState } from "react";

type Row = { size: string; quantity: number };

export default function SizeInventoryEditor({
  initialData,
  onChange,
}: {
  initialData: Record<string, number>;
  onChange: (data: Record<string, number>) => void;
}) {
  const initial: Row[] = Object.entries(initialData || {}).map(([size, quantity]) => ({
    size,
    quantity: Number(quantity) || 0,
  }));

  const [rows, setRows] = useState<Row[]>(initial.length > 0 ? initial : [{ size: "", quantity: 0 }]);

  const sync = (next: Row[]) => {
    setRows(next);
    const obj: Record<string, number> = {};
    next.forEach((r) => {
      const s = r.size.trim();
      if (s) obj[s] = Math.max(0, Math.floor(r.quantity || 0));
    });
    onChange(obj);
  };

  const updateRow = (index: number, field: "size" | "quantity", value: string) => {
    const next = [...rows];
    if (field === "size") next[index].size = value;
    else next[index].quantity = parseInt(value) || 0;
    sync(next);
  };

  const addRow = (preset?: string) => {
    sync([...rows, { size: preset ?? "", quantity: 0 }]);
  };

  const removeRow = (index: number) => {
    sync(rows.filter((_, i) => i !== index));
  };

  const usedSizes = new Set(rows.map((r) => r.size.toLowerCase()));
  const presets = ["S", "M", "L", "XL", "XXL", "38", "39", "40", "41", "42", "43", "44"];
  const available = presets.filter((p) => !usedSizes.has(p.toLowerCase()));

  const totalStock = rows.reduce((sum, r) => sum + (r.quantity || 0), 0);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="text"
              value={row.size}
              onChange={(e) => updateRow(i, "size", e.target.value)}
              placeholder="Size (e.g. M, L, 40)"
              className="w-1/3 border border-stone-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-stone-500"
            />
            <input
              type="number"
              min={0}
              value={row.quantity}
              onChange={(e) => updateRow(i, "quantity", e.target.value)}
              placeholder="Quantity"
              className="flex-1 border border-stone-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-stone-500"
            />
            <span className="text-xs text-stone-400 w-16 text-right">
              {row.quantity > 0 ? `${row.quantity} pcs` : "Out"}
            </span>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="px-3 py-2 text-stone-400 hover:text-red-500 transition-colors text-sm"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addRow("")}
          className="text-xs px-3 py-1.5 border border-stone-300 text-stone-600 hover:border-stone-700 hover:text-stone-900 transition-colors rounded"
        >
          + Add Custom Size
        </button>
        {available.length > 0 &&
          available.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => addRow(p)}
              className="text-xs px-3 py-1.5 border border-stone-200 text-stone-500 hover:border-stone-500 hover:text-stone-800 transition-colors rounded"
            >
              + {p}
            </button>
          ))}
      </div>

      <div className="text-xs text-stone-500 bg-stone-50 px-3 py-2 rounded border border-stone-100">
        <span className="font-medium">Total stock:</span>{" "}
        <span className={totalStock === 0 ? "text-red-500" : "text-stone-700"}>
          {totalStock} {totalStock === 1 ? "piece" : "pieces"}
        </span>
        {totalStock === 0 && (
          <span className="ml-2 text-red-500">⚠ Product will show as Sold Out</span>
        )}
      </div>
    </div>
  );
}
