import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ──────────────────────────────────────────────
   Supabase client — uses service role key to
   bypass RLS for INSERT-only analytics writes.

   OPTIONAL IMPROVEMENT: Create an RLS policy on
   page_views that allows INSERT for anon role,
   then switch to NEXT_PUBLIC_SUPABASE_ANON_KEY
   and remove the service role key from this route.
   ────────────────────────────────────────────── */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ──────────────────────────────────────────────
   Simple in-memory rate limiter
   - 30 requests per IP per 60-second window
   - Resets on cold start (acceptable trade-off
     vs. adding Redis for a free analytics endpoint)
   ────────────────────────────────────────────── */
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // max requests per window

const rateLimitMap = new Map<
  string,
  { count: number; resetAt: number }
>();

// Clean up stale entries every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();
function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return; // every 5 min
  lastCleanup = now;
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}

function isRateLimited(ip: string): boolean {
  cleanupStaleEntries();

  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

/* ──────────────────────────────────────────────
   Input sanitization — prevent oversized payloads
   from inflating DB storage costs
   ────────────────────────────────────────────── */
function sanitize(value: unknown, maxLen = 500): string | null {
  if (typeof value !== "string") return null;
  return value.slice(0, maxLen).trim() || null;
}

/* ──────────────────────────────────────────────
   POST /api/track
   ────────────────────────────────────────────── */
export async function POST(req: Request) {
  try {
    // ── Rate limiting ──
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    // ── Parse & validate body ──
    const body = await req.json();
    const { page, referrer, city, region, category, session_id, user_id } =
      body;

    if (!page || !session_id) {
      return NextResponse.json(
        { error: "page and session_id are required" },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get("user-agent") || "";

    // ── Insert with sanitized values ──
    const { error } = await supabase.from("page_views").insert({
      page: sanitize(page, 2000),
      referrer: sanitize(referrer, 2000),
      city: sanitize(city, 100),
      region: sanitize(region, 100),
      category: sanitize(category, 100),
      session_id: sanitize(session_id, 100),
      user_id: sanitize(user_id, 100),
      user_agent: userAgent.slice(0, 500),
    });

    if (error) {
      console.error("Failed to track page view:", error);
      return NextResponse.json(
        { error: "Tracking failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
