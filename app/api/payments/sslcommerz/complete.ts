import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { validateSslPayment, verifySslSignature } from "@/lib/sslcommerz";
import Order from "@/models/Order";
import Product from "@/models/Product";

/**
 * Atomically transition a pending order to paid. Idempotent: if the order was
 * already paid or is no longer pending, nothing happens and no stock changes.
 * Also enforces `verify_sign` when the gateway sends one.
 */
export async function markOrderPaid(orderId: string, valId: string, form: URLSearchParams | Record<string, string>) {
  if (!verifySslSignature(form)) return { ok: false as const, reason: "invalid-signature" };

  // Only the first caller wins the transition (IPN retries / success-page
  // double-hits are harmless — paymentStatus must currently be "pending").
  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: "pending", status: "pending" },
    { paymentStatus: "paid", status: "processing", valId, paidAt: new Date() },
    { new: true },
  );
  if (!order) return { ok: false as const, reason: "already-processed" };

  // We transitioned it — now decrement stock exactly once, atomically per item
  // (only decrements when the product actually has enough stock).
  const ops = order.items.map((item: { productId: unknown; quantity: number }) => ({
    updateOne: {
      filter: { _id: item.productId, stockQty: { $gte: item.quantity } },
      update: { $inc: { stockQty: -item.quantity } },
      upsert: false,
    },
  }));
  if (ops.length) {
    const result = await Product.bulkWrite(ops);
    if (result.modifiedCount < ops.length) {
      console.error(`stock shortfall order=${order.id}: only ${result.modifiedCount}/${ops.length} items decremented`);
    }
  }
  return { ok: true as const, orderId: order.id };
}

/** Atomically mark a pending order failed/cancelled; never clobbers a "paid" order. */
export async function markOrderDone(orderId: string, outcome: "failed" | "cancelled") {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: "pending" },
    { paymentStatus: outcome, status: "cancelled" },
    { new: true },
  );
  return Boolean(order);
}

async function findOrderByTranId(tranId: string) {
  await connectDB();
  return Order.findOne({ tranId });
}

export async function completePayment(request: Request, outcome: "success" | "fail" | "cancel") {
  const form = request.method === "GET" ? null : await request.formData();
  const params = new URL(request.url).searchParams;
  const value = (key: string) => String(form?.get(key) || params.get(key) || "");
  const verifyFields: URLSearchParams | Record<string, string> = form
    ? (Object.fromEntries(Array.from(form.entries()).map(([k, v]) => [k, String(v)])) as Record<string, string>)
    : params;
  const tranId = value("tran_id");
  if (!tranId) return NextResponse.redirect(new URL(`/order-confirmation?status=${outcome}`, request.url));
  await connectDB();
  const order = await findOrderByTranId(tranId);
  if (!order) return NextResponse.redirect(new URL("/order-confirmation?status=missing", request.url));
  if (outcome !== "success") return NextResponse.redirect(new URL(`/order-confirmation?status=${outcome}`, request.url));

  const valId = value("val_id");
  if (!valId) return NextResponse.redirect(new URL("/order-confirmation?status=failed", request.url));

  // Server-to-server validation with the gateway (cryptographic check).
  const validation = await validateSslPayment(valId);
  const valid = validation.status === "VALID" || validation.status === "VALIDATED";
  if (!valid || validation.tran_id !== order.tranId || Number(validation.amount).toFixed(2) !== Number(order.totalAmount).toFixed(2) || validation.currency !== order.currency) {
    await markOrderDone(order.id, "failed");
    return NextResponse.redirect(new URL("/order-confirmation?status=failed", request.url));
  }

  const transition = await markOrderPaid(order.id, valId, verifyFields);
  if (!transition.ok) {
    // Either a duplicate (fine — re-validate state) or signature mismatch.
    const current = (await Order.findById(order.id).lean()) as { paymentStatus?: string } | null;
    if (current?.paymentStatus !== "paid") await markOrderDone(order.id, "failed");
    return NextResponse.redirect(new URL("/order-confirmation?status=failed", request.url));
  }
  return NextResponse.redirect(new URL(`/order-confirmation?status=success&orderId=${transition.orderId}`, request.url));
}