"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

function BrowseContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lat, lng, city, loading: locationLoading } = useLocation();

  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "";

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] = useState<
    string[]
  >(initialCategory ? [initialCategory] : []);
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

    // Distance filter
    if (lat && lng && radius < 999) {
      const milesToDeg = radius / 69;
      const lngDeg =
        radius / (69 * Math.cos((lat * Math.PI) / 180));
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

  function updateURL(newSearch: string, cats: string[]) {
    const params = new URLSearchParams();
    if (newSearch.trim()) params.set("search", newSearch.trim());
    if (cats.length === 1) params.set("category", cats[0]);
    router.replace(
      `/browse${params.toString() ? `?${params}` : ""}`,
      { scroll: false }
    );
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateURL(search, selectedCategories);
  }

  function toggleCategory(cat: string) {
    if (cat === "All") {
      setSelectedCategories([]);
      updateURL(search, []);
      return;
    }
    const updated = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(updated);
    updateURL(search, updated);
  }

  function clearFilters() {
    setSearch("");
    setSelectedCategories([]);
    setSort("newest");
    setRadius(999);
    router.replace("/browse", { scroll: false });
  }

  const hasFilters =
    search.trim() ||
    selectedCategories.length > 0 ||
    radius < 999;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <form
            onSubmit={handleSearch}
            className="flex gap-2 mb-3"
          >
            <div className="flex-1 relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by keyword, city, or item..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-ys-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={sort}
              onChange={(e) =>
                setSort(e.target.value as SortOption)
              }
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ys-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </form>

          {/* Distance Selector */}
          {(lat || city) && (
            <div className="mb-3 pb-3 border-b border-gray-100">
              <DistanceSelector
                value={radius}
                onChange={setRadius}
              />
            </div>
          )}

          {/* Multi-Select Category Pills */}
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
            {CATEGORIES.filter((c) => c !== "All").map(
              (cat) => (
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
              )
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading
              ? "Searching..."
              : `${totalCount} sale${
                  totalCount !== 1 ? "s" : ""
                } found`}
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
              <ListingCard
                key={listing.id}
                listing={listing}
              />
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
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ys-600" />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
