import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/components/AuthProvider";
export const metadata: Metadata = { title: "ShopE — Everyday, elevated.", description: "Thoughtful goods for your everyday." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><AuthProvider><CartProvider><Header />{children}</CartProvider></AuthProvider></body></html>; }
