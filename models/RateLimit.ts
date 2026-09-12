import mongoose, { Schema } from "mongoose";

/**
 * Backing store for lib/rate-limit.ts — one document per (limiter, identity).
 * `expiresAt` carries a TTL index so MongoDB auto-deletes expired windows;
 * `lockedUntil` extends the document past the window while a lockout is active.
 */
const RateLimitSchema = new Schema({
  _id: { type: String, required: true }, // e.g. "login:1.2.3.4:user@example.com"
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  lockedUntil: { type: Date, default: null },
}, { timestamps: false });

RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RateLimit || mongoose.model("RateLimit", RateLimitSchema);
