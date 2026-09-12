import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/guards";
import { expireStaleOrders } from "@/lib/orders";
import Order from "@/models/Order";

const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
export async function GET() { const guard = await requireAdmin(); if ("response" in guard) return guard.response; try { await expireStaleOrders(); await connectDB(); return NextResponse.json({ orders: await Order.find({}).sort({ createdAt: -1 }).lean() }); } catch { return apiError("Unable to load orders", 500); } }
export async function PATCH(request: Request) { const guard = await requireAdmin(); if ("response" in guard) return guard.response; const parsed = z.object({ id: z.string().length(24), status: z.enum(statuses) }).safeParse(await request.json()); if (!parsed.success) return apiError("Invalid order update"); try { await connectDB(); const order = await Order.findByIdAndUpdate(parsed.data.id, { status: parsed.data.status }, { new: true }); if (!order) return apiError("Order not found", 404); return NextResponse.json({ order }); } catch { return apiError("Unable to update order", 500); } }