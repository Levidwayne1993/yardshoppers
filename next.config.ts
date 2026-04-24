// ============================================================
// FILE: next.config.ts
// PLACE AT: next.config.ts  (REPLACE your existing file)
// PRIORITY: 🟡 MEDIUM — SECURITY + PERFORMANCE
//
// WHAT'S WRONG WITH CURRENT VERSION:
//   1. Missing poweredByHeader: false — leaks "X-Powered-By:
//      Next.js" header on every response, telling attackers
//      your exact framework
//   2. Missing reactStrictMode: true — catches bugs in dev
//   3. The comment block from the previous fix file is still
//      at the top — unnecessary in production code
//
// THE FIX:
//   1. Added poweredByHeader: false
//   2. Added reactStrictMode: true
//   3. Clean header comments
//   4. Everything else IDENTICAL
// ============================================================

import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.craigslist.org" },
      { protocol: "https", hostname: "**.estatesales.net" },
      { protocol: "https", hostname: "**.gsalr.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://snap.licdn.com`,
              "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
              "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://*.craigslist.org https://*.estatesales.net https://*.gsalr.com https://www.googletagmanager.com https://www.google-analytics.com https://www.facebook.com https://analytics.google.com",
              "connect-src 'self' https://*.supabase.co https://nominatim.openstreetmap.org https://api.stripe.com https://ipapi.co https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://connect.facebook.net https://snap.licdn.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com https://www.google.com",
              "worker-src 'self' blob:",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
