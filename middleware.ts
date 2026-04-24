import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ── CORS Origins ── */
const ALLOWED_ORIGINS = new Set([
  "https://www.yardshoppers.com",
  "https://yardshoppers.com",
]);

if (process.env.NODE_ENV === "development") {
  ALLOWED_ORIGINS.add("http://localhost:3000");
  ALLOWED_ORIGINS.add("http://localhost:3001");
}

/* ── Rate-limit config for /api/track ── */
const RATE_LIMIT_WINDOW_MS = 60_000; // 1-minute window
const RATE_LIMIT_MAX = 30; // max hits per window per IP
const rateLimitHits = new Map<
  string,
  { count: number; windowStart: number }
>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitHits.get(ip);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitHits.set(ip, { count: 1, windowStart: now });
    return false;
  }

  record.count += 1;
  return record.count > RATE_LIMIT_MAX;
}

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const isApi = request.nextUrl.pathname.startsWith("/api/");

   /* ── Rate-limit /api/track ── */
  if (request.nextUrl.pathname === "/api/track") {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }


  // Handle CORS preflight
  if (isApi && request.method === "OPTIONS") {
    const preflight = new NextResponse(null, { status: 204 });
    if (ALLOWED_ORIGINS.has(origin)) {
      preflight.headers.set("Access-Control-Allow-Origin", origin);
      preflight.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      preflight.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      preflight.headers.set("Access-Control-Max-Age", "86400");
    }
    return preflight;
  }

  const response = NextResponse.next();

  // Set CORS only for allowed origins
  if (isApi && ALLOWED_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }

  // Refresh Supabase auth session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
