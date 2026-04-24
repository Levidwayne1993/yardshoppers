import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  images: {
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

              // Scripts — GTM, GA4, Meta Pixel
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://snap.licdn.com`,

              // Styles (unchanged)
              "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",

              // Fonts (unchanged)
              "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com",

              // Images — add tracking pixel domains
              "img-src 'self' data: blob: https://*.supabase.co https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://*.craigslist.org https://*.estatesales.net https://*.gsalr.com https://www.googletagmanager.com https://www.google-analytics.com https://www.facebook.com https://analytics.google.com",

              // Connections — add analytics endpoints
              "connect-src 'self' https://*.supabase.co https://nominatim.openstreetmap.org https://api.stripe.com https://ipapi.co https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://stats.g.doubleclick.net https://www.facebook.com https://connect.facebook.net",

              // Frames — add GTM preview
              "frame-src https://js.stripe.com https://hooks.stripe.com https://www.googletagmanager.com",

              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
