"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import ListingCard from "@/components/ListingCard";
import DistanceSelector from "@/components/DistanceSelector";
import { useLocation } from "@/lib/useLocation";

const CATEGORIES = [
  "All", "Furniture", "Electronics", "Clothing", "Toys & Games", "Tools",
  "Kitchen", "Sports", "Books", "Antiques", "Garden", "Baby & Kids",
  "Vehicles", "Free Stuff",
];

function milesToDeg(miles: number) {
  return miles / 69;
}

function BrowseContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const { city, region, lat, lng } = useLocation();

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "All"
  );
  const [sort, setSort] = useState("newest");
  const [distance, setDistance] = useState(999);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    }
    getUser();
  }, []);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);

      let query = supabase.from("listings").select("*, listing_photos(*)");

      if (search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(
          `title.ilike.${term},description.ilike.${term},city.ilike.${term}`
        );
      }

      if (selectedCategory !== "All") {
        query = query.or(
          `category.eq.${selectedCategory},category.cs.{${selectedCategory}}`
        );
      }

      if (distance < 999 && lat && lng) {
        const deg = milesToDeg(distance);
        query = query
          .gte("lat", lat - deg)
          .lte("lat", lat + deg)
          .gte("lng", lng - deg)
          .lte("lng", lng + deg);
      }

      query = query
        .order("is_boosted", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: sort === "oldest" });

      query = query.limit(24);

      const { data } = await query;
      setListings(data || []);
      setLoading(false);
    }

    fetchListings();
  }, [search, selectedCategory, sort, distance, lat, lng]);

  const hasFilters = search || selectedCategory !== "All" || distance < 999;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="sticky top-[65px] z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search yard sales..."
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300 focus:border-ys-400 transition"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-ys-300"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          <DistanceSelector value={distance} onChange={setDistance} />

          <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-ys-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasFilters && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {listings.length} result{listings.length !== 1 ? "s" : ""} found
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
              setDistance(999);
            }}
            className="text-sm text-ys-700 hover:text-ys-900 font-semibold transition"
          >
            <i className="fa-solid fa-xmark mr-1 text-xs" />
            Clear filters
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/3] bg-gray-200 rounded-2xl mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <i className="fa-solid fa-magnifying-glass text-3xl text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No sales found</h2>
          <p className="text-gray-500 mb-6">Try adjusting your search or filters.</p>
          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
                setDistance(999);
              }}
              className="px-6 py-2.5 bg-ys-800 text-white rounded-full font-semibold hover:bg-ys-900 transition"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          <i className="fa-solid fa-spinner fa-spin mr-2" />
          Loading...
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
