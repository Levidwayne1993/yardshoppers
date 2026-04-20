"use client";

import {
  Users, UserPlus, UserCheck, ShoppingBag, Heart, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";

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

interface Props {
  data: UserGrowthData;
}

export default function UserGrowth({ data }: Props) {
  const maxSignups = Math.max(...data.dailySignups.map((d) => d.count), 1);

  const growthIcon =
    data.signupGrowthPct > 0 ? (
      <ArrowUpRight className="w-4 h-4 text-green-500" />
    ) : data.signupGrowthPct < 0 ? (
      <ArrowDownRight className="w-4 h-4 text-red-500" />
    ) : (
      <Minus className="w-4 h-4 text-gray-400" />
    );

  const growthColor =
    data.signupGrowthPct > 0
      ? "text-green-600"
      : data.signupGrowthPct < 0
      ? "text-red-600"
      : "text-gray-500";

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-600" />
        User Growth
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Total Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Total Users</span>
            <Users className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.totalUsers.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">all time</p>
        </div>

        {/* New Signups */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">New Signups</span>
            <UserPlus className="w-3.5 h-3.5 text-brand-green" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.newSignups}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {growthIcon}
            <span className={`text-xs font-medium ${growthColor}`}>
              {data.signupGrowthPct > 0 ? "+" : ""}{data.signupGrowthPct}%
            </span>
            <span className="text-xs text-gray-400">vs prev period</span>
          </div>
        </div>

        {/* Returning Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Returning Users</span>
            <UserCheck className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.returningUsers}</p>
          <p className="text-xs text-gray-400 mt-0.5">active this period</p>
        </div>
      </div>

      {/* Seller vs Buyer Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Active Sellers</span>
            <ShoppingBag className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.activeSellers}</p>
          <p className="text-xs text-gray-500 mt-1">users who posted listings this period</p>
          {data.totalUsers > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Seller rate</span>
                <span className="font-medium">{Math.round((data.activeSellers / data.totalUsers) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 rounded-full h-1.5 transition-all duration-500"
                  style={{ width: `${Math.min((data.activeSellers / data.totalUsers) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Active Buyers</span>
            <Heart className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.activeBuyers}</p>
          <p className="text-xs text-gray-500 mt-1">users who saved listings this period</p>
          {data.totalUsers > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Buyer rate</span>
                <span className="font-medium">{Math.round((data.activeBuyers / data.totalUsers) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 rounded-full h-1.5 transition-all duration-500"
                  style={{ width: `${Math.min((data.activeBuyers / data.totalUsers) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Signups Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Daily Signups</h4>
        {data.dailySignups.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No signup data for this period</p>
        ) : (
          <>
            <div className="flex items-end gap-1 h-28 overflow-x-auto">
              {data.dailySignups.map((d) => {
                const height = Math.max((d.count / maxSignups) * 100, 6);
                return (
                  <div key={d.day} className="group relative flex-1 min-w-[12px]">
                    <div
                      className="bg-blue-500/70 hover:bg-blue-600 rounded-t transition-all duration-200 cursor-pointer mx-auto"
                      style={{ height: `${height}%`, minWidth: "8px", maxWidth: "28px" }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                      <div className="font-semibold">
                        {new Date(d.day + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                      <div>{d.count} signup{d.count !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>
                {new Date(data.dailySignups[0].day + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span>
                {new Date(data.dailySignups[data.dailySignups.length - 1].day + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
