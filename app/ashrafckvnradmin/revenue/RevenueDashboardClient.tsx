"use client";
import { Fragment, useMemo, useState } from "react";
import { Product } from "@/types";
import { ShirtStyle } from "@/lib/products";

type OrderItem = {
  id?: string;
  name?: string;
  selectedSize?: string;
  quantity?: number;
  price?: number;
};

type Order = {
  id: string;
  created_at: string;
  items: OrderItem[];
  total_price: number;
  status: string;
};

type DateFilter = "all" | "7d" | "30d" | "today";

const UNCATEGORIZED = "Uncategorized";

export default function RevenueDashboardClient({
  orders,
  products,
  shirtStyles,
}: {
  orders: Order[];
  products: Product[];
  shirtStyles: ShirtStyle[];
}) {
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [expandedShirt, setExpandedShirt] = useState<string | null>(null);

  // Map product id → product (so we can resolve current category/name)
  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  // Date-filtered orders
  const filteredOrders = useMemo(() => {
    if (dateFilter === "all") return orders;
    const now = Date.now();
    const cutoff = (() => {
      if (dateFilter === "today") {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }
      if (dateFilter === "7d") return now - 7 * 24 * 60 * 60 * 1000;
      if (dateFilter === "30d") return now - 30 * 24 * 60 * 60 * 1000;
      return 0;
    })();
    return orders.filter((o) => new Date(o.created_at).getTime() >= cutoff);
  }, [orders, dateFilter]);

  // ── Aggregations ──
  const aggregates = useMemo(() => {
    let totalRevenue = 0;
    let totalUnits = 0;

    type ShirtAgg = {
      productId: string;
      name: string;
      category: string;
      revenue: number;
      units: number;
      bySize: Map<string, { revenue: number; units: number }>;
    };

    const byCategory = new Map<string, { revenue: number; units: number; orders: Set<string> }>();
    const byShirt = new Map<string, ShirtAgg>();
    const bySize = new Map<string, { revenue: number; units: number }>();

    for (const order of filteredOrders) {
      totalRevenue += Number(order.total_price ?? 0);
      const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];

      for (const item of items) {
        const qty = Math.max(0, Math.floor(Number(item.quantity ?? 0)));
        const unitPrice = Number(item.price ?? 0);
        const lineRevenue = unitPrice * qty;
        totalUnits += qty;

        const product = item.id ? productById.get(item.id) : undefined;
        const category = product?.category?.trim() || UNCATEGORIZED;
        const shirtKey = item.id || `name:${(item.name ?? "Unknown").toLowerCase()}`;
        const shirtName = product?.name || item.name || "Unknown product";
        const size = (item.selectedSize ?? "—").trim() || "—";

        // by category
        const c = byCategory.get(category) ?? { revenue: 0, units: 0, orders: new Set<string>() };
        c.revenue += lineRevenue;
        c.units += qty;
        c.orders.add(order.id);
        byCategory.set(category, c);

        // by shirt
        const s = byShirt.get(shirtKey) ?? {
          productId: item.id ?? "",
          name: shirtName,
          category,
          revenue: 0,
          units: 0,
          bySize: new Map(),
        };
        s.revenue += lineRevenue;
        s.units += qty;
        const sb = s.bySize.get(size) ?? { revenue: 0, units: 0 };
        sb.revenue += lineRevenue;
        sb.units += qty;
        s.bySize.set(size, sb);
        byShirt.set(shirtKey, s);

        // by size (across all)
        const z = bySize.get(size) ?? { revenue: 0, units: 0 };
        z.revenue += lineRevenue;
        z.units += qty;
        bySize.set(size, z);
      }
    }

    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const categoryRows = [...byCategory.entries()]
      .map(([name, v]) => ({ name, revenue: v.revenue, units: v.units, orderCount: v.orders.size }))
      .sort((a, b) => b.revenue - a.revenue);

    const shirtRows = [...byShirt.values()].sort((a, b) => b.revenue - a.revenue);

    const sizeRows = [...bySize.entries()]
      .map(([size, v]) => ({ size, revenue: v.revenue, units: v.units }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalUnits,
      totalOrders,
      avgOrderValue,
      categoryRows,
      shirtRows,
      sizeRows,
    };
  }, [filteredOrders, productById]);

  const maxCategoryRev = Math.max(1, ...aggregates.categoryRows.map((r) => r.revenue));
  const maxShirtRev = Math.max(1, ...aggregates.shirtRows.map((r) => r.revenue));
  const maxSizeRev = Math.max(1, ...aggregates.sizeRows.map((r) => r.revenue));

  const fmt = (n: number) =>
    `₹${Math.round(n).toLocaleString("en-IN")}`;

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Reports</p>
        <h1
          className="text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Revenue Dashboard
        </h1>
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            { key: "all", label: "All Time" },
            { key: "30d", label: "Last 30 Days" },
            { key: "7d", label: "Last 7 Days" },
            { key: "today", label: "Today" },
          ] as { key: DateFilter; label: string }[]
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setDateFilter(f.key)}
            className={`px-4 py-2 text-xs tracking-widest uppercase border rounded transition ${
              dateFilter === f.key
                ? "bg-stone-900 text-white border-stone-900"
                : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Revenue", value: fmt(aggregates.totalRevenue), color: "bg-amber-700" },
          { label: "Total Orders", value: aggregates.totalOrders.toLocaleString(), color: "bg-stone-900" },
          { label: "Units Sold", value: aggregates.totalUnits.toLocaleString(), color: "bg-emerald-700" },
          { label: "Avg Order Value", value: fmt(aggregates.avgOrderValue), color: "bg-blue-700" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} text-white p-6 rounded-lg`}>
            <p className="text-3xl font-light mb-1">{stat.value}</p>
            <p className="text-xs tracking-widest uppercase opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue by Category / Shirt Style */}
      <section className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-4">
          Revenue by Category / Shirt Style
        </p>
        <div className="bg-white border border-stone-100 rounded-lg overflow-hidden">
          {aggregates.categoryRows.length === 0 ? (
            <p className="px-6 py-8 text-center text-stone-400 text-sm">No revenue data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  {["Category", "Orders", "Units Sold", "Revenue", "% of Total"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs tracking-widest uppercase text-stone-400 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aggregates.categoryRows.map((r) => {
                  const pct = aggregates.totalRevenue > 0 ? (r.revenue / aggregates.totalRevenue) * 100 : 0;
                  const barPct = (r.revenue / maxCategoryRev) * 100;
                  return (
                    <tr key={r.name} className="border-b border-stone-50">
                      <td className="px-6 py-4 text-stone-800 font-medium">{r.name}</td>
                      <td className="px-6 py-4 text-stone-500">{r.orderCount}</td>
                      <td className="px-6 py-4 text-stone-500">{r.units}</td>
                      <td className="px-6 py-4 text-stone-900 font-medium whitespace-nowrap">{fmt(r.revenue)}</td>
                      <td className="px-6 py-4 w-1/3 min-w-[140px]">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-stone-100 rounded overflow-hidden">
                            <div
                              className="h-full bg-amber-600"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-stone-500 w-12 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Revenue per Shirt — expandable size breakdown */}
      <section className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-4">
          Revenue by Shirt
        </p>
        <p className="text-xs text-stone-400 mb-3">
          Click a row to see the size breakdown for that shirt.
        </p>
        <div className="bg-white border border-stone-100 rounded-lg overflow-hidden">
          {aggregates.shirtRows.length === 0 ? (
            <p className="px-6 py-8 text-center text-stone-400 text-sm">No shirts sold in this period.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  {["", "Shirt", "Category", "Units Sold", "Revenue", "% of Total"].map((h, i) => (
                    <th key={`${h}-${i}`} className="text-left px-4 py-3 text-xs tracking-widest uppercase text-stone-400 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aggregates.shirtRows.map((r) => {
                  const key = r.productId || `name:${r.name}`;
                  const expanded = expandedShirt === key;
                  const pct = aggregates.totalRevenue > 0 ? (r.revenue / aggregates.totalRevenue) * 100 : 0;
                  const barPct = (r.revenue / maxShirtRev) * 100;
                  const sizeEntries = [...r.bySize.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
                  return (
                    <Fragment key={key}>
                      <tr
                        onClick={() => setExpandedShirt(expanded ? null : key)}
                        className="border-b border-stone-50 hover:bg-stone-50 cursor-pointer"
                      >
                        <td className="px-4 py-4 text-stone-400 w-8">{expanded ? "▾" : "▸"}</td>
                        <td className="px-4 py-4 text-stone-800 font-medium">{r.name}</td>
                        <td className="px-4 py-4 text-stone-500">{r.category}</td>
                        <td className="px-4 py-4 text-stone-500">{r.units}</td>
                        <td className="px-4 py-4 text-stone-900 font-medium whitespace-nowrap">{fmt(r.revenue)}</td>
                        <td className="px-4 py-4 w-1/3 min-w-[140px]">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-stone-100 rounded overflow-hidden">
                              <div className="h-full bg-stone-900" style={{ width: `${barPct}%` }} />
                            </div>
                            <span className="text-xs text-stone-500 w-12 text-right">{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-stone-50 border-b border-stone-100">
                          <td></td>
                          <td colSpan={5} className="px-4 py-4">
                            <p className="text-xs tracking-widest uppercase text-stone-400 mb-3">
                              Revenue by Size — {r.name}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {sizeEntries.map(([size, v]) => (
                                <div key={size} className="bg-white border border-stone-200 rounded p-3">
                                  <p className="text-xs tracking-widest uppercase text-stone-400 mb-1">{size}</p>
                                  <p className="text-stone-900 font-medium">{fmt(v.revenue)}</p>
                                  <p className="text-xs text-stone-500 mt-0.5">{v.units} unit{v.units === 1 ? "" : "s"}</p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Revenue by Size (across all shirts) */}
      <section className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-4">
          Revenue by Size — All Shirts
        </p>
        <div className="bg-white border border-stone-100 rounded-lg overflow-hidden">
          {aggregates.sizeRows.length === 0 ? (
            <p className="px-6 py-8 text-center text-stone-400 text-sm">No size data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  {["Size", "Units Sold", "Revenue", "% of Total"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs tracking-widest uppercase text-stone-400 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aggregates.sizeRows.map((r) => {
                  const pct = aggregates.totalRevenue > 0 ? (r.revenue / aggregates.totalRevenue) * 100 : 0;
                  const barPct = (r.revenue / maxSizeRev) * 100;
                  return (
                    <tr key={r.size} className="border-b border-stone-50">
                      <td className="px-6 py-4 text-stone-800 font-medium uppercase tracking-widest">{r.size}</td>
                      <td className="px-6 py-4 text-stone-500">{r.units}</td>
                      <td className="px-6 py-4 text-stone-900 font-medium whitespace-nowrap">{fmt(r.revenue)}</td>
                      <td className="px-6 py-4 w-1/3 min-w-[140px]">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-stone-100 rounded overflow-hidden">
                            <div className="h-full bg-emerald-600" style={{ width: `${barPct}%` }} />
                          </div>
                          <span className="text-xs text-stone-500 w-12 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Quiet hint about shirt-style fallback */}
      {shirtStyles.length === 0 && (
        <p className="text-xs text-stone-400">
          (No shirt styles defined. Categories above come from product records directly.)
        </p>
      )}
    </div>
  );
}
