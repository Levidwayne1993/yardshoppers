import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30", 10);

  try {
    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // ── 1. Live Traffic (last 30 min) ──────────────────
    const { data: recentViews } = await supabase
      .from("page_views")
      .select("session_id, page")
      .gte("created_at", thirtyMinAgo.toISOString());

    const liveSessions = new Set((recentViews || []).map((v) => v.session_id));
    const liveUsers = liveSessions.size;
    const pageviews30m = (recentViews || []).length;

    const sessionCounts: Record<string, number> = {};
    (recentViews || []).forEach((v) => {
      sessionCounts[v.session_id] = (sessionCounts[v.session_id] || 0) + 1;
    });
    const totalSessions30m = Object.keys(sessionCounts).length;
    const singlePageSessions = Object.values(sessionCounts).filter((c) => c === 1).length;
    const bounceRate = totalSessions30m > 0
      ? Math.round((singlePageSessions / totalSessions30m) * 100)
      : 0;

    // ── 2. All views for period ────────────────────────
    const { data: allViews } = await supabase
      .from("page_views")
      .select("created_at, session_id, city, region, category, page")
      .gte("created_at", cutoff.toISOString())
      .order("created_at", { ascending: true });

    // Group by day
    const dailyMap: Record<string, { views: number; sessions: Set<string> }> = {};
    (allViews || []).forEach((v) => {
      const day = v.created_at.slice(0, 10);
      if (!dailyMap[day]) dailyMap[day] = { views: 0, sessions: new Set() };
      dailyMap[day].views++;
      dailyMap[day].sessions.add(v.session_id);
    });
    const dailyPageviews = Object.entries(dailyMap)
      .map(([day, d]) => ({ day, views: d.views, uniqueSessions: d.sessions.size }))
      .sort((a, b) => a.day.localeCompare(b.day));

    // ── 3. Top Cities ──────────────────────────────────
    const cityMap: Record<string, number> = {};
    (allViews || []).forEach((v) => {
      if (v.city) cityMap[v.city] = (cityMap[v.city] || 0) + 1;
    });
    const topCities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    // ── 4. Top Categories ──────────────────────────────
    const catMap: Record<string, number> = {};
    (allViews || []).forEach((v) => {
      if (v.category) catMap[v.category] = (catMap[v.category] || 0) + 1;
    });
    const topCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, count]) => ({ category, count }));

    // ── 5. Top Pages ───────────────────────────────────
    const pageMap: Record<string, number> = {};
    (allViews || []).forEach((v) => {
      if (v.page) pageMap[v.page] = (pageMap[v.page] || 0) + 1;
    });
    const topPages = Object.entries(pageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));

    // ── 6. Totals ──────────────────────────────────────
    const totalViews = (allViews || []).length;
    const totalUnique = new Set((allViews || []).map((v) => v.session_id)).size;

    // ── 7. Boost Analytics ─────────────────────────────
    const { data: activeBoosted } = await supabase
      .from("listings")
      .select("id, title, boost_tier, boost_expires_at, boost_started_at, is_boosted, city, state")
      .eq("is_boosted", true)
      .gte("boost_expires_at", now.toISOString());

    const { data: allBoosted } = await supabase
      .from("listings")
      .select("id, boost_tier, boost_expires_at, boost_started_at, is_boosted")
      .not("boost_tier", "is", null);

    const { data: boostPayments } = await supabase
      .from("boost_payments")
      .select("*")
      .gte("created_at", cutoff.toISOString())
      .order("created_at", { ascending: false });

    // Revenue per tier
    const tierRevenue: Record<string, { count: number; revenue: number }> = {};
    (boostPayments || []).forEach((p) => {
      if (!tierRevenue[p.boost_tier]) tierRevenue[p.boost_tier] = { count: 0, revenue: 0 };
      tierRevenue[p.boost_tier].count++;
      tierRevenue[p.boost_tier].revenue += p.amount_cents;
    });

    // Expiring within 24h
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const expiringSoon = (activeBoosted || []).filter(
      (b) => b.boost_expires_at && new Date(b.boost_expires_at) <= tomorrow
    );

    // Average lifespan
    let avgLifespanHours = 0;
    const completedBoosts = (allBoosted || []).filter((b) => b.boost_started_at && b.boost_expires_at);
    if (completedBoosts.length > 0) {
      const totalHours = completedBoosts.reduce((sum, b) => {
        const start = new Date(b.boost_started_at).getTime();
        const end = new Date(b.boost_expires_at).getTime();
        return sum + (end - start) / (1000 * 60 * 60);
      }, 0);
      avgLifespanHours = Math.round(totalHours / completedBoosts.length);
    }

    const totalBoostRevenue = (boostPayments || []).reduce((sum, p) => sum + p.amount_cents, 0);

    return NextResponse.json({
      traffic: {
        liveUsers, pageviews30m, bounceRate, totalViews, totalUnique,
        dailyPageviews, topCities, topCategories, topPages,
      },
      boosts: {
        activeCount: (activeBoosted || []).length,
        activeBoosts: activeBoosted || [],
        totalBoostsAllTime: (allBoosted || []).length,
        totalRevenueCents: totalBoostRevenue,
        tierRevenue,
        expiringSoon,
        avgLifespanHours,
        recentPayments: (boostPayments || []).slice(0, 20),
      },
      period: { days, from: cutoff.toISOString(), to: now.toISOString() },
    });
  } catch (err: any) {
    console.error("Analytics API error:", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
