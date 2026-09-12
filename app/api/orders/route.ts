import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import Order from "@/models/Order";

export async function GET() {
  const guard = await requireUser(); if ("response" in guard) return guard.response;
  try { await connectDB(); const orders = await Order.find({ userId: guard.session.user.id }).sort({ createdAt: -1 }).lean(); return NextResponse.json({ orders }); }
  catch { return NextResponse.json({ error: "Unable to load orders" }, { status: 500 }); }
}