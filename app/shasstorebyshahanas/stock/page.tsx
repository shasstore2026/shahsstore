import { getProducts, getCategories } from "@/lib/products";
import { getTotalStock, LOW_STOCK_THRESHOLD } from "@/lib/constants";
import Link from "next/link";

export default async function StockDashboard() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  const inStock = products.filter(
    (p) => p.inStock && getTotalStock(p.size_inventory) > 0
  ).length;
  const outOfStock = products.filter(
    (p) => !p.inStock || getTotalStock(p.size_inventory) === 0
  ).length;
  const featured = products.filter((p) => p.featuredOrder != null).length;

  const totalUnits = products.reduce(
    (sum, p) => sum + getTotalStock(p.size_inventory),
    0
  );

  // ── Catalog overview cards (moved from Order Dashboard) ──
  const catalogStats = [
    { label: "Total Products", value: products.length, color: "bg-stone-900" },
    { label: "In Stock", value: inStock, color: "bg-emerald-700" },
    { label: "Out of Stock", value: outOfStock, color: "bg-red-700" },
    { label: "Featured", value: featured, color: "bg-blue-700" },
    { label: "Categories", value: categories.length, color: "bg-purple-700" },
  ];
  const lowStockProducts = products.filter((p) => {
    const stock = getTotalStock(p.size_inventory);
    return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
  });

  // Aggregate stock by size across all products
  const stockBySize: Record<string, number> = {};
  products.forEach((p) => {
    if (!p.size_inventory) return;
    Object.entries(p.size_inventory).forEach(([size, qty]) => {
      stockBySize[size] = (stockBySize[size] ?? 0) + (qty || 0);
    });
  });
  const sortedSizes = Object.entries(stockBySize).sort((a, b) => b[1] - a[1]);

  // Sold-out products list (for the section below the metrics)
  const soldOutProducts = products.filter(
    (p) => !p.inStock || getTotalStock(p.size_inventory) === 0
  );

  return (
    <div>
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Inventory</p>
        <h1
          className="text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Stock Dashboard
        </h1>
      </div>

      {/* ── Catalog overview ── */}
      <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-4">Catalog Overview</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {catalogStats.map((stat) => (
          <div key={stat.label} className={`${stat.color} text-white p-6 rounded-lg`}>
            <p className="text-3xl font-light mb-1">{stat.value}</p>
            <p className="text-xs tracking-widest uppercase opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Inventory Stock cards ── */}
      <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-4">Inventory Stock</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total units */}
        <div className="bg-white border border-stone-100 rounded-lg p-6">
          <p className="text-xs tracking-widest text-stone-400 uppercase mb-2">Total Units in Stock</p>
          <p className="text-3xl font-light text-stone-900">{totalUnits}</p>
          <p className="text-xs text-stone-500 mt-1">Across all sizes &amp; products</p>
        </div>

        {/* Low stock alert */}
        <div
          className={`border rounded-lg p-6 ${
            lowStockProducts.length > 0
              ? "bg-amber-50 border-amber-200"
              : "bg-white border-stone-100"
          }`}
        >
          <p className="text-xs tracking-widest text-stone-400 uppercase mb-2">Low Stock Alert</p>
          <p
            className={`text-3xl font-light ${
              lowStockProducts.length > 0 ? "text-amber-700" : "text-stone-900"
            }`}
          >
            {lowStockProducts.length}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Products with ≤ {LOW_STOCK_THRESHOLD} pieces total
          </p>
        </div>

        {/* Out of stock */}
        <div
          className={`border rounded-lg p-6 ${
            outOfStock > 0 ? "bg-red-50 border-red-200" : "bg-white border-stone-100"
          }`}
        >
          <p className="text-xs tracking-widest text-stone-400 uppercase mb-2">Sold Out Products</p>
          <p
            className={`text-3xl font-light ${
              outOfStock > 0 ? "text-red-700" : "text-stone-900"
            }`}
          >
            {outOfStock}
          </p>
          <p className="text-xs text-stone-500 mt-1">Restock to bring back online</p>
        </div>
      </div>

      {/* Stock by size breakdown */}
      {sortedSizes.length > 0 && (
        <div className="bg-white border border-stone-100 rounded-lg p-6 mb-8">
          <p className="text-xs tracking-widest text-stone-400 uppercase mb-4">Total Stock by Size</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {sortedSizes.map(([size, qty]) => (
              <div
                key={size}
                className={`border rounded-lg p-3 text-center ${
                  qty === 0
                    ? "bg-stone-50 border-stone-200 text-stone-400"
                    : qty <= LOW_STOCK_THRESHOLD
                    ? "bg-amber-50 border-amber-200"
                    : "bg-emerald-50 border-emerald-200"
                }`}
              >
                <p className="text-xs tracking-widest uppercase text-stone-500 mb-1">{size}</p>
                <p
                  className={`text-2xl font-light ${
                    qty === 0 ? "text-stone-400" : "text-stone-900"
                  }`}
                >
                  {qty}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low stock products list */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
          <p className="text-xs tracking-widest text-amber-700 uppercase mb-3 font-medium">
            ⚠ Restock Needed
          </p>
          <div className="space-y-2">
            {lowStockProducts.map((p) => {
              const stock = getTotalStock(p.size_inventory);
              return (
                <div
                  key={p.id}
                  className="flex justify-between items-center text-sm"
                >
                  <Link
                    href={`/shasstorebyshahanas/products/${p.id}`}
                    className="text-stone-700 hover:text-stone-900 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <span className="text-amber-700 font-medium">
                    Only {stock} {stock === 1 ? "piece" : "pieces"} left
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sold out products list */}
      {soldOutProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-8">
          <p className="text-xs tracking-widest text-red-700 uppercase mb-3 font-medium">
            🚫 Sold Out — Restock to Sell
          </p>
          <div className="space-y-2">
            {soldOutProducts.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center text-sm"
              >
                <Link
                  href={`/shasstorebyshahanas/products/${p.id}`}
                  className="text-stone-700 hover:text-stone-900 hover:underline"
                >
                  {p.name}
                </Link>
                <span className="text-red-600 font-medium">0 in stock</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
