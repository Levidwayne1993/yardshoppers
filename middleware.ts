import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 60;
const WINDOW_MS = 60_000;

export function middleware(request: NextRequest) {
  // Only rate-limit API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now - entry.lastReset > WINDOW_MS) {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
    } else {
      entry.count++;
      if (entry.count > RATE_LIMIT) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
