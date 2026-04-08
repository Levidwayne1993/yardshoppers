"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import ListingCard from "@/components/ListingCard";
import DistanceSelector from "@/components/DistanceSelector";
import { useLocation } from "@/lib/useLocation";

const CATEGORIES = [
  { name: "Furniture", emoji: "🛋️" },
  { name: "Electronics", emoji: "📱" },
  { name: "Clothing", emoji: "👗" },
  { name: "Toys & Games", emoji: "🧸" },
  { name: "Tools", emoji: "🔧" },
  { name: "Kitchen", emoji: "🍳" },
  { name: "Sports", emoji: "⚽" },
  { name: "Books", emoji: "📚" },
  { name: "Antiques", emoji: "🏺" },
  { name: "Garden", emoji: "🌿" },
  { name: "Baby & Kids", emoji: "👶" },
  { name: "Vehicles", emoji: "🚗" },
  { name: "Free Stuff", emoji: "🆓" },
];

const STEPS = [
  {
    icon: "fa-magnifying-glass",
    title: "Search",
    desc: "Browse yard sales by location, category, or keyword. Find exactly what you're looking for.",
    action: "search",
  },
  {
    icon: "fa-heart",
    title: "Save",
    desc: "Save your favorite sales and get reminders so you never miss a deal.",
    action: "save",
  },
  {
    icon: "fa-map-location-dot",
    title: "Visit",
    desc: "Get directions, see sale times, and show up ready to score incredible deals.",
    action: "visit",
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
    precise,
    loading: locationLoading,
  } = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [radius, setRadius] = useState(25);
  const [nearbyListings, setNearbyListings] = useState<any[]>([]);
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [isNearby, setIsNearby] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      setLoadingListings(true);

      // Always fetch recent
      const { data: recent } = await supabase
        .from("listings")
        .select("*, listing_photos(*)")
        .order("is_boosted", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(6);

      setRecentListings(recent || []);

      // Try distance-based if we have lat/lng
      if (lat && lng && radius < 999) {
        const milesToDeg = radius / 69;
        const lngDeg =
          radius / (69 * Math.cos((lat * Math.PI) / 180));

        const { data: nearby } = await supabase
          .from("listings")
          .select("*, listing_photos(*)")
          .gte("latitude", lat - milesToDeg)
          .lte("latitude", lat + milesToDeg)
          .gte("longitude", lng - lngDeg)
          .lte("longitude", lng + lngDeg)
          .order("is_boosted", {
            ascending: false,
            nullsFirst: false,
          })
          .order("created_at", { ascending: false })
          .limit(6);

        if (nearby && nearby.length > 0) {
          setNearbyListings(nearby);
          setIsNearby(true);
          setLoadingListings(false);
          return;
        }
      }

      // Fall back to city/state text match
      if (city) {
        const { data: textMatch } = await supabase
          .from("listings")
          .select("*, listing_photos(*)")
          .or(
            `city.ilike.%${city}%,state.ilike.%${region}%`
          )
          .order("is_boosted", {
            ascending: false,
            nullsFirst: false,
          })
          .order("created_at", { ascending: false })
          .limit(6);

        if (textMatch && textMatch.length > 0) {
          setNearbyListings(textMatch);
          setIsNearby(true);
          setLoadingListings(false);
          return;
        }
      }

      // Nothing nearby — show all with message
      setNearbyListings(recent || []);
      setIsNearby(false);
      setLoadingListings(false);
    }

    if (!locationLoading) fetchListings();
  }, [city, region, lat, lng, radius, locationLoading]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim())
      router.push(
        `/browse?search=${encodeURIComponent(search.trim())}`
      );
  }

  function handleStepClick(action: string) {
    if (action === "search") {
      searchInputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setTimeout(() => searchInputRef.current?.focus(), 500);
    } else if (action === "save") {
      router.push("/browse");
    } else if (action === "visit") {
      if (city) {
        router.push(
          `/browse?search=${encodeURIComponent(city)}`
        );
      } else {
        router.push("/browse");
      }
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-ys-800 via-ys-700 to-ys-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl">
            🏷️
          </div>
          <div className="absolute top-32 right-20 text-5xl">
            🛋️
          </div>
          <div className="absolute bottom-20 left-1/4 text-4xl">
            📦
          </div>
          <div className="absolute bottom-10 right-1/3 text-5xl">
            🎸
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6 text-sm font-medium">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {city
              ? `📍 Located in ${city}, ${region}`
              : "Live yard sales near you"}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Discover Yard Sales
            <span className="block text-ys-200">
              In Your Neighborhood
            </span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-ys-100 max-w-2xl mx-auto">
            Find incredible deals at yard sales near you. Post your
            own sale and reach hundreds of local shoppers.
          </p>
          <form
            onSubmit={handleSearch}
            className="mt-8 max-w-2xl mx-auto flex gap-2"
          >
            <div className="flex-1 relative">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  city
                    ? `Search sales near ${city}...`
                    : "Search by city, keyword, or category..."
                }
                className="w-full pl-11 pr-4 py-4 rounded-xl text-gray-900 bg-white shadow-xl focus:outline-none focus:ring-4 focus:ring-ys-300 text-base"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-ys-500 hover:bg-ys-400 text-white font-semibold rounded-xl shadow-xl transition-all duration-200 hover:shadow-2xl"
            >
              Search
            </button>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {CATEGORIES.slice(0, 6).map((cat) => (
              <Link
                key={cat.name}
                href={`/browse?category=${encodeURIComponent(
                  cat.name
                )}`}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-sm transition-all duration-200"
              >
                {cat.emoji} {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Listings with Distance Selector */}
      {!locationLoading && (city || lat) && (
        <section className="max-w-6xl mx-auto px-4 py-14">
          {isNearby ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    <i className="fa-solid fa-location-dot text-ys-600 mr-2" />
                    Near You
                    {city ? ` in ${city}, ${region}` : ""}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Yard sales happening in your area
                    {precise && (
                      <span className="ml-1 text-green-600">
                        • Precise location
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <DistanceSelector
                    value={radius}
                    onChange={setRadius}
                  />
                  <Link
                    href={
                      city
                        ? `/browse?search=${encodeURIComponent(
                            city
                          )}`
                        : "/browse"
                    }
                    className="text-ys-700 hover:text-ys-800 font-semibold text-sm whitespace-nowrap"
                  >
                    View All →
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {nearbyListings.map((l: any) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Yard Sales
                </h2>
                <DistanceSelector
                  value={radius}
                  onChange={setRadius}
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-location-crosshairs text-amber-600 text-lg" />
                  <div>
                    <p className="font-semibold text-amber-800">
                      No yard sales
                      {city ? ` near ${city}` : ""} within{" "}
                      {radius < 999
                        ? `${radius} miles`
                        : "any distance"}{" "}
                      yet
                    </p>
                    <p className="text-amber-600 text-sm">
                      Here are some sales from other areas — be
                      the first to post in your neighborhood!
                    </p>
                  </div>
                  <Link
                    href="/post"
                    className="ml-auto px-4 py-2 bg-ys-600 text-white rounded-lg text-sm font-semibold hover:bg-ys-700 transition whitespace-nowrap"
                  >
                    Post a Sale
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {nearbyListings.map((l: any) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Recently Posted */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Recently Posted
          </h2>
          <Link
            href="/browse"
            className="text-ys-700 hover:text-ys-800 font-semibold text-sm"
          >
            Browse All →
          </Link>
        </div>
        {loadingListings ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-2xl h-72 animate-pulse"
              />
            ))}
          </div>
        ) : recentListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentListings.map((l: any) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
            <i className="fa-solid fa-store text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500">
              No yard sales posted yet. Be the first!
            </p>
            <Link
              href="/post"
              className="mt-4 inline-block px-6 py-3 bg-ys-600 text-white rounded-lg font-semibold hover:bg-ys-700 transition"
            >
              Post a Sale
            </Link>
          </div>
        )}
      </section>

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
          <p className="text-2xl font-bold text-ys-800 mb-6">
            Just $2.99
          </p>
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
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          How YardShoppers Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <button
              key={step.title}
              onClick={() => handleStepClick(step.action)}
              className="bg-white border border-gray-100 rounded-2xl p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
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
              <span className="inline-block mt-3 text-ys-700 text-sm font-semibold group-hover:underline">
                {step.action === "search"
                  ? "Go to Search →"
                  : step.action === "save"
                  ? "Browse Sales →"
                  : "Sales Near You →"}
              </span>
            </button>
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
                <p className="text-sm text-gray-500 mt-1">
                  {t.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
