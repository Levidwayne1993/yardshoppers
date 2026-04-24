// ============================================================
// FILE: app/robots.ts
// PLACE AT: app/robots.ts  (REPLACE your existing file)
// WHAT CHANGED:
//   1. ADDED /messages to disallow — private user messages
//   2. ADDED /admin/ to disallow — admin panel
//   3. ADDED /boost-success to disallow — post-payment page
//   4. ADDED /auth/ to disallow — auth callback routes
//   5. Everything else identical
// ============================================================

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/saved",
          "/login",
          "/signup",
          "/post",
          "/api/",
          "/auth/",
          "/messages",
          "/admin/",
          "/boost-success",
        ],
      },
    ],
    sitemap: "https://www.yardshoppers.com/sitemap.xml",
  };
}
