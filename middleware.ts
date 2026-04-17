import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = new Set([
  "https://www.yardshoppers.com",
  "https://yardshoppers.com",
]);

if (process.env.NODE_ENV === "development") {
  ALLOWED_ORIGINS.add("http://localhost:3000");
  ALLOWED_ORIGINS.add("http://localhost:3001");
}

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  // Handle CORS preflight
  if (isApi && request.method === "OPTIONS") {
    const preflight = new NextResponse(null, { status: 204 });
    if (ALLOWED_ORIGINS.has(origin)) {
      preflight.headers.set("Access-Control-Allow-Origin", origin);
      preflight.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      preflight.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      preflight.headers.set("Access-Control-Max-Age", "86400");
    }
    return preflight;
  }

  const response = NextResponse.next();

  // Set CORS only for allowed origins
  if (isApi && ALLOWED_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  // Refresh Supabase auth session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
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
