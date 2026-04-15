"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ChevronDown, Loader2, MapPin } from "lucide-react";
import ExternalListingCard from "./ExternalListingCard";

interface ExternalListing {
  id: string;
  source: string;
  source_url: string;
  title: string;
  description: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  sale_date: string | null;
  sale_time_start: string | null;
  sale_time_end: string | null;
  category: string | null;
  categories: string[];
  photo_urls: string[];
  address: string | null;
  collected_at: string | null;
  distance?: number | null;
}

interface ExternalSalesSectionProps {
  userLat?: number | null;
  userLng?: number | null;
}

var SOURCES = [
  { value: "", label: "All Sources" },
  { value: "craigslist", label: "Craigslist" },
  { value: "estatesales", label: "EstateSales.net" },
  { value: "nextdoor", label: "Nextdoor" },
];

var CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "Yard Sale", label: "Yard Sales" },
  { value: "Garage Sale", label: "Garage Sales" },
  { value: "Estate Sale", label: "Estate Sales" },
  { value: "Moving Sale", label: "Moving Sales" },
  { value: "Multi-Family Sale", label: "Multi-Family" },
  { value: "Furniture", label: "Furniture" },
  { value: "Electronics", label: "Electronics" },
  { value: "Tools & Hardware", label: "Tools & Hardware" },
  { value: "Baby & Kids", label: "Baby & Kids" },
  { value: "Clothing", label: "Clothing" },
  { value: "Antiques & Collectibles", label: "Antiques" },
];

export default function ExternalSalesSection({ userLat, userLng }: ExternalSalesSectionProps) {
  var [listings, setListings] = useState<ExternalListing[]>([]);
  var [loading, setLoading] = useState(true);
  var [loadingMore, setLoadingMore] = useState(false);
  var [page, setPage] = useState(1);
  var [hasMore, setHasMore] = useState(false);
  var [total, setTotal] = useState(0);
  var [searchQuery, setSearchQuery] = useState("");
  var [activeSearch, setActiveSearch] = useState("");
  var [sourceFilter, setSourceFilter] = useState("");
  var [categoryFilter, setCategoryFilter] = useState("");
  var [showFilters, setShowFilters] = useState(false);

  var fetchListings = useCallback(
    async function (pageNum: number, append: boolean) {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        var params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", "24");
        if (activeSearch) params.set("search", activeSearch);
        if (sourceFilter) params.set("source", sourceFilter);
        if (categoryFilter) params.set("category", categoryFilter);
        if (userLat && userLng) {
          params.set("lat", String(userLat));
          params.set("lng", String(userLng));
        }

        var response = await fetch("/api/external-sales?" + params.toString());
        var data = await response.json();

        if (data.error) { console.error("External sales error:", data.error); return; }

        if (append) {
          setListings(function (prev) { return prev.concat(data.listings || []); });
        } else {
          setListings(data.listings || []);
        }

        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
        setPage(pageNum);
      } catch (err) {
        console.error("Failed to fetch external sales:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeSearch, sourceFilter, categoryFilter, userLat, userLng]
  );

  useEffect(function () { fetchListings(1, false); }, [fetchListings]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveSearch(searchQuery);
  }

  function handleClearFilters() {
    setSearchQuery("");
    setActiveSearch("");
    setSourceFilter("");
    setCategoryFilter("");
  }

  var hasActiveFilters = activeSearch || sourceFilter || categoryFilter;

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Nearby Sales</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total > 0 ? total + " sales found from across the web" : "Searching for sales near you..."}
          </p>
        </div>
        <button
          onClick={function () { setShowFilters(!showFilters); }}
          className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors " +
            (showFilters || hasActiveFilters
              ? "bg-[#2E7D32] text-white border-[#2E7D32]"
              : "bg-white text-gray-700 border-gray-300 hover:border-[#2E7D32]")}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-[#2E7D32] text-xs font-bold">!</span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={function (e) { setSearchQuery(e.target.value); }}
                placeholder="Search sales (e.g. furniture, tools, vintage)..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32]"
              />
            </div>
          </form>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <select
                value={sourceFilter}
                onChange={function (e) { setSourceFilter(e.target.value); }}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32]"
              >
                {SOURCES.map(function (s) {
                  return <option key={s.value} value={s.value}>{s.label}</option>;
                })}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={function (e) { setCategoryFilter(e.target.value); }}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32]"
              >
                {CATEGORIES.map(function (c) {
                  return <option key={c.value} value={c.value}>{c.label}</option>;
                })}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className="text-sm text-red-500 hover:text-red-700 font-medium">
                Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#2E7D32] animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && listings.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No sales found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {hasActiveFilters ? "Try adjusting your filters or search terms." : "Check back soon — new sales are collected regularly!"}
          </p>
          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="mt-3 text-sm text-[#2E7D32] font-medium hover:underline">Clear all filters</button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && listings.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {listings.map(function (listing) {
              return (
                <ExternalListingCard
                  key={listing.id}
                  listing={listing}
                  distance={(listing as any).distance != null ? (listing as any).distance : null}
                />
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={function () { fetchListings(page + 1, true); }}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#256929] disabled:opacity-50 transition-colors"
              >
                {loadingMore ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                ) : (
                  <>Load More Sales</>
                )}
              </button>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-3">
            {"Showing " + listings.length + " of " + total + " sales"}
          </p>
        </>
      )}
    </section>
  );
}
