"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, Eye, Users, TrendingDown, MapPin, Tag, FileText, RefreshCw,
} from "lucide-react";
import ListingVelocity from "./ListingVelocity";
import UserGrowth from "./UserGrowth";
import CityHeatmap from "./CityHeatmap";

interface TrafficData {
  liveUsers: number;
  pageviews30m: number;
  bounceRate: number;
  totalViews: number;
  totalUnique: number;
  dailyPageviews: { day: string; views: number; uniqueSessions: number }[];
  topCities: { city: string; count: number }[];
  topCategories: { category: string; count: number }[];
  topPages: { page: string; count: number }[];
}

interface VelocityData {
  listingsLastHour: number;
  listingsLast24h: number;
  listingsLast7d: number;
  listingsLast30d: number;
  dailyListings: { day: string; count: number }[];
  velocityChange: number;
  avgPerDay: number;
  currentPeriodCount: number;
  prevPeriodCount: number;
}

interface UserGrowthData {
  totalUsers: number;
  newSignups: number;
  prevSignups: number;
  signupGrowthPct: number;
  dailySignups: { day: string; count: number }[];
  activeSellers: number;
  activeBuyers: number;
  returningUsers: number;
}

interface CityHeatmapData {
  hottestCities: { city: string; state: string; currentCount: number; previousCount: number; totalListings: number; growthPct: number }[];
  deadZones: { city: string; state: string; currentCount: number; previousCount: number; totalListings: number; growthPct: number }[];
  steadyCities: { city: string; state: string; currentCount: number; previousCount: number; totalListings: number; growthPct: number }[];
  totalCitiesWithListings: number;
  activeCitiesCount: number;
}

interface Props {
  days?: number;
}

export default function TrafficDashboard({ days = 30 }: Props) {
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [velocityData, setVelocityData] = useState<VelocityData | null>(null);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData | null>(null);
  const [cityHeatmapData, setCityHeatmapData] = useState<CityHeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(days);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?days=${selectedDays}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      setTrafficData(json.traffic);
      setVelocityData(json.listingVelocity || null);
      setUserGrowthData(json.userGrowth || null);
      setCityHeatmapData(json.cityHeatmap || null);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDays]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !trafficData) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-green" />
        <span className="ml-2 text-gray-500">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">Error: {error}</p>
        <button onClick={fetchData} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          Retry
        </button>
      </div>
    );
  }

  if (!trafficData) return null;

  const maxViews = Math.max(...trafficData.dailyPageviews.map((d) => d.views), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-green" />
          Traffic Dashboard
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-green focus:border-transparent"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <span className="text-xs text-gray-400">Updated {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Live Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Live Users</span>
            <div className="relative">
              <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{trafficData.liveUsers}</p>
          <p className="text-xs text-gray-400 mt-1">last 30 minutes</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Pageviews</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{trafficData.pageviews30m}</p>
          <p className="text-xs text-gray-400 mt-1">last 30 minutes</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Bounce Rate</span>
            <TrendingDown className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{trafficData.bounceRate}%</p>
          <p className="text-xs text-gray-400 mt-1">single-page sessions</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Total Views</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{trafficData.totalViews.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{trafficData.totalUnique.toLocaleString()} unique sessions</p>
        </div>
      </div>

      {/* Daily Pageviews Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Pageviews</h3>
        {trafficData.dailyPageviews.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No data yet. Views will appear as traffic flows in.</p>
        ) : (
          <div className="flex items-end gap-1 h-40 overflow-x-auto">
            {trafficData.dailyPageviews.map((d) => {
              const height = Math.max((d.views / maxViews) * 100, 4);
              return (
                <div key={d.day} className="group relative flex-1 min-w-[12px]">
                  <div
                    className="bg-brand-green/80 hover:bg-brand-green rounded-t transition-all duration-200 cursor-pointer mx-auto"
                    style={{ height: `${height}%`, minWidth: "8px", maxWidth: "32px" }}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                    <div className="font-semibold">
                      {new Date(d.day + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                    <div>{d.views.toLocaleString()} views</div>
                    <div>{d.uniqueSessions.toLocaleString()} sessions</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {trafficData.dailyPageviews.length > 0 && (
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{new Date(trafficData.dailyPageviews[0].day + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span>{new Date(trafficData.dailyPageviews[trafficData.dailyPageviews.length - 1].day + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
        )}
      </div>

      {/* Top Cities / Categories / Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-green" /> Top Cities
          </h3>
          {trafficData.topCities.length === 0 ? (
            <p className="text-gray-400 text-sm">No city data yet</p>
          ) : (
            <ul className="space-y-2">
              {trafficData.topCities.map((c, i) => (
                <li key={c.city} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4 text-right">{i + 1}.</span>
                    <span className="text-gray-700">{c.city}</span>
                  </span>
                  <span className="text-gray-500 font-medium tabular-nums">{c.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand-orange" /> Top Categories
          </h3>
          {trafficData.topCategories.length === 0 ? (
            <p className="text-gray-400 text-sm">No category data yet</p>
          ) : (
            <ul className="space-y-2">
              {trafficData.topCategories.map((c, i) => (
                <li key={c.category} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4 text-right">{i + 1}.</span>
                    <span className="text-gray-700 capitalize">{c.category}</span>
                  </span>
                  <span className="text-gray-500 font-medium tabular-nums">{c.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-500" /> Top Pages
          </h3>
          {trafficData.topPages.length === 0 ? (
            <p className="text-gray-400 text-sm">No page data yet</p>
          ) : (
            <ul className="space-y-2">
              {trafficData.topPages.map((p, i) => (
                <li key={p.page} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4 text-right">{i + 1}.</span>
                    <span className="text-gray-700 truncate max-w-[140px]">{p.page}</span>
                  </span>
                  <span className="text-gray-500 font-medium tabular-nums">{p.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <hr className="border-gray-200" />

      {/* Listing Velocity */}
      {velocityData && <ListingVelocity data={velocityData} />}

      {/* ── DIVIDER ── */}
      <hr className="border-gray-200" />

      {/* User Growth */}
      {userGrowthData && <UserGrowth data={userGrowthData} />}

      {/* ── DIVIDER ── */}
      <hr className="border-gray-200" />

      {/* City Heatmap */}
      {cityHeatmapData && <CityHeatmap data={cityHeatmapData} />}
    </div>
  );
}
