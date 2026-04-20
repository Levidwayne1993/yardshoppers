"use client";

import {
  MapPin, Flame, Snowflake, TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Globe,
} from "lucide-react";

interface CityEntry {
  city: string;
  state: string;
  currentCount: number;
  previousCount: number;
  totalListings: number;
  growthPct: number;
}

interface CityHeatmapData {
  hottestCities: CityEntry[];
  deadZones: CityEntry[];
  steadyCities: CityEntry[];
  totalCitiesWithListings: number;
  activeCitiesCount: number;
}

interface Props {
  data: CityHeatmapData;
}

function GrowthBadge({ pct }: { pct: number }) {
  if (pct > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
        <ArrowUpRight className="w-3 h-3" />+{pct}%
      </span>
    );
  }
  if (pct < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
        <ArrowDownRight className="w-3 h-3" />{pct}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" />0%
    </span>
  );
}

function HeatBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{
          width: `${Math.max(pct, 3)}%`,
          background: pct > 66 ? "#16a34a" : pct > 33 ? "#f59e0b" : "#ef4444",
        }}
      />
    </div>
  );
}

export default function CityHeatmap({ data }: Props) {
  const maxCurrent = Math.max(
    ...data.hottestCities.map((c) => c.currentCount),
    ...data.steadyCities.map((c) => c.currentCount),
    1
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <Globe className="w-5 h-5 text-brand-green" />
        City Heatmap
      </h3>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Total Cities</span>
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.totalCitiesWithListings}</p>
          <p className="text-xs text-gray-400 mt-0.5">with listings all time</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Active Cities</span>
            <Flame className="w-3.5 h-3.5 text-brand-orange" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.activeCitiesCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">with listings this period</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500">Dead Zones</span>
            <Snowflake className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.deadZones.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">cities gone quiet</p>
        </div>
      </div>

      {/* Hottest Cities */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          Hottest Cities
          <span className="text-xs font-normal text-gray-400">— fastest growing this period</span>
        </h4>
        {data.hottestCities.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No growth data yet</p>
        ) : (
          <div className="space-y-3">
            {data.hottestCities.map((c, i) => (
              <div key={`${c.city}-${c.state}`} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-5 text-right font-medium">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {c.city}, {c.state}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 tabular-nums">
                        {c.currentCount} listing{c.currentCount !== 1 ? "s" : ""}
                      </span>
                      <GrowthBadge pct={c.growthPct} />
                    </div>
                  </div>
                  <HeatBar current={c.currentCount} max={maxCurrent} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Steady vs Dead */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Steady Cities */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-green" />
            Steady Cities
            <span className="text-xs font-normal text-gray-400">— active both periods</span>
          </h4>
          {data.steadyCities.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No steady cities yet</p>
          ) : (
            <ul className="space-y-2">
              {data.steadyCities.map((c) => (
                <li key={`${c.city}-${c.state}`} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate max-w-[160px]">
                    {c.city}, {c.state}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 tabular-nums">
                      {c.currentCount} → {c.previousCount}
                    </span>
                    <GrowthBadge pct={c.growthPct} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dead Zones */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Snowflake className="w-4 h-4 text-blue-400" />
            Dead Zones
            <span className="text-xs font-normal text-gray-400">— had listings, now silent</span>
          </h4>
          {data.deadZones.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No dead zones — every city is active!</p>
          ) : (
            <ul className="space-y-2">
              {data.deadZones.map((c) => (
                <li key={`${c.city}-${c.state}`} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate max-w-[160px]">
                    {c.city}, {c.state}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 tabular-nums">
                      {c.totalListings} total
                    </span>
                    <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                      inactive
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
