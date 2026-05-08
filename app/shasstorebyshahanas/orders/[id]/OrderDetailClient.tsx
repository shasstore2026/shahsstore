"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateOrderStatus, deleteOrder } from "@/lib/actions";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

type OrderItem = {
  id?: string;
  name: string;
  quantity: number;
  selectedSize: string;
  price: number;
  image?: string;
};

type Order = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  city: string;
  pincode: string;
  items: OrderItem[];
  total_price: number;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  status: string;
  delivered: boolean;
  delivery_status?: string;
};

const PAYMENT_STATUS_OPTIONS = [
  { value: "paid", label: "Paid", color: "bg-emerald-100 text-emerald-700" },
  { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-700" },
  { value: "failed", label: "Failed", color: "bg-red-100 text-red-700" },
  { value: "refunded", label: "Refunded", color: "bg-stone-200 text-stone-700" },
];

const DELIVERY_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-700", desc: "Order received, awaiting confirmation" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-700", desc: "Order confirmed by admin" },
  { value: "handed_to_delivery", label: "Handed to Delivery", color: "bg-emerald-100 text-emerald-700", desc: "Given to delivery agent" },
];

export default function OrderDetailClient({ order: initialOrder }: { order: Order }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order>({
    ...initialOrder,
    delivery_status: initialOrder.delivery_status ?? "pending",
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    setSavingPayment(true);
    try {
      await updateOrderStatus(order.id, { status: newStatus });
      setOrder({ ...order, status: newStatus });
      showMessage("success", "Payment status updated");
    } catch {
      showMessage("error", "Failed to update payment status");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeliveryStatusChange = async (newStatus: string) => {
    setSavingDelivery(true);
    try {
      await updateOrderStatus(order.id, {
        delivery_status: newStatus,
        delivered: newStatus === "handed_to_delivery",
      });
      setOrder({
        ...order,
        delivery_status: newStatus,
        delivered: newStatus === "handed_to_delivery",
      });
      showMessage("success", "Delivery status updated");
    } catch {
      showMessage("error", "Failed to update delivery status");
    } finally {
      setSavingDelivery(false);
    }
  };

  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

  const printLabel = () => {
    const win = window.open("", "_blank", "width=600,height=500");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Shipping Label - ${escapeHtml(order.customer_name)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .label { width: 380px; border: 2px solid #000; padding: 20px; margin: auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 12px; }
            .brand { font-size: 22px; font-weight: bold; letter-spacing: 4px; }
            .label-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #555; }
            .section { margin-bottom: 12px; }
            .section-title { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 4px; }
            .section-value { font-size: 14px; font-weight: bold; }
            .section-sub { font-size: 12px; color: #333; }
            .items { border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px; }
            .item-row { font-size: 11px; color: #444; margin-bottom: 3px; }
            .footer { border-top: 1px solid #ccc; margin-top: 12px; padding-top: 10px; display: flex; justify-content: space-between; }
            .total { font-size: 14px; font-weight: bold; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body onload="window.print()">
          <div class="label">
            <div class="header">
              <div class="brand">SHASSTORE</div>
              <div class="label-tag">Shipping Label</div>
            </div>
            <div class="section">
              <div class="section-title">Ship To</div>
              <div class="section-value">${escapeHtml(order.customer_name)}</div>
              <div class="section-sub">${escapeHtml(order.address)}</div>
              <div class="section-sub">${escapeHtml(order.city)} - ${escapeHtml(order.pincode)}</div>
              <div class="section-sub">${escapeHtml(order.customer_phone)}</div>
            </div>
            <div class="items">
              <div class="section-title">Items</div>
              ${order.items.map((i) => `
                <div class="item-row">${escapeHtml(i.name)} - Size ${escapeHtml(i.selectedSize)} x ${i.quantity}</div>
              `).join("")}
            </div>
            <div class="footer">
              <div>${new Date(order.created_at).toLocaleDateString("en-IN")}</div>
              <div class="total">Rs.${order.total_price.toLocaleString()}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
  };

  const sendWhatsApp = () => {
    const text = `Hi ${order.customer_name}, this is Shasstore — your order #${order.id.slice(0, 8)} has been received. Total: ₹${order.total_price.toLocaleString()}. We'll keep you updated on the delivery!`;
    const phone = order.customer_phone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const callCustomer = () => {
    window.location.href = `tel:${order.customer_phone}`;
  };

  const emailCustomer = () => {
    window.location.href = `mailto:${order.customer_email}?subject=Your Shasstore Order #${order.id.slice(0, 8)}`;
  };

  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const paymentStatusOpt = PAYMENT_STATUS_OPTIONS.find((s) => s.value === order.status);
  const deliveryStatusOpt = DELIVERY_STATUS_OPTIONS.find((s) => s.value === order.delivery_status);

  return (
    <div className="max-w-6xl">
      {/* Back button */}
      <Link
        href="/shasstorebyshahanas/orders"
        className="text-xs text-stone-400 hover:text-stone-700 tracking-widest uppercase mb-4 inline-flex items-center gap-2 transition-colors"
      >
        ← Back to Orders
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-1">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <h1
            className="text-2xl md:text-3xl text-stone-900 font-light"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {order.customer_name}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {paymentStatusOpt && (
            <span className={`text-xs px-3 py-1.5 rounded-full uppercase tracking-widest font-medium ${paymentStatusOpt.color}`}>
              💳 {paymentStatusOpt.label}
            </span>
          )}
          {deliveryStatusOpt && (
            <span className={`text-xs px-3 py-1.5 rounded-full uppercase tracking-widest font-medium ${deliveryStatusOpt.color}`}>
              📦 {deliveryStatusOpt.label}
            </span>
          )}
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="text-xs px-3 py-1.5 rounded-full uppercase tracking-widest font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            🗑 Delete
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={async (phrase) => {
          await deleteOrder(order.id, phrase);
          router.push("/shasstorebyshahanas/orders");
        }}
        title={`Delete order #${order.id.slice(0, 8).toUpperCase()}`}
        itemType="order"
        details={
          <div className="space-y-1">
            <p><span className="text-stone-500">Customer:</span> <span className="text-stone-900 font-medium">{order.customer_name}</span></p>
            <p><span className="text-stone-500">Total:</span> <span className="text-stone-900 font-medium">₹{order.total_price.toLocaleString()}</span></p>
            <p><span className="text-stone-500">Items:</span> <span className="text-stone-900 font-medium">{order.items.length}</span></p>
            <p className="text-xs text-stone-400 pt-2">The order record will be permanently removed. The Razorpay payment is not refunded — handle that separately if needed.</p>
          </div>
        }
      />

      {/* Toast Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded text-sm ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer + Address combined */}
          <div className="bg-white border border-stone-100 rounded-lg p-5">
            <h2 className="text-xs tracking-widest uppercase text-stone-700 font-medium mb-3 pb-2 border-b border-stone-100">
              Customer & Shipping
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Name</p>
                <p className="text-stone-800">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Phone</p>
                <p className="text-stone-800">{order.customer_phone}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Email</p>
                <p className="text-stone-800 break-all">{order.customer_email}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Delivery Address</p>
                <p className="text-stone-800 leading-relaxed">
                  {order.address}, {order.city} — {order.pincode}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white border border-stone-100 rounded-lg p-5">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-stone-100">
              <h2 className="text-xs tracking-widest uppercase text-stone-700 font-medium">
                Items
              </h2>
              <span className="text-xs text-stone-400">{itemCount} {itemCount === 1 ? "piece" : "pieces"}</span>
            </div>

            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 bg-stone-50 rounded text-sm"
                >
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-14 object-cover bg-stone-100 flex-shrink-0 rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-stone-800 font-medium truncate">{item.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Size {item.selectedSize} • Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-stone-700 font-medium whitespace-nowrap">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 mt-3 pt-3 flex justify-between items-center">
              <span className="text-xs text-stone-500 tracking-widest uppercase">Total</span>
              <span className="text-lg text-stone-900 font-medium">
                ₹{order.total_price.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Right column — Status & Actions ── */}
        <div className="space-y-4">
          {/* Status Update Form */}
          <div className="bg-white border border-stone-100 rounded-lg p-5 lg:sticky lg:top-6">
            <h2 className="text-xs tracking-widest uppercase text-stone-700 font-medium mb-4 pb-2 border-b border-stone-100">
              Manage Order
            </h2>

            {/* Payment Status */}
            <div className="mb-5">
              <label className="text-[10px] tracking-widest uppercase text-stone-400 block mb-2">
                Payment Status
              </label>
              <select
                value={order.status}
                onChange={(e) => handlePaymentStatusChange(e.target.value)}
                disabled={savingPayment}
                className="w-full border border-stone-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-stone-500 disabled:opacity-50 rounded"
              >
                {PAYMENT_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              {savingPayment && (
                <p className="text-xs text-stone-400 mt-1">Saving...</p>
              )}
            </div>

            {/* Delivery Status (admin handoff flow) */}
            <div className="mb-5">
              <label className="text-[10px] tracking-widest uppercase text-stone-400 block mb-2">
                Delivery Handoff
              </label>
              <select
                value={order.delivery_status ?? "pending"}
                onChange={(e) => handleDeliveryStatusChange(e.target.value)}
                disabled={savingDelivery}
                className="w-full border border-stone-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-stone-500 disabled:opacity-50 rounded"
              >
                {DELIVERY_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              {deliveryStatusOpt && (
                <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">
                  {deliveryStatusOpt.desc}
                </p>
              )}
              {savingDelivery && (
                <p className="text-xs text-stone-400 mt-1">Saving...</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="border-t border-stone-100 pt-4">
              <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-2">
                Quick Actions
              </p>
              <div className="space-y-1.5">
                <button
                  onClick={printLabel}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-stone-700 bg-stone-50 hover:bg-stone-100 rounded transition-colors"
                >
                  <span>🖨️</span> Print Label
                </button>
                <button
                  onClick={sendWhatsApp}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-stone-700 bg-stone-50 hover:bg-stone-100 rounded transition-colors"
                >
                  <span>💬</span> WhatsApp
                </button>
                <button
                  onClick={callCustomer}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-stone-700 bg-stone-50 hover:bg-stone-100 rounded transition-colors"
                >
                  <span>📞</span> Call Customer
                </button>
                <button
                  onClick={emailCustomer}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-stone-700 bg-stone-50 hover:bg-stone-100 rounded transition-colors"
                >
                  <span>📧</span> Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
