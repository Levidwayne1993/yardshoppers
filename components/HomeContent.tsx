// ============================================================
// FILE: components/HomeContent.tsx
// PLACE AT: components/HomeContent.tsx  (NEW FILE — create it)
// PURPOSE:
//   - This is where ALL the interactive homepage logic lives
//   - Receives initialListings from the server component (page.tsx)
//   - Shows pre-fetched data instantly on first render (no loading)
//   - Only re-fetches from Supabase when user searches/filters
//   - TrendingSection + CategoryGrid are lazy-loaded (below fold)
//   - This is your original page.tsx code, just moved here
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase-browser";
import ListingCard from "@/components/ListingCard";
import FilterSidebar, { matchesDateFilter } from "@/components/FilterSidebar";
import SavedPanel from "@/components/SavedPanel";
import JsonLd from "@/components/JsonLd";
import { useLocation } from "@/lib/useLocation";
import { useDebounce } from "@/lib/useDebounce";
import { usePersistedState } from "@/lib/usePersistedState";
import { resolveStateAbbreviation } from "@/lib/stateMap";

// ── PERFORMANCE: Lazy-load below-fold components ──
const TrendingSection = dynamic(
  () => import("@/components/TrendingSection"),
  { ssr: false }
);
const CategoryGrid = dynamic(
  () => import("@/components/CategoryGrid"),
  { ssr: false }
);

const supabase = createClient();

const CATEGORIES = [
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

function getDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Find Yard Sales on YardShoppers",
  description:
    "Find amazing deals at yard sales near you in 3 simple steps using YardShoppers.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Search",
      text: "Find yard sales near you by location, category, or keyword.",
      url: "https://www.yardshoppers.com/#how-it-works",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Save",
      text: "Save your favorite listings and plan your yard sale route.",
      url: "https://www.yardshoppers.com/#how-it-works",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Visit",
      text: "Get directions and head out to find amazing deals!",
      url: "https://www.yardshoppers.com/#how-it-works",
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://www.yardshoppers.com",
    },
  ],
};

/* ── Props: server component passes pre-fetched listings ── */
interface HomeContentProps {
  initialListings: any[];
}

export default function HomeContent({ initialListings }: HomeContentProps) {
  const {
    city,
    region,
    lat,
    lng,
    loading: locationLoading,
    requestPreciseLocation,
  } = useLocation();

  /* ── Start with server-fetched data — NO loading spinner ── */
  const [listings, setListings] = useState<any[]>(initialListings);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // ── Track whether user has interacted with filters ──
  const [hasInteracted, setHasInteracted] = useState(false);

  // ── Persisted filters (survive page navigation) ──
  const [selectedCategory, setSelectedCategory] = usePersistedState(
    "ys-filter-category",
    ""
  );
  const [distance, setDistance] = usePersistedState("ys-filter-distance", 50);
  const [dateFilter, setDateFilter] = usePersistedState(
    "ys-filter-date",
    ""
  );

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

  function handleDistanceChange(value: number | null) {
    const d = value ?? 999;
    setDistance(d);
    setHasInteracted(true);
    if (d < 999) {
      requestPreciseLocation();
    }
  }

  function handleCategoryChange(cat: string) {
    setSelectedCategory(cat);
    setHasInteracted(true);
  }

  function handleDateChange(date: string) {
    setDateFilter(date);
    setHasInteracted(true);
  }

  /* ── Only re-fetch when user interacts with filters/search.
        On initial load, we use the server-provided data. ── */
  useEffect(() => {
    // Skip client fetch on initial mount — server already provided data
    if (!hasInteracted && !debouncedSearch.trim()) return;

    if (distance < 999 && (!lat || !lng)) return;

    async function fetchListings() {
      setLoading(true);

      let userQuery = supabase
        .from("listings")
        .select("*, listing_photos(*)");
      userQuery = userQuery.eq("is_shadowbanned", false);
      let extQuery = supabase.from("external_sales").select("*");

      if (debouncedSearch.trim()) {
        const term = `%${debouncedSearch.trim()}%`;
        const stateAbbr = resolveStateAbbreviation(debouncedSearch.trim());
        let conditions = `title.ilike.${term},description.ilike.${term},city.ilike.${term},state.ilike.${term}`;
        if (stateAbbr) {
          conditions += `,state.ilike.%${stateAbbr}%`;
        }
        userQuery = userQuery.or(conditions);
        extQuery = extQuery.or(conditions);
      }

      if (selectedCategory) {
        userQuery = userQuery.or(
          `category.eq.${selectedCategory},categories.cs.{${selectedCategory}}`
        );
        extQuery = extQuery.or(
          `category.eq.${selectedCategory},categories.cs.{${selectedCategory}}`
        );
      }

      if (distance < 999 && lat && lng && !debouncedSearch.trim()) {
        const deg = milesToDeg(distance);
        userQuery = userQuery
          .gte("latitude", lat - deg)
          .lte("latitude", lat + deg)
          .gte("longitude", lng - deg)
          .lte("longitude", lng + deg);
        extQuery = extQuery
          .gte("latitude", lat - deg)
          .lte("latitude", lat + deg)
          .gte("longitude", lng - deg)
          .lte("longitude", lng + deg);
      }

      userQuery = userQuery
        .order("is_boosted", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      extQuery = extQuery
        .order("collected_at", { ascending: false })
        .limit(50);

      userQuery = userQuery.limit(50);

      const [userResult, extResult] = await Promise.all([
        userQuery,
        extQuery,
      ]);

      const userListings = userResult.data || [];
      const externalListings = (extResult.data || []).map((ext: any) => ({
        ...ext,
        listing_photos: ext.photo_urls
          ? ext.photo_urls.map((url: string) => ({ photo_url: url }))
          : [],
        is_boosted: false,
        is_external: true,
        created_at: ext.collected_at,
      }));

      let results = [...userListings, ...externalListings];

      if (dateFilter) {
        results = results.filter((l) =>
          matchesDateFilter(l.sale_date, dateFilter)
        );
      }

      // ── Smart auto-sort ──
      const hasLocation = !!(lat && lng);
      const useNearestSort = hasLocation && !debouncedSearch.trim();

      if (useNearestSort) {
        const boosted = results.filter((l: any) => l.is_boosted);
        const nonBoosted = results.filter((l: any) => !l.is_boosted);
        const sortByDistance = (a: any, b: any) => {
          const distA =
            a.latitude && a.longitude
              ? getDistanceMiles(lat, lng, a.latitude, a.longitude)
              : Infinity;
          const distB =
            b.latitude && b.longitude
              ? getDistanceMiles(lat, lng, b.latitude, b.longitude)
              : Infinity;
          return distA - distB;
        };
        boosted.sort(sortByDistance);
        nonBoosted.sort(sortByDistance);
        results = [...boosted, ...nonBoosted];
      } else {
        const boosted = results.filter((l: any) => l.is_boosted);
        const nonBoosted = results.filter((l: any) => !l.is_boosted);
        const sortByNewest = (a: any, b: any) => {
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        };
        boosted.sort(sortByNewest);
        nonBoosted.sort(sortByNewest);
        results = [...boosted, ...nonBoosted];
      }

      setListings(results.slice(0, 12));
      setLoading(false);
    }
    fetchListings();
  }, [debouncedSearch, selectedCategory, dateFilter, distance, lat, lng, hasInteracted]);

  return (
    <div>
      <JsonLd data={howToSchema} />
      <JsonLd data={breadcrumbSchema} />

      {/* ══════════ HERO ══════════ */}
      <section className="relative bg-gradient-to-br from-ys-900 via-ys-800 to-ys-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl animate-bounce">
            🏷️
          </div>
          <div className="absolute top-20 right-20 text-5xl animate-bounce delay-300">
            🛋️
          </div>
          <div className="absolute bottom-10 left-1/4 text-4xl animate-bounce delay-700">
            📦
          </div>
          <div className="absolute bottom-20 right-1/3 text-5xl animate-bounce delay-500">
            🎸
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center relative z-10">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 leading-tight">
            Discover Yard Sales <br />
            <span className="text-ys-300">Near You</span>
          </h1>
          <p className="text-ys-100 text-lg mb-2 max-w-xl mx-auto">
            Find amazing deals in your neighborhood. Browse, save, and visit
            yard sales happening right now.
          </p>
          {(city || region) && (
            <p className="text-ys-300 text-sm mb-8">
              <i
                className="fa-solid fa-location-dot mr-1"
                aria-hidden="true"
              />
              {[city, region].filter(Boolean).join(", ")}
            </p>
          )}

          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <i
                className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHasInteracted(true);
                }}
                placeholder="Search for furniture, electronics, toys, or a city/state..."
                aria-label="Search yard sales"
                className="w-full pl-11 pr-4 py-3.5 bg-white text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-400 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ 3-PANEL LAYOUT: Filter | Listings | Saved ══════════ */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6">
          {/* ── Left Sidebar: Filters ── */}
          <FilterSidebar
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            selectedDistance={distance >= 999 ? null : distance}
            onDistanceChange={handleDistanceChange}
            selectedDate={dateFilter}
            onDateChange={handleDateChange}
            city={city || ""}
            region={region || ""}
            onRequestLocation={requestPreciseLocation}
            isLoggedIn={!!currentUserId}
          />

          {/* ── Center: Listings ── */}
          <div className="flex-1 min-w-0">
            {loading || (distance < 999 && locationLoading) ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
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
                  <i
                    className="fa-solid fa-magnifying-glass text-3xl text-gray-300"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  No sales found nearby
                </h2>
                <p className="text-gray-500 mb-6">
                  Try expanding your distance or changing your search.
                </p>
                <button
                  onClick={() => {
                    setDistance(999);
                    setSelectedCategory("");
                    setDateFilter("");
                    setHasInteracted(true);
                  }}
                  className="px-6 py-2.5 bg-ys-800 text-white rounded-full font-semibold hover:bg-ys-900 transition"
                >
                  Show All Sales
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
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
                  <i
                    className="fa-solid fa-arrow-right text-sm"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            )}
          </div>

          {/* ── Right Sidebar: Saved Sales ── */}
          <SavedPanel
            userId={currentUserId}
            totalListingsNearby={listings.length}
          />
        </div>
      </div>

      {/* ══════════ TRENDING + BELOW (centered container) ══════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <TrendingSection />
        <CategoryGrid />

        {/* Route Planner CTA */}
        <section className="mt-12 bg-gradient-to-r from-ys-50 to-emerald-50 border border-ys-200 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-14 h-14 bg-ys-100 rounded-2xl flex items-center justify-center shrink-0">
              <i
                className="fa-solid fa-route text-2xl text-ys-700"
                aria-hidden="true"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Plan Your Route
              </h2>
              <p className="text-sm text-gray-600">
                Hit multiple sales in one trip. Map out the most efficient
                route and never miss a deal on your way.
              </p>
            </div>
            <Link
              href="/route-planner"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-ys-700 hover:bg-ys-800 text-white rounded-full font-semibold text-sm transition-all hover:shadow-lg shrink-0"
            >
              <i
                className="fa-solid fa-map-location-dot"
                aria-hidden="true"
              />
              Open Route Planner
            </Link>
          </div>
        </section>

        {/* Why Sellers Love YardShoppers */}
        <section className="mt-10 bg-gradient-to-br from-ys-50 via-white to-amber-50 border border-ys-200 rounded-3xl p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Why Sellers Love YardShoppers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <i
                  className="fa-solid fa-check text-lg text-green-600"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Free to Post</h3>
              <p className="text-sm text-gray-500">
                List your yard sale in under 2 minutes — no fees, no catch.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <i
                  className="fa-solid fa-rocket text-lg text-amber-600"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">
                Boost for More Eyes
              </h3>
              <p className="text-sm text-gray-500">
                Get up to 25x more views with optional boost tiers starting
                at just $1.99.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <i
                  className="fa-solid fa-map-location-dot text-lg text-blue-600"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">
                Route Planner Ready
              </h3>
              <p className="text-sm text-gray-500">
                Buyers plan trips around your sale — boosted listings get
                priority pins.
              </p>
            </div>
          </div>
          <div className="text-center">
            <Link
              href="/post"
              className="inline-flex items-center gap-2 px-8 py-3 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-bold transition-all hover:shadow-lg"
            >
              <i
                className="fa-solid fa-plus text-sm"
                aria-hidden="true"
              />
              Post Your Yard Sale — Free
            </Link>
          </div>
        </section>

        {/* How YardShoppers Works */}
        <section className="mt-16 mb-8" id="how-it-works">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            How YardShoppers Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              {
                icon: "fa-magnifying-glass",
                title: "Search",
                desc: "Find yard sales near you by location, category, or keyword.",
              },
              {
                icon: "fa-heart",
                title: "Save",
                desc: "Save your favorite listings and plan your yard sale route.",
              },
              {
                icon: "fa-map-location-dot",
                title: "Visit",
                desc: "Get directions and head out to find amazing deals!",
              },
            ].map((step) => (
              <div key={step.title} className="text-center">
                <div className="w-14 h-14 bg-ys-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i
                    className={`fa-solid ${step.icon} text-xl text-ys-700`}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust Badges */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "fa-dollar-sign", label: "Free to Browse" },
            { icon: "fa-location-crosshairs", label: "Location Based" },
            { icon: "fa-bolt", label: "Instant Posting" },
            { icon: "fa-shield-halved", label: "Secure & Private" },
          ].map((trust) => (
            <div
              key={trust.label}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl"
            >
              <div className="w-9 h-9 bg-ys-100 rounded-lg flex items-center justify-center shrink-0">
                <i
                  className={`fa-solid ${trust.icon} text-sm text-ys-700`}
                  aria-hidden="true"
                />
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {trust.label}
              </span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
