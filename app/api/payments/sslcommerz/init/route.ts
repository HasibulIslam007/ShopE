import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { apiError, isValidObjectId } from "@/lib/api-response";
import { requireUser } from "@/lib/guards";
import { initializeSslPayment, sslConfigured } from "@/lib/sslcommerz";
import { expireStaleOrders } from "@/lib/orders";
import Product from "@/models/Product";
import Order from "@/models/Order";

type LeanProduct = {
  _id: { toString: () => string };
  slug: string;
  name: string;
  price: number;
  stockQty: number;
};

const schema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
  shipping: z.object({ name: z.string().trim().min(2).max(120), email: z.string().email(), address: z.string().trim().min(3).max(240), city: z.string().trim().min(2).max(80), postcode: z.string().trim().min(2).max(20) }),
});

export async function POST(request: Request) {
  const guard = await requireUser(); if ("response" in guard) return guard.response;
  if (!process.env.MONGODB_URI || !sslConfigured()) return apiError("Payment service is not configured", 503);
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return apiError(parsed.error.issues[0].message);
  try {
    // Housekeeping: mark abandoned pending orders (>60 min old) as cancelled.
    await expireStaleOrders();
    await connectDB();
    const objectIds = parsed.data.items.filter((item) => isValidObjectId(item.productId)).map((item) => item.productId);
    const slugs = parsed.data.items.filter((item) => !isValidObjectId(item.productId)).map((item) => item.productId);
    const products = (await Product.find({ $or: [{ _id: { $in: objectIds } }, { slug: { $in: slugs } }] }).lean()) as unknown as LeanProduct[];
    if (products.length !== parsed.data.items.length) return apiError("One or more products no longer exist", 409);
    const lines = parsed.data.items.map((item) => {
      const product = products.find((candidate) => candidate._id.toString() === item.productId || candidate.slug === item.productId)!;
      if (product.stockQty < item.quantity) throw new Error(`${product.name} is out of stock`);
      return { productId: product._id, name: product.name, quantity: item.quantity, priceAtPurchase: product.price };
    });
    const total = lines.reduce((sum, item) => sum + item.quantity * item.priceAtPurchase, 0);
    const tranId = `SHOPE-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const order = await Order.create({ userId: guard.session.user.id, items: lines, totalAmount: total, currency: "BDT", shippingAddress: parsed.data.shipping, tranId });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) return apiError("Application URL is not configured", 503);
    const payment = await initializeSslPayment({
      tran_id: tranId, total_amount: total.toFixed(2), currency: "BDT", product_category: "general", product_name: "ShopE order", product_profile: "physical-goods",
      cus_name: parsed.data.shipping.name, cus_email: parsed.data.shipping.email, cus_add1: parsed.data.shipping.address, cus_city: parsed.data.shipping.city, cus_postcode: parsed.data.shipping.postcode, cus_country: "Bangladesh", shipping_method: "YES", num_of_item: String(lines.reduce((sum, item) => sum + item.quantity, 0)),
      success_url: `${appUrl}/api/payments/sslcommerz/success`, fail_url: `${appUrl}/api/payments/sslcommerz/fail`, cancel_url: `${appUrl}/api/payments/sslcommerz/cancel`, ipn_url: `${appUrl}/api/payments/sslcommerz/ipn`, value_a: order.id,
    });
    if (payment.status !== "SUCCESS" || !payment.GatewayPageURL) { await Order.findByIdAndUpdate(order.id, { paymentStatus: "failed" }); return apiError(payment.failedreason || "Unable to start payment", 502); }
    return NextResponse.json({ gatewayUrl: payment.GatewayPageURL, orderId: order.id });
  } catch (error) { return apiError(error instanceof Error && error.message.includes("out of stock") ? error.message : "Unable to start checkout", 409); }
}