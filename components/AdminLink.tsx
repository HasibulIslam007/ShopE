"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useIsAdmin() {
  const { data: session } = useSession();
  return session?.user?.role === "admin";
}

export function AdminNavLink() {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;
  return <a href="/admin" className="font-bold text-coral">Admin</a>;
}

export function AdminProductCard() {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;
  return (
    <a
      href="/admin/products"
      className="flex items-center justify-between rounded-[2rem] border-2 border-dashed border-coral/60 bg-white px-7 py-5 transition hover:border-coral"
    >
      <span>
        <span className="block text-xs font-bold uppercase tracking-[.2em] text-coral">Admin tools</span>
        <span className="mt-1 block text-lg font-bold">Add a new product →</span>
      </span>
      <span aria-hidden className="text-2xl">＋</span>
    </a>
  );
}

export function useSessionUser() {
  const { data: session, status } = useSession();
  return { user: session?.user ?? null, status };
}

export function ProfileNavLink() {
  const { user, status } = useSessionUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || status === "loading") return null;
  if (!user) return <a href="/login" className="text-sm hover:text-coral">Sign in</a>;
  return <a href="/profile" className="font-medium hover:text-coral">{user.name?.split(" ")[0] || "Profile"}</a>;
}

