"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import ListingCard from "@/components/ListingCard";

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

export default function BrowsePage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  /* Read initial values from URL */
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "All";

  const [search, setSearch] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sort, setSort] = useState<SortOption>("newest");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  /* ── Fetch listings from Supabase ────────── */
  const fetchListings = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("listings")
      .select("*, listing_photos(*)", { count: "exact" });

    /* Filter by search term */
    if (search.trim()) {
      query = query.or(
        `title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,city.ilike.%${search.trim()}%`
      );
    }

    /* Filter by category */
    if (activeCategory !== "All") {
      query = query.eq("category", activeCategory);
    }

    /* Sort */
    query = query.order("created_at", {
      ascending: sort === "oldest",
    });

    const { data, count } = await query.limit(24);

    setListings(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  }, [search, activeCategory, sort]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  /* ── Update URL when filters change ──────── */
  function updateURL(newSearch: string, newCategory: string) {
    const params = new URLSearchParams();
    if (newSearch.trim()) params.set("search", newSearch.trim());
    if (newCategory !== "All") params.set("category", newCategory);
    router.replace(`/browse${params.toString() ? `?${params}` : ""}`, {
      scroll: false,
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateURL(search, activeCategory);
  }

  function handleCategoryClick(cat: string) {
    setActiveCategory(cat);
    updateURL(search, cat);
  }

  function clearFilters() {
    setSearch("");
    setActiveCategory("All");
    setSort("newest");
    router.replace("/browse", { scroll: false });
  }

  const hasFilters = search.trim() || activeCategory !== "All";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header Bar ──────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Search + Sort Row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="flex items-center flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 gap-2 focus-within:border-ys-600 focus-within:ring-2 focus-within:ring-ys-600/20 transition-all">
                <i className="fa-solid fa-magnifying-glass text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search by keyword, city, or item..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      updateURL("", activeCategory);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <i className="fa-solid fa-xmark text-xs" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-ys-800 hover:bg-ys-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-3">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-ys-600 transition cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-red-500 transition whitespace-nowrap"
                >
                  <i className="fa-solid fa-xmark mr-1" />
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Category Pills */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  activeCategory === cat
                    ? "bg-ys-800 text-white border-ys-800 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-ys-600 hover:text-ys-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results ─────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Result count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {loading ? (
              "Searching..."
            ) : (
              <>
                <span className="font-semibold text-gray-900">{totalCount}</span>{" "}
                {totalCount === 1 ? "listing" : "listings"} found
                {activeCategory !== "All" && (
                  <span className="ml-1">
                    in{" "}
                    <span className="font-medium text-ys-800">
                      {activeCategory}
                    </span>
                  </span>
                )}
                {search.trim() && (
                  <span className="ml-1">
                    for &ldquo;
                    <span className="font-medium text-ys-800">
                      {search.trim()}
                    </span>
                    &rdquo;
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {loading ? (
          /* Loading skeletons */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse"
              >
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-5 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          /* Listings grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <i className="fa-solid fa-magnifying-glass text-3xl text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No listings found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {hasFilters
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Be the first to post a yard sale in your area!"}
            </p>
            <div className="flex items-center justify-center gap-3">
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Clear Filters
                </button>
              )}
              <a
                href="/post"
                className="px-5 py-2.5 bg-ys-800 hover:bg-ys-900 text-white rounded-full text-sm font-semibold transition-all"
              >
                <i className="fa-solid fa-plus mr-1.5" />
                Post a Sale
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
