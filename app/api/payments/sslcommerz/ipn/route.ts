import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { validateSslPayment } from "@/lib/sslcommerz";
import Order from "@/models/Order";

export async function POST(request: Request) {
  const form = await request.formData(); const tranId = String(form.get("tran_id") || ""); const valId = String(form.get("val_id") || "");
  if (!tranId || !valId) return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
  try { await connectDB(); const order = await Order.findOne({ tranId }); if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 }); const validation = await validateSslPayment(valId); const valid = (validation.status === "VALID" || validation.status === "VALIDATED") && validation.tran_id === order.tranId && Number(validation.amount).toFixed(2) === Number(order.totalAmount).toFixed(2) && validation.currency === order.currency; if (valid && order.paymentStatus !== "paid") await Order.findByIdAndUpdate(order.id, { paymentStatus: "paid", status: "processing", valId, paidAt: new Date() }); return NextResponse.json({ received: true }); } catch { return NextResponse.json({ error: "Unable to process notification" }, { status: 500 }); }
}

export async function GET(request: Request) {
  return POST(new Request(request.url, { method: "POST", body: new URLSearchParams(new URL(request.url).searchParams), headers: { "Content-Type": "application/x-www-form-urlencoded" } }));
}