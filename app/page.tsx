"use client";

import { useEffect, useState } from "react";
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

function milesToDeg(miles: number) {
  return miles / 69;
}

export default function HomePage() {
  const supabase = createClient();
  const { city, region, lat, lng, loading: locationLoading } = useLocation();

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
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

      query = query.limit(12);

      const { data } = await query;
      setListings(data || []);
      setLoading(false);
    }

    fetchListings();
  }, [search, selectedCategory, sort, distance, lat, lng]);

  return (
    <div>
      <section className="relative bg-gradient-to-br from-ys-900 via-ys-800 to-ys-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl animate-bounce">🏷️</div>
          <div className="absolute top-20 right-20 text-5xl animate-bounce delay-300">🛋️</div>
          <div className="absolute bottom-10 left-1/4 text-4xl animate-bounce delay-700">📦</div>
          <div className="absolute bottom-20 right-1/3 text-5xl animate-bounce delay-500">🎸</div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center relative z-10">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 leading-tight">
            Discover Yard Sales
            <br />
            <span className="text-ys-300">Near You</span>
          </h1>
          <p className="text-ys-200 text-lg mb-2 max-w-xl mx-auto">
            Find amazing deals in your neighborhood. Browse, save, and visit
            yard sales happening right now.
          </p>
          {(city || region) && (
            <p className="text-ys-300 text-sm mb-8">
              <i className="fa-solid fa-location-dot mr-1" />
              {[city, region].filter(Boolean).join(", ")}
            </p>
          )}

          <div className="max-w-2xl mx-auto flex gap-3">
            <div className="flex-1 relative">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for furniture, electronics, toys..."
                className="w-full pl-11 pr-4 py-3.5 bg-white text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-400 shadow-lg"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-white text-gray-700 rounded-xl px-4 py-3.5 text-sm font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-ys-400"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-3 mb-6">
          <DistanceSelector value={distance} onChange={setDistance} />
          <div className="flex gap-2 overflow-x-auto pb-1">
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
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <i className="fa-solid fa-magnifying-glass text-3xl text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No sales found nearby</h2>
            <p className="text-gray-500 mb-6">Try expanding your distance or changing your search.</p>
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

        {listings.length > 0 && (
          <div className="text-center mt-10">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-8 py-3 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-semibold transition-all hover:shadow-lg"
            >
              View All Sales
              <i className="fa-solid fa-arrow-right text-sm" />
            </Link>
          </div>
        )}

        <section className="mt-16 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-3xl p-8 sm:p-10 text-center">
          <div className="w-14 h-14 bg-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-rocket text-xl text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Want More Eyes on Your Sale?</h2>
          <p className="text-gray-600 max-w-lg mx-auto mb-6">
            Boost your listing for just $2.99 and appear at the top of browse
            results. Get 10x more views and sell faster!
          </p>
          <Link
            href="/post"
            className="inline-flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold transition-all hover:shadow-lg"
          >
            Post a Sale — It&apos;s Free
          </Link>
        </section>

        <section className="mt-16 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How YardShoppers Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { icon: "fa-magnifying-glass", title: "Search", desc: "Find yard sales near you by location, category, or keyword." },
              { icon: "fa-heart", title: "Save", desc: "Save your favorite listings and plan your yard sale route." },
              { icon: "fa-map-location-dot", title: "Visit", desc: "Get directions and head out to find amazing deals!" },
            ].map((step) => (
              <div key={step.title} className="text-center">
                <div className="w-14 h-14 bg-ys-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className={`fa-solid ${step.icon} text-xl text-ys-700`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "fa-dollar-sign", label: "Free to Browse" },
            { icon: "fa-location-crosshairs", label: "Location Based" },
            { icon: "fa-bolt", label: "Instant Posting" },
            { icon: "fa-shield-halved", label: "Secure & Private" },
          ].map((trust) => (
            <div key={trust.label} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <div className="w-9 h-9 bg-ys-100 rounded-lg flex items-center justify-center shrink-0">
                <i className={`fa-solid ${trust.icon} text-sm text-ys-700`} />
              </div>
              <span className="text-sm font-semibold text-gray-700">{trust.label}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
