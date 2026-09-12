// Next.js 15 manual Sentry wiring.
// The three config files (client/server/edge) each self-guard on their DSN
// env var, so the app behaves identically until SENTRY_DSN /
// NEXT_PUBLIC_SENTRY_DSN are configured.
import "./sentry.client.config";
import "./sentry.server.config";
import "./sentry.edge.config";

export async function register() {}

export async function onRequestError(requestError: unknown) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  try {
    // captureRequestError's signature varies across SDK versions; cast keeps the
    // Next 15 instrumentation contract working regardless.
    (Sentry.captureRequestError as unknown as (err: unknown) => void)(requestError);
  } catch {
    // Monitoring must never break the request pipeline.
  }
}