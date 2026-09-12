import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CSRF / cross-origin defense for API routes.
 * Browsers always send an `Origin` header on cross-origin POST/PATCH/PUT/DELETE —
 * if the Origin doesn't match our host, reject. Requests WITHOUT an Origin
 * (server-to-server calls like the SSLCommerz IPN, curl, mobile apps) are allowed
 * because they can't carry a victim's cookies anyway.
 */
export function middleware(request: NextRequest) {
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return NextResponse.next();

  const origin = request.headers.get("origin");
  if (!origin) return NextResponse.next(); // non-browser client — no cookie risk

  // Payment callbacks legitimately originate from the SSLCommerz gateway.
  const isPaymentCallback = request.nextUrl.pathname.startsWith("/api/payments/");
  if (isPaymentCallback && origin.endsWith("sslcommerz.com")) return NextResponse.next();

  const host = request.headers.get("host");
  try {
    if (host && new URL(origin).host !== host) {
      return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
