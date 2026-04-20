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
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousCutoff = new Date(cutoff.getTime() - days * 24 * 60 * 60 * 1000);

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

    // ── 8. Listing Velocity ────────────────────────────
    const { data: periodListings } = await supabase
      .from("listings")
      .select("id, created_at, city, state, user_id")
      .gte("created_at", cutoff.toISOString())
      .order("created_at", { ascending: true });

    const { data: prevPeriodListings } = await supabase
      .from("listings")
      .select("id, created_at")
      .gte("created_at", previousCutoff.toISOString())
      .lt("created_at", cutoff.toISOString());

    const listingsLastHour = (periodListings || []).filter(
      (l) => new Date(l.created_at) >= oneHourAgo
    ).length;

    const listingsLast24h = (periodListings || []).filter(
      (l) => new Date(l.created_at) >= twentyFourHoursAgo
    ).length;

    const listingsLast7d = (periodListings || []).filter(
      (l) => new Date(l.created_at) >= sevenDaysAgo
    ).length;

    const listingsLast30d = (periodListings || []).length;

    // Daily listings for chart
    const dailyListingsMap: Record<string, number> = {};
    (periodListings || []).forEach((l) => {
      const day = l.created_at.slice(0, 10);
      dailyListingsMap[day] = (dailyListingsMap[day] || 0) + 1;
    });
    const dailyListings = Object.entries(dailyListingsMap)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const currentListingCount = (periodListings || []).length;
    const prevListingCount = (prevPeriodListings || []).length;
    const velocityChange = prevListingCount > 0
      ? Math.round(((currentListingCount - prevListingCount) / prevListingCount) * 100)
      : currentListingCount > 0 ? 100 : 0;

    const avgPerDay = days > 0 ? Math.round((currentListingCount / days) * 10) / 10 : 0;

    // ── 9. User Growth ─────────────────────────────────
    let totalUsers = 0;
    let newSignups: any[] = [];
    let prevSignups: any[] = [];
    let dailySignups: { day: string; count: number }[] = [];
    let activeSellers = 0;
    let activeBuyers = 0;
    let returningUsers = 0;
    let signupGrowthPct = 0;

    try {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      totalUsers = count || 0;

      const { data: newSignupsData } = await supabase
        .from("profiles")
        .select("id, created_at")
        .gte("created_at", cutoff.toISOString())
        .order("created_at", { ascending: true });
      newSignups = newSignupsData || [];

      const { data: prevSignupsData } = await supabase
        .from("profiles")
        .select("id")
        .gte("created_at", previousCutoff.toISOString())
        .lt("created_at", cutoff.toISOString());
      prevSignups = prevSignupsData || [];

      // Daily signups chart
      const dailySignupsMap: Record<string, number> = {};
      newSignups.forEach((s: any) => {
        const day = s.created_at.slice(0, 10);
        dailySignupsMap[day] = (dailySignupsMap[day] || 0) + 1;
      });
      dailySignups = Object.entries(dailySignupsMap)
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => a.day.localeCompare(b.day));

      // Active sellers — distinct users who posted listings in period
      activeSellers = new Set((periodListings || []).map((l) => l.user_id)).size;

      // Active buyers — distinct users who saved listings in period
      try {
        const { data: savedInPeriod } = await supabase
          .from("saved_listings")
          .select("user_id")
          .gte("created_at", cutoff.toISOString());
        activeBuyers = new Set((savedInPeriod || []).map((s) => s.user_id)).size;
      } catch {
        activeBuyers = 0;
      }

      // Returning users — users with page views in period who signed up before period
      const { data: returningViews } = await supabase
        .from("page_views")
        .select("user_id")
        .not("user_id", "is", null)
        .gte("created_at", cutoff.toISOString());
      const viewingUserIds = new Set(
        (returningViews || []).filter((v) => v.user_id).map((v) => v.user_id)
      );
      const newSignupIds = new Set(newSignups.map((s: any) => s.id));
      returningUsers = [...viewingUserIds].filter((id) => !newSignupIds.has(id)).length;

      signupGrowthPct = prevSignups.length > 0
        ? Math.round(((newSignups.length - prevSignups.length) / prevSignups.length) * 100)
        : newSignups.length > 0 ? 100 : 0;
    } catch (err) {
      console.error("User growth query error (non-fatal):", err);
    }

    // ── 10. City Heatmap ───────────────────────────────
    // All-time listings for total counts and dead zone detection
    const { data: allListingsCity } = await supabase
      .from("listings")
      .select("id, city, state, created_at");

    // Current period by city (reuse periodListings)
    const cityCurrentMap: Record<string, number> = {};
    (periodListings || []).forEach((l) => {
      if (l.city && l.state) {
        const key = `${l.city}|${l.state}`;
        cityCurrentMap[key] = (cityCurrentMap[key] || 0) + 1;
      }
    });

    // Previous period by city
    const { data: prevListingsCity } = await supabase
      .from("listings")
      .select("id, city, state")
      .gte("created_at", previousCutoff.toISOString())
      .lt("created_at", cutoff.toISOString());

    const cityPrevMap: Record<string, number> = {};
    (prevListingsCity || []).forEach((l) => {
      if (l.city && l.state) {
        const key = `${l.city}|${l.state}`;
        cityPrevMap[key] = (cityPrevMap[key] || 0) + 1;
      }
    });

    // All-time by city
    const cityTotalMap: Record<string, number> = {};
    (allListingsCity || []).forEach((l) => {
      if (l.city && l.state) {
        const key = `${l.city}|${l.state}`;
        cityTotalMap[key] = (cityTotalMap[key] || 0) + 1;
      }
    });

    // Build unified city data
    const allCityKeys = new Set([
      ...Object.keys(cityCurrentMap),
      ...Object.keys(cityPrevMap),
      ...Object.keys(cityTotalMap),
    ]);

    const citiesData = [...allCityKeys].map((key) => {
      const [city, state] = key.split("|");
      const current = cityCurrentMap[key] || 0;
      const previous = cityPrevMap[key] || 0;
      const total = cityTotalMap[key] || 0;
      const growthPct = previous > 0
        ? Math.round(((current - previous) / previous) * 100)
        : current > 0 ? 100 : 0;
      return { city, state, currentCount: current, previousCount: previous, totalListings: total, growthPct };
    });

    // Sort by growth for hottest
    const hottestCities = citiesData
      .filter((c) => c.currentCount > 0)
      .sort((a, b) => b.growthPct - a.growthPct || b.currentCount - a.currentCount)
      .slice(0, 10);

    // Dead zones — cities with historical listings but none in current period
    const deadZones = citiesData
      .filter((c) => c.totalListings > 0 && c.currentCount === 0)
      .sort((a, b) => b.totalListings - a.totalListings)
      .slice(0, 10);

    // Steady cities — have listings in both periods
    const steadyCities = citiesData
      .filter((c) => c.currentCount > 0 && c.previousCount > 0)
      .sort((a, b) => b.currentCount - a.currentCount)
      .slice(0, 10);

    const totalCitiesWithListings = new Set(
      (allListingsCity || []).filter((l) => l.city && l.state).map((l) => `${l.city}|${l.state}`)
    ).size;

    const activeCitiesCount = Object.keys(cityCurrentMap).length;

    // ── Build Response ─────────────────────────────────
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
      listingVelocity: {
        listingsLastHour,
        listingsLast24h,
        listingsLast7d,
        listingsLast30d,
        dailyListings,
        velocityChange,
        avgPerDay,
        currentPeriodCount: currentListingCount,
        prevPeriodCount: prevListingCount,
      },
      userGrowth: {
        totalUsers,
        newSignups: newSignups.length,
        prevSignups: prevSignups.length,
        signupGrowthPct,
        dailySignups,
        activeSellers,
        activeBuyers,
        returningUsers,
      },
      cityHeatmap: {
        hottestCities,
        deadZones,
        steadyCities,
        totalCitiesWithListings,
        activeCitiesCount,
      },
      period: { days, from: cutoff.toISOString(), to: now.toISOString() },
    });
  } catch (err: any) {
    console.error("Analytics API error:", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
