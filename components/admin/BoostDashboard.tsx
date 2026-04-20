"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Zap, DollarSign, Clock, AlertTriangle, TrendingUp, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";

interface ActiveBoost {
  id: string; title: string; boost_tier: string;
  boost_expires_at: string; boost_started_at: string;
  is_boosted: boolean; city: string; state: string;
}

interface BoostPayment {
  id: string; listing_id: string; boost_tier: string;
  amount_cents: number; duration_days: number; created_at: string;
}

interface BoostData {
  activeCount: number; activeBoosts: ActiveBoost[];
  totalBoostsAllTime: number; totalRevenueCents: number;
  tierRevenue: Record<string, { count: number; revenue: number }>;
  expiringSoon: ActiveBoost[]; avgLifespanHours: number;
  recentPayments: BoostPayment[];
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; price: string }> = {
  spark:     { label: "Spark",     color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", price: "$1.99" },
  spotlight: { label: "Spotlight", color: "text-blue-600",   bg: "bg-blue-50 border-blue-200",     price: "$4.99" },
  blaze:     { label: "Blaze",     color: "text-orange-600", bg: "bg-orange-50 border-orange-200", price: "$9.99" },
  mega:      { label: "Mega",      color: "text-purple-600", bg: "bg-purple-50 border-purple-200", price: "$14.99" },
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${mins}m`;
}

export default function BoostDashboard() {
  const [data, setData] = useState<BoostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllActive, setShowAllActive] = useState(false);
  const [showRecentPayments, setShowRecentPayments] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/admin/analytics?days=30");
      if (!res.ok) throw new Error("Failed to fetch boost analytics");
      const json = await res.json();
      setData(json.boosts);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-green" />
        <span className="ml-2 text-gray-500">Loading boost analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">Error: {error}</p>
        <button onClick={fetchData} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Retry</button>
      </div>
    );
  }

  if (!data) return null;
  const displayedActive = showAllActive ? data.activeBoosts : data.activeBoosts.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-orange" /> Boost Analytics
        </h2>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Active Boosts</span>
            <Zap className="w-4 h-4 text-brand-orange" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.activeCount}</p>
          <p className="text-xs text-gray-400 mt-1">{data.totalBoostsAllTime} all time</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Boost Revenue</span>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCents(data.totalRevenueCents)}</p>
          <p className="text-xs text-gray-400 mt-1">last 30 days</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Expiring Soon</span>
            <AlertTriangle className={`w-4 h-4 ${data.expiringSoon.length > 0 ? "text-red-500" : "text-gray-400"}`} />
          </div>
          <p className={`text-3xl font-bold ${data.expiringSoon.length > 0 ? "text-red-600" : "text-gray-900"}`}>
            {data.expiringSoon.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">within 24 hours</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Avg Lifespan</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {data.avgLifespanHours > 24 ? `${Math.round(data.avgLifespanHours / 24)}d` : `${data.avgLifespanHours}h`}
          </p>
          <p className="text-xs text-gray-400 mt-1">per boost</p>
        </div>
      </div>

      {/* Revenue by Tier */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-green" /> Revenue by Tier
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(["spark", "spotlight", "blaze", "mega"] as const).map((tier) => {
            const config = TIER_CONFIG[tier];
            const stats = data.tierRevenue[tier] || { count: 0, revenue: 0 };
            return (
              <div key={tier} className={`rounded-lg border p-4 ${config.bg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
                  <span className="text-xs text-gray-400">{config.price}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCents(stats.revenue)}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.count} purchase{stats.count !== 1 ? "s" : ""}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expiring Soon Alert */}
      {data.expiringSoon.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Boosts Expiring Within 24 Hours
          </h3>
          <div className="space-y-2">
            {data.expiringSoon.map((b) => {
              const config = TIER_CONFIG[b.boost_tier] || TIER_CONFIG.spark;
              return (
                <div key={b.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{b.title}</span>
                    <span className="text-xs text-gray-400 ml-2">{b.city}, {b.state}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>{config.label}</span>
                    <span className="text-xs font-medium text-red-600">{timeUntil(b.boost_expires_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Boosts Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Active Boosts ({data.activeCount})</h3>
          {data.activeBoosts.length > 5 && (
            <button onClick={() => setShowAllActive(!showAllActive)} className="flex items-center gap-1 text-xs text-brand-green hover:underline">
              {showAllActive ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>Show all <ChevronDown className="w-3 h-3" /></>}
            </button>
          )}
        </div>
        {data.activeBoosts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No active boosts right now</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 font-medium">Listing</th>
                  <th className="pb-2 font-medium">Location</th>
                  <th className="pb-2 font-medium">Tier</th>
                  <th className="pb-2 font-medium">Started</th>
                  <th className="pb-2 font-medium">Expires</th>
                  <th className="pb-2 font-medium text-right">Time Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedActive.map((b) => {
                  const config = TIER_CONFIG[b.boost_tier] || TIER_CONFIG.spark;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="py-2.5 max-w-[200px] truncate text-gray-800 font-medium">{b.title}</td>
                      <td className="py-2.5 text-gray-500">{b.city}, {b.state}</td>
                      <td className="py-2.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>{config.label}</span>
                      </td>
                      <td className="py-2.5 text-gray-500">{new Date(b.boost_started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="py-2.5 text-gray-500">{new Date(b.boost_expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="py-2.5 text-right font-medium text-gray-700">{timeUntil(b.boost_expires_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Payments (collapsible) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <button onClick={() => setShowRecentPayments(!showRecentPayments)} className="w-full flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Recent Boost Payments ({data.recentPayments.length})</h3>
          {showRecentPayments ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showRecentPayments && (
          <div className="mt-4 overflow-x-auto">
            {data.recentPayments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No boost payments recorded yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Tier</th>
                    <th className="pb-2 font-medium">Duration</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.recentPayments.map((p) => {
                    const config = TIER_CONFIG[p.boost_tier] || TIER_CONFIG.spark;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="py-2 text-gray-500">{new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                        <td className="py-2"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>{config.label}</span></td>
                        <td className="py-2 text-gray-500">{p.duration_days} day{p.duration_days !== 1 ? "s" : ""}</td>
                        <td className="py-2 text-right font-medium text-gray-800">{formatCents(p.amount_cents)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
