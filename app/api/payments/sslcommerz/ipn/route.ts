import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { validateSslPayment } from "@/lib/sslcommerz";
import Order from "@/models/Order";
import { markOrderPaid } from "@/app/api/payments/sslcommerz/complete";

export async function POST(request: Request) {
  const form = await request.formData();
  const params = Object.fromEntries(form.entries()) as Record<string, string>;
  const { tran_id: tranId, val_id: valId } = params;
  if (!tranId || !valId) return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
  try {
    await connectDB();
    const order = await Order.findOne({ tranId });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Primary verification: server-to-server validation with the gateway.
    const validation = await validateSslPayment(valId);
    const valid = (validation.status === "VALID" || validation.status === "VALIDATED")
      && validation.tran_id === order.tranId
      && Number(validation.amount).toFixed(2) === Number(order.totalAmount).toFixed(2)
      && validation.currency === order.currency;
    if (!valid) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

    // Idempotent: IPN retries are a fact of life — markOrderPaid only acts on a
    // still-pending order and never decrements stock twice for the same order.
    const result = await markOrderPaid(order.id, valId, params);
    return NextResponse.json({ received: true, action: result.ok ? "paid" : result.reason });
  } catch {
    return NextResponse.json({ error: "Unable to process notification" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(new Request(request.url, { method: "POST", body: new URLSearchParams(new URL(request.url).searchParams), headers: { "Content-Type": "application/x-www-form-urlencoded" } }));
}