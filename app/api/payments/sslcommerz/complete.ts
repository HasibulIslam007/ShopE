import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { validateSslPayment } from "@/lib/sslcommerz";
import Order from "@/models/Order";

export async function completePayment(request: Request, outcome: "success" | "fail" | "cancel") {
  const form = request.method === "GET" ? null : await request.formData();
  const params = new URL(request.url).searchParams;
  const value = (key: string) => String(form?.get(key) || params.get(key) || "");
  const tranId = value("tran_id");
  if (!tranId) return NextResponse.redirect(new URL(`/order-confirmation?status=${outcome}`, request.url));
  await connectDB();
  const order = await Order.findOne({ tranId });
  if (!order) return NextResponse.redirect(new URL("/order-confirmation?status=missing", request.url));
  if (outcome !== "success") { await Order.findByIdAndUpdate(order.id, { paymentStatus: outcome === "cancel" ? "cancelled" : "failed", status: "cancelled" }); return NextResponse.redirect(new URL(`/order-confirmation?status=${outcome}`, request.url)); }
  const valId = value("val_id");
  if (!valId) return NextResponse.redirect(new URL("/order-confirmation?status=failed", request.url));
  const validation = await validateSslPayment(valId);
  const valid = validation.status === "VALID" || validation.status === "VALIDATED";
  if (!valid || validation.tran_id !== order.tranId || Number(validation.amount).toFixed(2) !== Number(order.totalAmount).toFixed(2) || validation.currency !== order.currency) { await Order.findByIdAndUpdate(order.id, { paymentStatus: "failed", status: "cancelled" }); return NextResponse.redirect(new URL("/order-confirmation?status=failed", request.url)); }
  if (order.paymentStatus !== "paid") await Order.findByIdAndUpdate(order.id, { paymentStatus: "paid", status: "processing", valId, paidAt: new Date() });
  return NextResponse.redirect(new URL(`/order-confirmation?status=success&orderId=${order.id}`, request.url));
}