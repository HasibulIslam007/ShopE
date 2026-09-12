"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type Profile = { name: string; email: string; role: string; createdAt: string };
type Order = {
  _id: string;
  items: { productId: string; name: string; quantity: number; priceAtPurchase: number }[];
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800",
  processing: "bg-blue-50 text-blue-800",
  shipped: "bg-indigo-50 text-indigo-800",
  delivered: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-red-50 text-red-700",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
    ]).then(([p, o]) => {
      if (p.user) { setProfile(p.user); setName(p.user.name); }
      if (o.orders) setOrders(o.orders);
    }).catch(() => setError("Failed to load your account"))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMessage(""); setError(""); setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (name !== profile?.name) body.name = name;
      if (newPassword) { body.newPassword = newPassword; body.currentPassword = currentPassword; }
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setProfile({ ...profile!, name: data.user.name });
      setMessage("Profile updated ✓");
      setCurrentPassword(""); setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-5xl px-6 py-16 md:px-10">Loading…</div>;
  if (!profile) return <div className="mx-auto max-w-5xl px-6 py-16 md:px-10 text-ink/60">Could not load your profile. <Link href="/login" className="underline">Sign in</Link></div>;

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:px-10">
      <p className="text-xs font-bold uppercase tracking-[.25em] text-coral">My account</p>
      <h1 className="mt-3 text-6xl font-black tracking-[-.07em]">Profile<span className="text-coral">.</span></h1>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-[2rem] bg-white p-7">
          <h2 className="text-xl font-bold">Account</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink/50">Name</dt><dd className="font-bold">{profile.name}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50">Email</dt><dd className="font-bold">{profile.email}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50">Role</dt><dd className="font-bold capitalize">{profile.role}</dd></div>
          </dl>
          <div className="mt-6 flex gap-3">
            <Link href="/cart" className="flex-1 rounded-full border border-ink/20 px-5 py-3 text-center text-sm font-bold hover:bg-ink/5">View cart →</Link>
            <Link href="/products" className="flex-1 rounded-full border border-ink/20 px-5 py-3 text-center text-sm font-bold hover:bg-ink/5">Keep shopping</Link>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-3 w-full rounded-full bg-red-50 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-100"
          >
            Log out
          </button>
        </section>

        <section className="rounded-[2rem] bg-white p-7">
          <h2 className="text-xl font-bold">Edit profile</h2>
          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div>
              <label className="mb-1 block text-sm font-medium">Full name</label>
              <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 outline-coral" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email (read-only)</label>
              <input disabled value={profile.email} className="w-full cursor-not-allowed rounded-xl border border-ink/15 bg-ink/5 px-4 py-3 text-ink/50" />
            </div>
            <fieldset className="rounded-xl border border-ink/10 p-4">
              <legend className="px-1 text-xs font-bold uppercase tracking-wider text-ink/50">Change password (optional)</legend>
              <div className="space-y-3">
                <input type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-xl border border-ink/15 px-4 py-3 outline-coral" />
                <input type="password" placeholder="New password (8+ chars)" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-xl border border-ink/15 px-4 py-3 outline-coral" />
              </div>
            </fieldset>
            <button type="submit" disabled={saving} className="w-full rounded-full bg-ink px-6 py-3 font-bold text-white disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-5 text-2xl font-bold">Order history<span className="text-coral">.</span></h2>
        {orders.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-12 text-center text-ink/50">
            No orders yet — <Link href="/products" className="font-bold underline">start shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o._id} className="rounded-[2rem] bg-white p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">Order #{o._id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-ink/50">{new Date(o.createdAt).toLocaleDateString()} · {o.items.length} item{o.items.length > 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusColors[o.status] || "bg-ink/5"}`}>{o.status}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${o.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{o.paymentStatus}</span>
                  </div>
                </div>
                <ul className="mt-4 space-y-1 border-t border-ink/10 pt-4 text-sm text-ink/70">
                  {o.items.map((it, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{it.quantity} × {it.name}</span>
                      <span>৳{(it.priceAtPurchase * it.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-right font-black">Total: ৳{o.totalAmount.toFixed(2)} {o.currency}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

