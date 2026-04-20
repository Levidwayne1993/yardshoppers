"use client";

import {
  Package, TrendingUp, TrendingDown, Clock, Calendar, Minus,
} from "lucide-react";

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

interface Props {
  data: VelocityData;
}

export default function ListingVelocity({ data }: Props) {
  const maxCount = Math.max(...data.dailyListings.map((d) => d.count), 1);

  const changeIcon =
    data.velocityChange > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : data.velocityChange < 0 ? (
      <TrendingDown className="w-4 h-4 text-red-500" />
    ) : (
      <Minus className="w-4 h-4 text-gray-400" />
    );

  const changeColor =
    data.velocityChange > 0
      ? "text-green-600"
      : data.velocityChange < 0
      ? "text-red-600"
      : "text-gray-500";

  const changeBg =
    data.velocityChange > 0
      ? "bg-green-50"
      : data.velocityChange < 0
      ? "bg-red-50"
      : "bg-gray-50";

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <Package className="w-5 h-5 text-brand-green" />
        Listing Velocity
      </h3>

      {/* Speed Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Last Hour</span>
            <Clock className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.listingsLastHour}</p>
          <p className="text-xs text-gray-400 mt-0.5">new listings</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Last 24h</span>
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.listingsLast24h}</p>
          <p className="text-xs text-gray-400 mt-0.5">new listings</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Last 7 Days</span>
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.listingsLast7d}</p>
          <p className="text-xs text-gray-400 mt-0.5">new listings</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Full Period</span>
            <Calendar className="w-3.5 h-3.5 text-brand-orange" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.listingsLast30d}</p>
          <p className="text-xs text-gray-400 mt-0.5">new listings</p>
        </div>
      </div>

      {/* Velocity Trend + Avg Per Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className={`rounded-xl border p-4 shadow-sm ${changeBg} border-gray-200`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-600">Period vs. Previous</span>
            {changeIcon}
          </div>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold ${changeColor}`}>
              {data.velocityChange > 0 ? "+" : ""}
              {data.velocityChange}%
            </p>
            <span className="text-xs text-gray-400">
              {data.currentPeriodCount} vs {data.prevPeriodCount} listings
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-600">Avg Per Day</span>
            <TrendingUp className="w-4 h-4 text-brand-green" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.avgPerDay}</p>
          <p className="text-xs text-gray-400 mt-0.5">listings/day average</p>
        </div>
      </div>

      {/* Daily Listings Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Daily New Listings</h4>
        {data.dailyListings.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No listing data for this period</p>
        ) : (
          <>
            <div className="flex items-end gap-1 h-32 overflow-x-auto">
              {data.dailyListings.map((d) => {
                const height = Math.max((d.count / maxCount) * 100, 4);
                return (
                  <div key={d.day} className="group relative flex-1 min-w-[12px]">
                    <div
                      className="bg-brand-orange/70 hover:bg-brand-orange rounded-t transition-all duration-200 cursor-pointer mx-auto"
                      style={{ height: `${height}%`, minWidth: "8px", maxWidth: "28px" }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                      <div className="font-semibold">
                        {new Date(d.day + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                      <div>{d.count} listing{d.count !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>
                {new Date(data.dailyListings[0].day + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span>
                {new Date(data.dailyListings[data.dailyListings.length - 1].day + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
