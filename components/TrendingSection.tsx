"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import JsonLd from "@/components/JsonLd";
import {
  getTrendingListings,
  getHotNearby,
  getPriceDrops,
  getPopularSearchTerms,
  generateItemListSchema,
} from "@/lib/seo-signals";
import { useLocation } from "@/lib/useLocation";

type Tab = "trending" | "hot" | "drops" | "searches";

export default function TrendingSection() {
  const { city, region, lat, lng } = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("trending");
  const [trending, setTrending] = useState<any[]>([]);
  const [hot, setHot] = useState<any[]>([]);
  const [drops, setDrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const searchTerms = getPopularSearchTerms();

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);

      const { createClient } = await import("@/lib/supabase-browser");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const [trendingData, dropsData] = await Promise.all([
        getTrendingListings(12),
        getPriceDrops(12),
      ]);

      setTrending(trendingData);
      setDrops(dropsData);

      if (lat && lng) {
        const hotData = await getHotNearby(lat, lng, 50, 12);
        setHot(hotData);
      }

      setLoading(false);
    }
    fetchAll();
  }, [lat, lng]);

  const tabs: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: "trending", label: "Trending", icon: "fa-fire", count: trending.length },
    { key: "hot", label: "Hot Near You", icon: "fa-location-dot", count: hot.length },
    { key: "drops", label: "Price Drops", icon: "fa-tag", count: drops.length },
    { key: "searches", label: "Popular Searches", icon: "fa-magnifying-glass-chart", count: searchTerms.length },
  ];

  const activeListings =
    activeTab === "trending"
      ? trending
      : activeTab === "hot"
      ? hot
      : activeTab === "drops"
      ? drops
      : [];

  const schemaName =
    activeTab === "trending"
      ? "Trending Yard Sales"
      : activeTab === "hot"
      ? `Hot Yard Sales Near ${city || "You"}`
      : activeTab === "drops"
      ? "Yard Sales with Price Drops"
      : "";

  const schemaDesc =
    activeTab === "trending"
      ? "The most viewed yard sales on YardShoppers this week."
      : activeTab === "hot"
      ? `Popular yard sales near ${city || "your area"} on YardShoppers.`
      : activeTab === "drops"
      ? "Yard sales with recently reduced prices on YardShoppers."
      : "";

  // Don't render if no data at all
  if (!loading && trending.length === 0 && hot.length === 0 && drops.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      {activeListings.length > 0 && (
        <JsonLd data={generateItemListSchema(activeListings, schemaName, schemaDesc)} />
      )}

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">
          <i className="fa-solid fa-chart-line text-ys-600 mr-2 text-lg" aria-hidden="true" />
          Real-Time Signals
        </h2>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-ys-800 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-xs`} aria-hidden="true" />
            {tab.label}
            {tab.count > 0 && activeTab !== tab.key && (
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/3] bg-gray-200 rounded-2xl mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Trending / Hot / Price Drops — listing grid */}
      {!loading && activeTab !== "searches" && (
        <>
          {activeListings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <i className={`fa-solid ${activeTab === "hot" ? "fa-location-dot" : activeTab === "drops" ? "fa-tag" : "fa-fire"} text-3xl text-gray-300 mb-3`} aria-hidden="true" />
              <p className="text-gray-500 text-sm">
                {activeTab === "hot"
                  ? "No hot listings near you yet. Try expanding your area."
                  : activeTab === "drops"
                  ? "No price drops right now. Check back soon!"
                  : "No trending listings yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeListings.map((listing) => (
                <div key={listing.id} className="relative">
                  {activeTab === "trending" && listing.view_count > 0 && (
                    <div className="absolute top-3 right-3 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <i className="fa-solid fa-fire text-[8px]" aria-hidden="true" />
                      {listing.view_count} views
                    </div>
                  )}
                  {activeTab === "drops" && (
                    <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <i className="fa-solid fa-arrow-down text-[8px]" aria-hidden="true" />
                      Price Drop
                    </div>
                  )}
                  {activeTab === "hot" && (
                    <div className="absolute top-3 right-3 z-10 bg-ys-700 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <i className="fa-solid fa-location-dot text-[8px]" aria-hidden="true" />
                      Nearby
                    </div>
                  )}
                  <ListingCard listing={listing} currentUserId={currentUserId} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Popular Searches */}
      {!loading && activeTab === "searches" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {searchTerms.map((item) => (
            <Link
              key={item.term}
              href={`/browse?search=${encodeURIComponent(item.term)}`}
              className="group flex items-center justify-between bg-white border border-gray-100 hover:border-ys-300 rounded-xl px-4 py-3 transition-all hover:shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-ys-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-ys-100 transition">
                  <i className="fa-solid fa-magnifying-glass text-xs text-ys-600" aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-ys-800 truncate capitalize">
                  {item.term}
                </span>
              </div>
              <span
                className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.volume === "Very High"
                    ? "bg-red-100 text-red-700"
                    : item.volume === "High"
                    ? "bg-orange-100 text-orange-700"
                    : item.volume === "Medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {item.volume}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
