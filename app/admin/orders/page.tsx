"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

type Order = {
  _id: string;
  userId: { _id: string; name: string; email: string } | null;
  items: { productId: string; name: string; quantity: number; priceAtPurchase: number }[];
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  shippingAddress: { name: string; email: string; address: string; city: string; postcode: string };
  createdAt: string;
  paidAt?: string;
};

const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
const paymentStatuses = ["pending", "paid", "failed", "cancelled"] as const;

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchData() {
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleStatusChange(orderId: string, newStatus: typeof statuses[number]) {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      fetchData();
    } catch {
      setError("Failed to update order");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "shipped": return "bg-indigo-100 text-indigo-800";
      case "delivered": return "bg-emerald-100 text-emerald-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function getPaymentStatusColor(status: string) {
    switch (status) {
      case "paid": return "bg-emerald-100 text-emerald-800";
      case "failed": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-amber-100 text-amber-800";
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-6 py-16 md:px-10">Loading...</div>;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:px-10">
      <p className="text-xs font-bold uppercase tracking-[.25em] text-coral">Admin / Fulfillment</p>
      <h1 className="mt-3 text-6xl font-black tracking-[-.07em]">Orders<span className="text-coral">.</span></h1>

      {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="mt-12 rounded-[2rem] bg-white">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-ink/50">No orders yet</div>
        ) : (
          <div className="divide-y divide-ink/10">
            {orders.map((order) => (
              <div key={order._id} className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="font-bold text-lg">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-ink/50">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <div>
                    <p className="text-sm font-medium text-ink/50 mb-1">Customer</p>
                    <p>{order.userId?.name || "Guest"}</p>
                    <p className="text-sm text-ink/50">{order.userId?.email || order.shippingAddress.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink/50 mb-1">Shipping</p>
                    <p>{order.shippingAddress.name}</p>
                    <p className="text-sm text-ink/50">{order.shippingAddress.address}, {order.shippingAddress.city} {order.shippingAddress.postcode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-ink/50 mb-1">Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(order.totalAmount, order.currency)}</p>
                  </div>
                </div>

                <div className="border-t border-ink/10 pt-4">
                  <p className="text-sm font-medium text-ink/50 mb-2">Items</p>
                  <div className="space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{item.name} × {item.quantity}</span>
                        <span>{formatCurrency(item.priceAtPurchase * item.quantity, order.currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <p className="text-sm text-ink/50">Update status:</p>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value as typeof statuses[number])}
                    className="rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm outline-coral"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}