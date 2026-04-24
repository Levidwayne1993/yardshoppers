// ============================================================
// FILE: middleware.ts
// PLACE AT: middleware.ts  (REPLACE your existing file)
// PRIORITY: 🟡 MEDIUM — SECURITY + PERFORMANCE
//
// WHAT'S WRONG WITH CURRENT VERSION:
//   1. In-memory rate limiting with Map() does NOT work on
//      Vercel serverless. Each invocation gets fresh memory,
//      so the rate limiter resets on every cold start. It's
//      effectively a no-op — provides zero protection.
//   2. supabase.auth.getUser() runs on EVERY request including
//      static pages, images, etc. — adds 50-200ms latency to
//      every navigation even when auth isn't needed.
//   3. CORS headers are applied even to same-origin requests
//
// THE FIX:
//   1. REMOVED broken in-memory rate limiter entirely
//      (For real rate limiting, use Vercel's Edge Config or
//       Upstash Redis — both work on serverless. Can add later.)
//   2. Auth refresh only runs on protected routes that need it
//   3. CORS only on /api/ routes
//   4. Everything else identical
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require auth session refresh
const PROTECTED_ROUTES = [
  "/dashboard",
  "/saved",
  "/messages",
  "/post",
  "/admin",
  "/boost-success",
];

// Routes that need CORS headers
const API_PREFIX = "/api/";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // ── CORS for API routes only ──
  if (pathname.startsWith(API_PREFIX)) {
    const origin = request.headers.get("origin") ?? "";
    const allowedOrigins = [
      "https://www.yardshoppers.com",
      "https://yardshoppers.com",
    ];

    if (process.env.NODE_ENV === "development") {
      allowedOrigins.push("http://localhost:3000");
    }

    if (allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      response.headers.set("Access-Control-Max-Age", "86400");
    }

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  // ── Auth session refresh — only on protected routes ──
  const needsAuth = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (needsAuth) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              );
              response = NextResponse.next({
                request: { headers: request.headers },
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      await supabase.auth.getUser();
    } catch {
      // Auth refresh failed — continue anyway, client will handle
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
