"use client";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { deleteOrders } from "@/lib/actions";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

const supabase = createSupabaseBrowserClient();

type Order = {
    id: string;
    created_at: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    address: string;
    city: string;
    pincode: string;
    items: { name: string; quantity: number; selectedSize: string; price: number }[];
    total_price: number;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    status: string;
    delivered: boolean;
    delivery_status?: string;
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-stone-200 text-stone-700",
};

const DELIVERY_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700" },
    handed_to_delivery: { label: "Handed Over", color: "bg-emerald-100 text-emerald-700" },
};

type QuickFilter = "all" | "today" | "yesterday" | "pending" | "unseen";

const SEEN_STORAGE_KEY = "shasstore_seen_orders";

function getSeenOrderIds(): Set<string> {
    try {
        const stored = localStorage.getItem(SEEN_STORAGE_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
        return new Set();
    }
}

function saveSeenOrderIds(ids: Set<string>) {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...ids]));
}

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filtered, setFiltered] = useState<Order[]>([]);
    const [search, setSearch] = useState("");
    const [sortAsc, setSortAsc] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
    const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [isRinging, setIsRinging] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Get unseen orders
    const getUnseenOrders = useCallback(
        (orderList: Order[]) => orderList.filter((o) => !seenIds.has(o.id)),
        [seenIds]
    );

    // ── Notification sound using Web Audio API ──
    const playRingSound = useCallback(() => {
        try {
            const ctx = audioContextRef.current || new AudioContext();
            audioContextRef.current = ctx;

            const playBeep = () => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                osc.type = "sine";
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);

                // Second beep
                setTimeout(() => {
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.frequency.value = 1100;
                    osc2.type = "sine";
                    gain2.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                    osc2.start(ctx.currentTime);
                    osc2.stop(ctx.currentTime + 0.4);
                }, 150);
            };

            playBeep();
        } catch {
            // Audio not supported
        }
    }, []);

    const startRinging = useCallback(() => {
        if (ringIntervalRef.current) return;
        setIsRinging(true);
        playRingSound();
        ringIntervalRef.current = setInterval(() => {
            playRingSound();
        }, 3000); // Ring every 3 seconds
    }, [playRingSound]);

    const stopRinging = useCallback(() => {
        setIsRinging(false);
        if (ringIntervalRef.current) {
            clearInterval(ringIntervalRef.current);
            ringIntervalRef.current = null;
        }
    }, []);

    // ── Check if ringing is needed ──
    const checkAndRing = useCallback(
        (orderList: Order[]) => {
            const unseen = orderList.filter((o) => !seenIds.has(o.id));
            if (unseen.length > 0) {
                startRinging();
            } else {
                stopRinging();
            }
        },
        [seenIds, startRinging, stopRinging]
    );

    // ── Mark order as seen ──
    const markAsSeen = useCallback(
        (orderId: string) => {
            const newSeen = new Set(seenIds);
            newSeen.add(orderId);
            setSeenIds(newSeen);
            saveSeenOrderIds(newSeen);

            // Check if all are now seen
            const remaining = orders.filter((o) => !newSeen.has(o.id));
            if (remaining.length === 0) {
                stopRinging();
            }
        },
        [seenIds, orders, stopRinging]
    );

    // ── Mark ALL as seen ──
    const markAllAsSeen = useCallback(() => {
        const newSeen = new Set(seenIds);
        orders.forEach((o) => newSeen.add(o.id));
        setSeenIds(newSeen);
        saveSeenOrderIds(newSeen);
        stopRinging();
    }, [seenIds, orders, stopRinging]);

    // ── Fetch orders ──
    const fetchOrders = useCallback(async () => {
        const { data } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });
        if (data) {
            setOrders(data);
            return data;
        }
        return null;
    }, []);

    // ── Initial load ──
    useEffect(() => {
        const stored = getSeenOrderIds();
        setSeenIds(stored);

        fetchOrders().then((data) => {
            if (data) {
                const unseen = data.filter((o: Order) => !stored.has(o.id));
                if (unseen.length > 0) {
                    startRinging();
                }
            }
        });

        // Realtime subscription
        const channel = supabase
            .channel("orders-realtime-" + Date.now())
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "orders" },
                (payload) => {
                    const newOrder = payload.new as Order;
                    setOrders((prev) => {
                        const exists = prev.some((o) => o.id === newOrder.id);
                        return exists ? prev : [newOrder, ...prev];
                    });
                    startRinging();
                }
            )
            .subscribe();

        // Polling every 30 seconds
        pollIntervalRef.current = setInterval(async () => {
            const data = await fetchOrders();
            if (data) {
                const currentSeen = getSeenOrderIds();
                const unseen = data.filter((o: Order) => !currentSeen.has(o.id));
                if (unseen.length > 0) {
                    startRinging();
                }
            }
        }, 30000);

        return () => {
            supabase.removeChannel(channel);
            if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Re-check ringing when seenIds change ──
    useEffect(() => {
        checkAndRing(orders);
    }, [seenIds, orders, checkAndRing]);

    // ── Apply quick filter shortcut ──
    function applyQuickFilter(type: QuickFilter) {
        setQuickFilter(type);
        setDateFrom("");
        setDateTo("");
        setSearch("");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);

        let result: Order[] = [];

        if (type === "all") {
            result = orders;
        } else if (type === "today") {
            result = orders.filter((o) => {
                const d = new Date(o.created_at);
                return d >= today && d <= todayEnd;
            });
        } else if (type === "yesterday") {
            result = orders.filter((o) => {
                const d = new Date(o.created_at);
                return d >= yesterday && d <= yesterdayEnd;
            });
        } else if (type === "pending") {
            result = orders.filter((o) => !o.delivered);
        } else if (type === "unseen") {
            result = orders.filter((o) => !seenIds.has(o.id));
        }

        setFiltered(result);
    }

    // ── Search + Date filter ──
    useEffect(() => {
        if (quickFilter !== "all") return;
        const q = search.toLowerCase();
        const result = orders.filter((o) => {
            const itemNames = o.items?.map((i) => i.name).join(" ").toLowerCase() ?? "";
            const matchesSearch =
                !q ||
                o.customer_name?.toLowerCase().includes(q) ||
                o.customer_email?.toLowerCase().includes(q) ||
                o.customer_phone?.toLowerCase().includes(q) ||
                o.address?.toLowerCase().includes(q) ||
                o.city?.toLowerCase().includes(q) ||
                o.pincode?.toLowerCase().includes(q) ||
                o.razorpay_payment_id?.toLowerCase().includes(q) ||
                o.status?.toLowerCase().includes(q) ||
                itemNames.includes(q);

            const orderDate = new Date(o.created_at);
            orderDate.setHours(0, 0, 0, 0);
            const from = dateFrom ? new Date(dateFrom) : null;
            const to = dateTo ? new Date(dateTo) : null;
            if (to) to.setHours(23, 59, 59, 999);
            const matchesFrom = from ? orderDate >= from : true;
            const matchesTo = to ? orderDate <= to : true;

            return matchesSearch && matchesFrom && matchesTo;
        });
        setFiltered(result);
    }, [search, orders, dateFrom, dateTo, quickFilter]);

    function toggleSort() {
        const asc = !sortAsc;
        setSortAsc(asc);
        setFiltered((prev) =>
            [...prev].sort((a, b) =>
                asc
                    ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
        );
    }

    function clearFilters() {
        setSearch("");
        setDateFrom("");
        setDateTo("");
        setSortAsc(false);
        setQuickFilter("all");
        setFiltered(orders);
    }


    const hasActiveFilters = search || dateFrom || dateTo || quickFilter !== "all";
    const unseenCount = getUnseenOrders(orders).length;

    // ── Selection helpers ──
    const toggleSelected = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };
    const allFilteredSelected =
        filtered.length > 0 && filtered.every((o) => selectedIds.has(o.id));
    const toggleSelectAllFiltered = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allFilteredSelected) {
                filtered.forEach((o) => next.delete(o.id));
            } else {
                filtered.forEach((o) => next.add(o.id));
            }
            return next;
        });
    };
    const selectedCount = selectedIds.size;

    // Quick filter counts
    const todayCount = orders.filter((o) => {
        const d = new Date(o.created_at);
        const t = new Date(); t.setHours(0, 0, 0, 0);
        const te = new Date(); te.setHours(23, 59, 59, 999);
        return d >= t && d <= te;
    }).length;

    const yesterdayCount = orders.filter((o) => {
        const d = new Date(o.created_at);
        const y = new Date(); y.setDate(y.getDate() - 1); y.setHours(0, 0, 0, 0);
        const ye = new Date(y); ye.setHours(23, 59, 59, 999);
        return d >= y && d <= ye;
    }).length;

    const pendingCount = orders.filter((o) => !o.delivered).length;

    return (
        <div>
            {/* ── Ringing Alert Bar ── */}
            {isRinging && unseenCount > 0 && (
                <div className="fixed top-0 left-0 right-0 z-50 md:left-64">
                    <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🔔</span>
                            <div>
                                <p className="font-bold text-sm">
                                    {unseenCount} New Order{unseenCount > 1 ? "s" : ""}!
                                </p>
                                <p className="text-xs opacity-90">
                                    Click &quot;Seen&quot; on each order or mark all as seen
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={markAllAsSeen}
                            className="bg-white text-red-600 px-4 py-2 text-xs font-bold tracking-widest uppercase rounded hover:bg-red-50 transition-colors whitespace-nowrap"
                        >
                            Mark All Seen
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={`mb-8 ${isRinging && unseenCount > 0 ? "mt-14" : ""}`}>
                <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Admin</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-4xl text-stone-900 font-light"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        All Orders
                    </h1>
                    {unseenCount > 0 && (
                        <button
                            onClick={markAllAsSeen}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 text-xs tracking-widest uppercase font-medium hover:bg-emerald-700 transition-colors rounded"
                        >
                            <span>✓</span> Mark All as Seen ({unseenCount})
                        </button>
                    )}
                </div>
            </div>

            {/* ── Quick Filter Buttons ── */}
            <div className="flex flex-wrap gap-3 mb-4">
                {[
                    { key: "all", label: "All Orders", count: orders.length },
                    { key: "unseen", label: "🔔 Unseen", count: unseenCount },
                    { key: "today", label: "Today", count: todayCount },
                    { key: "yesterday", label: "Yesterday", count: yesterdayCount },
                    { key: "pending", label: "⏳ Pending", count: pendingCount },
                ].map((f) => (
                    <button
                        key={f.key}
                        onClick={() => applyQuickFilter(f.key as QuickFilter)}
                        style={{
                            padding: "8px 16px",
                            fontSize: "12px",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                            border: "1px solid",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            borderColor: quickFilter === f.key ? "#1c1917" : (f.key === "unseen" && f.count > 0) ? "#ef4444" : "#e7e5e4",
                            backgroundColor: quickFilter === f.key ? "#1c1917" : (f.key === "unseen" && f.count > 0) ? "#fef2f2" : "white",
                            color: quickFilter === f.key ? "white" : (f.key === "unseen" && f.count > 0) ? "#dc2626" : "#78716c",
                            borderRadius: "4px",
                        }}
                    >
                        {f.label}
                        <span style={{
                            marginLeft: "8px",
                            backgroundColor: quickFilter === f.key ? "rgba(255,255,255,0.2)" : (f.key === "unseen" && f.count > 0) ? "#fecaca" : "#f5f5f4",
                            color: quickFilter === f.key ? "white" : (f.key === "unseen" && f.count > 0) ? "#dc2626" : "#78716c",
                            padding: "2px 8px",
                            borderRadius: "99px",
                            fontSize: "11px",
                        }}>
                            {f.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Filter Bar ── */}
            <div className="bg-white border border-stone-100 p-4 mb-6">
                <div className="flex flex-wrap gap-3 items-center">
                    <input
                        type="text"
                        placeholder="Search name, email, phone, city, item, payment ID..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setQuickFilter("all"); }}
                        className="flex-1 min-w-[200px] border border-stone-200 px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-500 bg-white placeholder:text-stone-300"
                    />
                    <div className="flex items-center gap-2">
                        <label className="text-xs tracking-widest uppercase text-stone-400 whitespace-nowrap">From</label>
                        <input type="date" value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setQuickFilter("all"); }}
                            className="border border-stone-200 px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-500 bg-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs tracking-widest uppercase text-stone-400 whitespace-nowrap">To</label>
                        <input type="date" value={dateTo} min={dateFrom}
                            onChange={(e) => { setDateTo(e.target.value); setQuickFilter("all"); }}
                            className="border border-stone-200 px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-500 bg-white" />
                    </div>
                    <button onClick={toggleSort}
                        className="border border-stone-200 px-4 py-2.5 text-xs tracking-widest uppercase text-stone-600 hover:bg-stone-50 transition whitespace-nowrap">
                        {sortAsc ? "↑ Oldest" : "↓ Newest"}
                    </button>
                    {hasActiveFilters && (
                        <button onClick={clearFilters}
                            className="border border-stone-200 px-4 py-2.5 text-xs tracking-widest uppercase text-red-400 hover:border-red-300 transition whitespace-nowrap">
                            ✕ Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Order Count + bulk action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="text-xs text-stone-400 tracking-widest uppercase">
                    Showing {filtered.length} of {orders.length} orders
                    {quickFilter !== "all" && <span className="ml-2 text-stone-500">— {quickFilter} filter active</span>}
                    {dateFrom && dateTo && <span className="ml-2 text-stone-500">({new Date(dateFrom).toLocaleDateString("en-IN")} → {new Date(dateTo).toLocaleDateString("en-IN")})</span>}
                    {dateFrom && !dateTo && <span className="ml-2 text-stone-500">(from {new Date(dateFrom).toLocaleDateString("en-IN")})</span>}
                    {!dateFrom && dateTo && <span className="ml-2 text-stone-500">(until {new Date(dateTo).toLocaleDateString("en-IN")})</span>}
                </p>
                {selectedCount > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs tracking-widest uppercase text-stone-600">
                            {selectedCount} selected
                        </span>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-xs tracking-widest uppercase text-stone-500 hover:text-stone-800 px-3 py-2 border border-stone-200 rounded"
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => setBulkDeleteOpen(true)}
                            className="text-xs tracking-widest uppercase text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-medium"
                        >
                            🗑 Delete Selected ({selectedCount})
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white border border-stone-100 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-100">
                        <tr>
                            <th className="text-left px-4 py-4 w-10">
                                <input
                                    type="checkbox"
                                    checked={allFilteredSelected}
                                    onChange={toggleSelectAllFiltered}
                                    aria-label="Select all visible orders"
                                    className="cursor-pointer w-4 h-4 accent-stone-900"
                                />
                            </th>
                            {["", "Date", "Customer", "Phone", "City", "Items", "Total", "Payment", "Delivery", "Actions"].map((h, i) => (
                                <th key={`${h}-${i}`} className="text-left px-4 py-4 text-xs tracking-widest uppercase text-stone-400 font-medium whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? filtered.map((order) => {
                            const isSeen = seenIds.has(order.id);
                            const isSelected = selectedIds.has(order.id);
                            return (
                                <tr key={order.id}
                                    onClick={() => router.push(`/shasstorebyshahanas/orders/${order.id}`)}
                                    className={`border-b border-stone-50 hover:bg-stone-50 cursor-pointer`}
                                    style={
                                        isSelected
                                            ? { backgroundColor: "#eef2ff", borderLeft: "3px solid #4f46e5" }
                                            : !isSeen
                                            ? { backgroundColor: "#fef2f2", borderLeft: "3px solid #ef4444" }
                                            : {}
                                    }>
                                    {/* Checkbox */}
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelected(order.id)}
                                            aria-label={`Select order ${order.id.slice(0, 8)}`}
                                            className="cursor-pointer w-4 h-4 accent-stone-900"
                                        />
                                    </td>
                                    {/* Seen button */}
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        {!isSeen ? (
                                            <button
                                                onClick={() => markAsSeen(order.id)}
                                                title="Mark as seen"
                                                className="flex items-center gap-1 bg-red-500 text-white text-xs px-2.5 py-1 rounded hover:bg-red-600 transition whitespace-nowrap animate-pulse"
                                            >
                                                🔔
                                            </button>
                                        ) : (
                                            <span className="text-xs text-stone-300">✓</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-stone-500 whitespace-nowrap text-xs">
                                        {new Date(order.created_at).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className="px-4 py-3 text-stone-800 font-medium whitespace-nowrap text-sm">{order.customer_name}</td>
                                    <td className="px-4 py-3 text-stone-500 whitespace-nowrap text-sm">{order.customer_phone}</td>
                                    <td className="px-4 py-3 text-stone-500 text-sm whitespace-nowrap">{order.city}</td>
                                    <td className="px-4 py-3 text-stone-500 text-xs">
                                        {order.items?.length} {order.items?.length === 1 ? "item" : "items"}
                                    </td>
                                    <td className="px-4 py-3 text-stone-800 font-medium whitespace-nowrap text-sm">₹{order.total_price.toLocaleString()}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`text-[10px] px-2 py-1 rounded uppercase tracking-wide font-medium ${PAYMENT_STATUS_COLORS[order.status] || "bg-stone-100 text-stone-600"}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`text-[10px] px-2 py-1 rounded uppercase tracking-wide font-medium ${DELIVERY_STATUS_LABELS[order.delivery_status ?? "pending"]?.color ?? "bg-stone-100 text-stone-600"}`}>
                                            {DELIVERY_STATUS_LABELS[order.delivery_status ?? "pending"]?.label ?? "Pending"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => router.push(`/shasstorebyshahanas/orders/${order.id}`)}
                                            className="flex items-center gap-1 bg-stone-900 text-white text-xs px-3 py-1.5 rounded hover:bg-stone-700 transition whitespace-nowrap">
                                            View
                                        </button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={11} className="px-6 py-12 text-center text-stone-400">
                                    {hasActiveFilters ? "No orders found for the selected filters" : "No orders yet"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <DeleteConfirmModal
                isOpen={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                onConfirm={async (phrase) => {
                    const ids = [...selectedIds];
                    await deleteOrders(ids, phrase);
                    setOrders((prev) => prev.filter((o) => !selectedIds.has(o.id)));
                    setSelectedIds(new Set());
                    setBulkDeleteOpen(false);
                }}
                title={`Delete ${selectedCount} order${selectedCount === 1 ? "" : "s"}`}
                itemType={selectedCount === 1 ? "order" : "orders"}
                details={
                    <div className="space-y-1">
                        <p>You are about to delete <span className="font-medium text-stone-900">{selectedCount}</span> order{selectedCount === 1 ? "" : "s"}.</p>
                        <p className="text-xs text-stone-400 pt-2">Razorpay payments are not refunded automatically — handle refunds separately if needed.</p>
                    </div>
                }
            />
        </div>
    );
}
