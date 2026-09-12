import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Strict CSP is tricky with Next.js inline scripts; these are pragmatic,
// safe defaults (loosened only where Next.js requires it).
const csp = [
  "default-src 'self'",
  // Next.js needs inline styles and (in dev) eval for HMR:
  "script-src 'self' 'unsafe-inline'" + (isProd ? "" : " 'unsafe-eval'"),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://images.unsplash.com https://*.sslcommerz.com",
  "connect-src 'self'" + (isProd ? " https://*.sslcommerz.com" : ""),
  "frame-src https://*.sslcommerz.com", // payment gateway iframe
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.sslcommerz.com",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
