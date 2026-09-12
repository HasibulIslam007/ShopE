// Serverless-safe rate limiter backed by MongoDB (models/RateLimit.ts).
// Works across Vercel's stateless function instances because the counter
// lives in the database, not in function memory. The `expiresAt` TTL index
// makes MongoDB garbage-collect old windows automatically.
//
// Atomicity: a single aggregation-pipeline update increments the counter and
// (re)sets the window/lockout in one round trip, so concurrent invocations
// (IPN retries, parallel requests) stay consistent.
//
// Fail-open policy: if the database is unreachable we allow the request and
// log loudly — availability beats strictness for rate limiting; swap to
// fail-closed if you'd rather reject traffic during a DB outage.
//
// Prefer Upstash Redis instead? Swap this file for @upstash/ratelimit —
// requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars.
import { connectDB } from "@/lib/db";
import RateLimit from "@/models/RateLimit";

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

/**
 * Returns ok:false when the caller exceeded `max` attempts within `windowMs`,
 * locking the key for `lockMs` after exceeding it.
 */
export async function rateLimit(key: string, options: { max: number; windowMs: number; lockMs?: number }): Promise<RateLimitResult> {
  const { max, windowMs, lockMs = 0 } = options;
  try {
    await connectDB();
    const now = new Date();
    const doc = await RateLimit.findOneAndUpdate(
      { _id: key },
      [
        { $set: {
          // Increment within the current window, else start a fresh window at 1.
          count: {
            $cond: [{ $gt: ["$expiresAt", "$$NOW"] },
              { $add: [{ $ifNull: ["$count", 0] }, 1] },
              1],
          },
          // Keep the existing window while it's live, else open a new one.
          expiresAt: {
            $cond: [{ $gt: ["$expiresAt", "$$NOW"] },
              "$expiresAt",
              { $dateAdd: { startDate: "$$NOW", unit: "millisecond", amount: windowMs } }],
          },
          // Once the limit is exceeded inside a live window, lock the key.
          // While locked, the document must outlive the TTL, so expiresAt
          // tracks lockedUntil as well.
          lockedUntil: {
            $switch: {
              branches: [
                {
                  case: { $and: [{ $gt: ["$expiresAt", "$$NOW"] }, { $gt: [{ $add: [{ $ifNull: ["$count", 0] }, 1] }, max] }] },
                  then: { $dateAdd: { startDate: "$$NOW", unit: "millisecond", amount: Math.max(lockMs, windowMs) } },
                },
                { case: { $gt: [{ $ifNull: ["$lockedUntil", "$$NOW"] }, "$$NOW"] }, then: "$lockedUntil" },
              ],
              default: null,
            },
          },
        } },
        { $set: { expiresAt: { $cond: [{ $gt: [{ $ifNull: ["$lockedUntil", "$expiresAt"] }, "$expiresAt"] }, "$lockedUntil", "$expiresAt"] } } },
      ],
      { upsert: true, returnDocument: "after", returnNewDocument: true },
    ).lean();

    const lockedUntil = doc && "lockedUntil" in doc ? (doc as { lockedUntil?: Date | null }).lockedUntil : null;
    if (lockedUntil && lockedUntil > new Date()) {
      return { ok: false, retryAfterSeconds: Math.ceil((lockedUntil.getTime() - Date.now()) / 1000) };
    }
    return { ok: true, retryAfterSeconds: 0 };
  } catch (error) {
    // Fail open — log so outages are visible.
    console.error("rateLimit: store unavailable, allowing request", error);
    return { ok: true, retryAfterSeconds: 0 };
  }
}

/** Best-effort client IP from proxy headers (falls back to "unknown"). */
export function clientIpFromHeaders(headers: Headers | undefined): string {
  if (!headers) return "unknown";
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
