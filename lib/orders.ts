import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

/**
 * Orders created at checkout stay `pending` until the gateway callback fires.
 * If the customer closes the tab (or the callback never arrives) the order
 * lingers forever — this expires anything still pending after `ageMs`
 * (default 60 min) so abandoned carts can't accumulate in the admin view.
 *
 * Note: stock is NOT reserved at checkout (only checked), so expiring these
 * orders never releases held inventory — it's purely hygiene.
 */
export async function expireStaleOrders(ageMs = 60 * 60 * 1000): Promise<number> {
  try {
    await connectDB();
    const cutoff = new Date(Date.now() - ageMs);
    const result = await Order.updateMany(
      { paymentStatus: "pending", createdAt: { $lt: cutoff } },
      { paymentStatus: "cancelled", status: "cancelled" },
    );
    return result.modifiedCount;
  } catch (error) {
    console.error("expireStaleOrders failed", error);
    return 0;
  }
}