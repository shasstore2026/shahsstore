import { supabaseAdmin } from "@/lib/supabase-admin";
import StorageWidget from "./StorageWidget";

export default async function AdminDashboard() {
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const totalRevenue = orders?.reduce((sum, o) => sum + o.total_price, 0) ?? 0;
  const handedOver = orders?.filter((o) => o.delivery_status === "handed_to_delivery").length ?? 0;
  const pending = (orders?.length ?? 0) - handedOver;

  // ── Order stats — separate row ──
  const orderStats = [
    { label: "Total Orders", value: orders?.length ?? 0, color: "bg-stone-900" },
    { label: "Handed Over", value: handedOver, color: "bg-emerald-700" },
    { label: "Pending", value: pending, color: "bg-red-700" },
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, color: "bg-amber-700" },
  ];


  return (
    <div>
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Welcome back</p>
        <h1 className="text-4xl text-stone-900 font-light"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Order Dashboard
        </h1>
      </div>

      {/* ── Order Stats ── */}
      <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-4">Orders</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {orderStats.map((stat) => (
          <div key={stat.label} className={`${stat.color} text-white p-8 rounded-lg`}>
            <p className="text-4xl font-light mb-2">{stat.value}</p>
            <p className="text-xs tracking-widest uppercase opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Storage Usage ── */}
      <StorageWidget />

      {/* Recent Orders */}
      <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-6">Recent Orders</p>
      <div className="bg-white border border-stone-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-100">
            <tr>
              {["Date", "Customer", "Phone", "City", "Items", "Total", "Status"].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders && orders.length > 0 ? orders.slice(0, 10).map((order) => (
              <tr key={order.id} className="border-b border-stone-50 hover:bg-stone-50">
                <td className="px-6 py-4 text-stone-500 whitespace-nowrap">
                  {new Date(order.created_at).toLocaleDateString("en-IN")}
                </td>
                <td className="px-6 py-4 text-stone-800 font-medium">{order.customer_name}</td>
                <td className="px-6 py-4 text-stone-500">{order.customer_phone}</td>
                <td className="px-6 py-4 text-stone-500">{order.city}</td>
                <td className="px-6 py-4 text-stone-500">{order.items.length} item(s)</td>
                <td className="px-6 py-4 text-stone-800 font-medium whitespace-nowrap">
                  ₹{order.total_price.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full uppercase tracking-widest">
                    {order.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-stone-400">No orders yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
