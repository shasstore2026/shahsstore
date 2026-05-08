"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { handleDelete, handleFeaturedOrder } from "./actions";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { useToast } from "@/components/admin/Toast";
import { validateFeaturedOrder, formatConflictMessage } from "@/lib/admin-validators";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  inStock: boolean;
  sizes: string[];
  size_inventory?: Record<string, number>;
  featuredOrder?: number | null;
};

const LOW_STOCK = 3;
function totalStock(p: Product) {
  if (!p.size_inventory) return 0;
  return Object.values(p.size_inventory).reduce((s, q) => s + (q || 0), 0);
}

export default function AdminProductsClient({ products }: { products: Product[] }) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Wrap server action with toast feedback for featured_order
  async function saveFeaturedOrder(productId: string, formData: FormData) {
    const value = formData.get("featured_order") as string;

    // Pre-validate to catch conflicts with friendly messages
    if (value) {
      const result = await validateFeaturedOrder(value, productId);
      if (result && result.available === false) {
        const msg = formatConflictMessage("Featured order", value, result);
        toast.error("Featured order is taken", msg);
        return;
      }
    }

    try {
      await handleFeaturedOrder(productId, formData);
      toast.success("Saved", value ? `Featured order set to ${value}.` : "Removed from featured.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save featured order";
      toast.error("Could not save", msg);
    }
  }

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
      if (stockFilter === "In Stock" && !p.inStock) return false;
      if (stockFilter === "Sold Out" && p.inStock) return false;
      if (q) {
        const searchable = [
          p.name,
          p.category,
          `₹${p.price.toLocaleString()}`,
          String(p.price),
          p.sizes.join(" "),
          p.inStock ? "in stock" : "sold out",
          p.featuredOrder != null ? String(p.featuredOrder) : "",
        ].join(" ").toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [search, categoryFilter, stockFilter, products]);

  return (
    <div>
      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, shirt style, price, size, stock..."
          className="flex-1 min-w-[220px] border border-stone-200 px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-500 placeholder:text-stone-300"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-stone-200 px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-500 bg-white"
        >
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="border border-stone-200 px-4 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-stone-500 bg-white"
        >
          {["All", "In Stock", "Sold Out"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <div className="flex items-center px-4 py-2.5 bg-stone-50 border border-stone-100 text-xs text-stone-400 tracking-widest uppercase">
          {filtered.length} / {products.length} shirts
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white border border-stone-100 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-100">
            <tr>
              {["Image", "Name", "Shirt Style / Category", "Price", "Stock", "Featured", "Actions"].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-400 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-stone-300 text-sm tracking-widest uppercase">
                  No shirts found
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="relative w-12 h-12 bg-stone-100 overflow-hidden">
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-stone-800 font-medium text-sm">{product.name}</p>
                    <p className="text-stone-400 text-xs mt-0.5">
                      {product.size_inventory && Object.keys(product.size_inventory).length > 0
                        ? Object.entries(product.size_inventory)
                            .map(([s, q]) => `${s}:${q}`)
                            .join(" · ")
                        : product.sizes.join(", ")}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-stone-100 text-stone-600 px-3 py-1 tracking-wide uppercase">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-stone-700 text-sm font-medium">
                    ₹{product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const stock = totalStock(product);
                      const out = !product.inStock || stock === 0;
                      const low = !out && stock <= LOW_STOCK;
                      return (
                        <div>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            out ? "bg-red-50 text-red-600" : low ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {out ? "Sold Out" : low ? `Low (${stock})` : `In Stock (${stock})`}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <form action={saveFeaturedOrder.bind(null, product.id)}>
                      <div className="flex items-center gap-2">
                        <input type="number" name="featured_order" min="1" max="99"
                          defaultValue={product.featuredOrder ?? ""} placeholder="—"
                          className="w-14 border border-stone-200 text-center text-sm text-stone-700 py-1 focus:outline-none focus:border-stone-500 rounded" />
                        <button type="submit" className="text-xs text-stone-400 hover:text-stone-900 transition-colors" title="Save">✓</button>
                      </div>
                    </form>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <Link href={`/shasstorebyshahanas/products/${product.id}`}
                        className="text-xs text-stone-500 hover:text-stone-900 underline underline-offset-4 transition-colors">Edit</Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(product)}
                        className="text-xs text-red-400 hover:text-red-600 underline underline-offset-4 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-stone-100 p-8 text-center text-stone-300 text-sm tracking-widest uppercase">
            No shirts found
          </div>
        ) : (
          filtered.map((product) => (
            <div key={product.id} className="bg-white border border-stone-100 p-4 flex gap-4">
              <div className="relative w-16 h-20 bg-stone-100 overflow-hidden flex-shrink-0">
                <Image src={product.image} alt={product.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-stone-800 font-medium text-sm truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 tracking-wide uppercase">{product.category}</span>
                  <span className="text-stone-700 text-sm font-medium">₹{product.price.toLocaleString()}</span>
                  {(() => {
                    const stock = totalStock(product);
                    const out = !product.inStock || stock === 0;
                    const low = !out && stock <= LOW_STOCK;
                    return (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        out ? "bg-red-50 text-red-600" : low ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                      }`}>{out ? "Sold Out" : low ? `Low (${stock})` : `In Stock (${stock})`}</span>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Link href={`/shasstorebyshahanas/products/${product.id}`}
                    className="text-xs text-stone-500 hover:text-stone-900 underline underline-offset-4">Edit</Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(product)}
                    className="text-xs text-red-400 hover:text-red-600 underline underline-offset-4"
                  >
                    Delete
                  </button>
                  <form action={saveFeaturedOrder.bind(null, product.id)} className="flex items-center gap-1 ml-auto">
                    <input type="number" name="featured_order" min="1" max="99"
                      defaultValue={product.featuredOrder ?? ""} placeholder="★"
                      className="w-12 border border-stone-200 text-center text-xs text-stone-700 py-1 focus:outline-none focus:border-stone-500 rounded" />
                    <button type="submit" className="text-xs text-stone-400 hover:text-stone-900">✓</button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async (phrase) => {
          if (!deleteTarget) return;
          const name = deleteTarget.name;
          await handleDelete(deleteTarget.id, phrase);
          toast.success("Shirt deleted", `"${name}" has been removed from your store.`);
          setDeleteTarget(null);
        }}
        title={deleteTarget?.name ?? ""}
        itemType="shirt"
        details={
          deleteTarget && (
            <div className="flex gap-4">
              <div className="relative w-20 h-24 bg-stone-100 flex-shrink-0 overflow-hidden rounded">
                <Image src={deleteTarget.image} alt={deleteTarget.name} fill className="object-cover" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between gap-4">
                  <span className="text-xs text-stone-400 uppercase tracking-widest">Name</span>
                  <span className="text-stone-800 font-medium text-right">{deleteTarget.name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-xs text-stone-400 uppercase tracking-widest">Category</span>
                  <span className="text-stone-700">{deleteTarget.category}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-xs text-stone-400 uppercase tracking-widest">Price</span>
                  <span className="text-stone-700">₹{deleteTarget.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-xs text-stone-400 uppercase tracking-widest">Stock</span>
                  <span className="text-stone-700">
                    {totalStock(deleteTarget)} {totalStock(deleteTarget) === 1 ? "piece" : "pieces"}
                  </span>
                </div>
                {deleteTarget.size_inventory && Object.keys(deleteTarget.size_inventory).length > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-xs text-stone-400 uppercase tracking-widest">Sizes</span>
                    <span className="text-stone-700 text-xs text-right">
                      {Object.entries(deleteTarget.size_inventory).map(([s, q]) => `${s}:${q}`).join(" · ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        }
      />
    </div>
  );
}
