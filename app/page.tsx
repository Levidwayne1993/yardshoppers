"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import ListingCard from "@/components/ListingCard";
import DistanceSelector from "@/components/DistanceSelector";
import { useLocation } from "@/lib/useLocation";

const CATEGORIES = [
  "All",
  "Furniture",
  "Electronics",
  "Clothing",
  "Toys & Games",
  "Tools",
  "Kitchen",
  "Sports",
  "Books",
  "Antiques",
  "Garden",
  "Baby & Kids",
  "Vehicles",
  "Free Stuff",
];

type SortOption = "newest" | "oldest";

const STEPS = [
  {
    icon: "fa-magnifying-glass",
    title: "Search",
    desc: "Browse yard sales by location, category, or keyword. Find exactly what you're looking for.",
  },
  {
    icon: "fa-heart",
    title: "Save",
    desc: "Save your favorite sales and get reminders so you never miss a deal.",
  },
  {
    icon: "fa-map-location-dot",
    title: "Visit",
    desc: "Get directions, see sale times, and show up ready to score incredible deals.",
  },
];

export default function HomePage() {
  const supabase = createClient();
  const router = useRouter();
  const {
    city,
    region,
    lat,
    lng,
    loading: locationLoading,
  } = useLocation();

  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("newest");
  const [radius, setRadius] = useState(999);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("listings")
      .select("*, listing_photos(*)", { count: "exact" });

    if (search.trim()) {
      query = query.or(
        `title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,city.ilike.%${search.trim()}%`
      );
    }

    if (selectedCategories.length === 1) {
      query = query.or(
        `category.eq.${selectedCategories[0]},categories.cs.{${selectedCategories[0]}}`
      );
    } else if (selectedCategories.length > 1) {
      query = query.overlaps("categories", selectedCategories);
    }

    if (lat && lng && radius < 999) {
      const milesToDeg = radius / 69;
      const lngDeg = radius / (69 * Math.cos((lat * Math.PI) / 180));
      query = query
        .gte("latitude", lat - milesToDeg)
        .lte("latitude", lat + milesToDeg)
        .gte("longitude", lng - lngDeg)
        .lte("longitude", lng + lngDeg);
    }

    query = query
      .order("is_boosted", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: sort === "oldest" });

    const { data, count } = await query.limit(24);
    setListings(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  }, [search, selectedCategories, sort, radius, lat, lng]);

  useEffect(() => {
    if (!locationLoading) fetchListings();
  }, [fetchListings, locationLoading]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchListings();
  }

  function toggleCategory(cat: string) {
    if (cat === "All") {
      setSelectedCategories([]);
      return;
    }
    const updated = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(updated);
  }

  function clearFilters() {
    setSearch("");
    setSelectedCategories([]);
    setSort("newest");
    setRadius(999);
  }

  const hasFilters =
    search.trim() || selectedCategories.length > 0 || radius < 999;

  return (
    <div className="min-h-screen">
      {/* Hero — compact branded header */}
      <section className="relative bg-gradient-to-br from-ys-800 via-ys-700 to-ys-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl">🏷️</div>
          <div className="absolute top-32 right-20 text-5xl">🛋️</div>
          <div className="absolute bottom-20 left-1/4 text-4xl">📦</div>
          <div className="absolute bottom-10 right-1/3 text-5xl">🎸</div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-4 text-sm font-medium">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {city
              ? `📍 Located in ${city}, ${region}`
              : "Live yard sales near you"}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Discover Yard Sales
            <span className="block text-ys-200">In Your Neighborhood</span>
          </h1>
          <p className="mt-3 text-base md:text-lg text-ys-100 max-w-2xl mx-auto">
            Find incredible deals at yard sales near you. Post your own sale and
            reach hundreds of local shoppers.
          </p>
        </div>
      </section>

      {/* Search / Filters — matches Browse page */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  city
                    ? `Search sales near ${city}...`
                    : "Search by keyword, city, or item..."
                }
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-ys-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ys-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </form>

          {/* Distance Selector */}
          {(lat || city) && (
            <div className="mb-3 pb-3 border-b border-gray-100">
              <DistanceSelector value={radius} onChange={setRadius} />
            </div>
          )}

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => toggleCategory("All")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategories.length === 0
                  ? "bg-ys-700 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {CATEGORIES.filter((c) => c !== "All").map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategories.includes(cat)
                    ? "bg-ys-700 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
                {selectedCategories.includes(cat) && (
                  <span className="ml-1">✕</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading
              ? "Searching..."
              : `${totalCount} sale${totalCount !== 1 ? "s" : ""} found`}
            {selectedCategories.length > 0 && (
              <span className="ml-1 text-ys-700 font-medium">
                in {selectedCategories.join(", ")}
              </span>
            )}
            {radius < 999 && (
              <span className="ml-1 text-ys-700 font-medium">
                within {radius} mi
              </span>
            )}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-ys-700 hover:text-ys-800 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100"
              />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <i className="fa-solid fa-magnifying-glass text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No sales found
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {radius < 999
                ? `No sales within ${radius} miles. Try increasing the radius or clearing filters.`
                : "Try adjusting your search or category filters"}
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-ys-600 text-white rounded-lg font-semibold hover:bg-ys-700 transition"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Boost CTA */}
      <section className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-y border-amber-100">
        <div className="max-w-6xl mx-auto px-4 py-14 text-center">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mb-4">
            New Feature
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Boost Your Sale to the Top 🚀
          </h2>
          <p className="text-gray-600 mb-2">
            Get 10x more views and appear first in search results.
          </p>
          <p className="text-2xl font-bold text-ys-800 mb-6">Just $2.99</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link
              href="/post"
              className="px-8 py-3 bg-ys-600 text-white rounded-xl font-semibold hover:bg-ys-700 transition shadow-md"
            >
              Post & Boost a Sale
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-white text-ys-700 border-2 border-ys-200 rounded-xl font-semibold hover:border-ys-400 transition"
            >
              Boost an existing listing
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              {
                icon: "fa-arrow-up",
                label: "Top Placement",
                sub: "Appear first in results",
              },
              {
                icon: "fa-eye",
                label: "10x More Views",
                sub: "Maximum visibility",
              },
              {
                icon: "fa-bolt",
                label: "Instant Activation",
                sub: "Goes live immediately",
              },
            ].map((b) => (
              <div
                key={b.label}
                className="bg-white rounded-xl p-4 shadow-sm border border-amber-100"
              >
                <i
                  className={`fa-solid ${b.icon} text-amber-500 text-xl mb-2`}
                />
                <p className="font-semibold text-gray-900 text-sm">
                  {b.label}
                </p>
                <p className="text-gray-500 text-xs">{b.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How YardShoppers Works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          How YardShoppers Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="bg-white border border-gray-100 rounded-2xl p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-ys-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-ys-100 transition-colors">
                <i
                  className={`fa-solid ${step.icon} text-2xl text-ys-700`}
                />
              </div>
              <div className="text-xs font-bold text-ys-600 mb-1">
                Step {i + 1}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-500 text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Signals */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: "100%", label: "Free to Browse" },
              { val: "📍", label: "Location Based" },
              { val: "⚡", label: "Instant Posting" },
              { val: "🔒", label: "Secure & Private" },
            ].map((t) => (
              <div key={t.label}>
                <div className="text-2xl font-extrabold text-ys-700">
                  {t.val}
                </div>
                <p className="text-sm text-gray-500 mt-1">{t.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
