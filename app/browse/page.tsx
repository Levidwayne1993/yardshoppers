// ============================================================
// FILE: app/browse/page.tsx
// PLACE AT: app/browse/page.tsx  (REPLACE your existing file)
// ROOT CAUSE FIX:
//   Both Supabase queries used .limit(25000) — fetching up to
//   50,000 rows before anything rendered. That's the 45-second wait.
//
// CHANGES:
//   1. DB_PAGE_SIZE = 200 — initial fetch grabs 200 per source
//      (was 25,000 per source = 50,000 total!)
//   2. Separate count query for total listings (so SavedPanel
//      still shows "13,575 Near You Active listings" accurately)
//   3. "Load More" now has two modes:
//      a) Show next 24 from already-loaded data (instant)
//      b) When loaded data runs out, fetch next 200 from DB
//   4. Everything else is IDENTICAL to your current file
// ============================================================

"use client";

import { useEffect, useState, Suspense, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import ListingCard from "@/components/ListingCard";
import FilterSidebar, { matchesDateFilter } from "@/components/FilterSidebar";
import SavedPanel from "@/components/SavedPanel";
import JsonLd from "@/components/JsonLd";
import { useLocation } from "@/lib/useLocation";
import { useDebounce } from "@/lib/useDebounce";
import { usePersistedState } from "@/lib/usePersistedState";
import { resolveStateAbbreviation } from "@/lib/stateMap";
import { cities } from "@/lib/cities";
import {
  generateCollectionPageSchema,
  generateSearchResultsPageSchema,
} from "@/lib/seo-signals";
import { UnifiedListing } from "@/types/external";

const supabase = createClient();

// ── DISPLAY: How many cards to show per "page" on screen ──
const ITEMS_PER_PAGE = 24;

// ── DATABASE: How many rows to fetch per Supabase call per source ──
// Was 25,000 — that's what caused the 45-second load!
const DB_PAGE_SIZE = 200;

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

function resolveLocationOverride(
  locationParam: string | null,
  latParam: string | null,
  lngParam: string | null
): { label: string; lat: number; lng: number } | null {
  if (locationParam && latParam && lngParam) {
    const parsedLat = parseFloat(latParam);
    const parsedLng = parseFloat(lngParam);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      return { label: locationParam, lat: parsedLat, lng: parsedLng };
    }
  }

  if (locationParam) {
    const parts = locationParam.split(",").map((s) => s.trim());
    const cityName = parts[0];
    const stateCode = parts[1];
    const matchedCity = cities.find(
      (c) =>
        c.name.toLowerCase() === cityName.toLowerCase() &&
        (!stateCode ||
          c.stateCode.toLowerCase() === stateCode.toLowerCase())
    );
    if (matchedCity) {
      return {
        label: locationParam,
        lat: matchedCity.lat,
        lng: matchedCity.lng,
      };
    }
  }

  return null;
}

function BrowseContent() {
  const searchParams = useSearchParams();

  const {
    city,
    region,
    lat,
    lng,
    loading: locationLoading,
    requestPreciseLocation,
  } = useLocation();

  const locationParam = searchParams.get("location");
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");

  const [locationOverride, setLocationOverride] = useState<{
    label: string;
    lat: number;
    lng: number;
  } | null>(() =>
    resolveLocationOverride(locationParam, latParam, lngParam)
  );

  useEffect(() => {
    const resolved = resolveLocationOverride(
      locationParam,
      latParam,
      lngParam
    );
    if (resolved) {
      setLocationOverride(resolved);
    }
  }, [locationParam, latParam, lngParam]);

  const effectiveLat = locationOverride ? locationOverride.lat : lat;
  const effectiveLng = locationOverride ? locationOverride.lng : lng;
  const locationLabel = locationOverride
    ? locationOverride.label
    : city
    ? `${city}${region ? `, ${region}` : ""}`
    : "";
  const isLocationReady = locationOverride ? true : !locationLoading;
  const displayCity = locationOverride
    ? locationOverride.label.split(",")[0]?.trim() || ""
    : city || "";
  const displayRegion = locationOverride
    ? locationOverride.label.split(",")[1]?.trim() || ""
    : region || "";

  const initialCategory = searchParams.get("category");

  const [listings, setListings] = useState<UnifiedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(
    searchParams.get("search") || ""
  );
  const debouncedSearch = useDebounce(search, 300);

  // ── Persisted filters (survive page navigation) ──
  const [selectedCategory, setSelectedCategory] = usePersistedState(
    "ys-filter-category",
    ""
  );
  const [distance, setDistance] = usePersistedState(
    "ys-filter-distance",
    50
  );
  const [dateFilter, setDateFilter] = usePersistedState(
    "ys-filter-date",
    ""
  );

  // URL param category overrides persisted value
  useEffect(() => {
    if (initialCategory && initialCategory !== "All") {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // ── NEW: Server-side pagination tracking ──
  const [dbOffset, setDbOffset] = useState(0);
  const [hasMoreInDB, setHasMoreInDB] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

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
    setVisibleCount(ITEMS_PER_PAGE);
    setDbOffset(0);
    setHasMoreInDB(true);
    if (d < 999 && !locationOverride) {
      requestPreciseLocation();
    }
  }

  function handleCategoryChange(cat: string) {
    setSelectedCategory(cat);
    setVisibleCount(ITEMS_PER_PAGE);
    setDbOffset(0);
    setHasMoreInDB(true);
  }

  function handleDateChange(d: string) {
    setDateFilter(d);
    setVisibleCount(ITEMS_PER_PAGE);
    setDbOffset(0);
    setHasMoreInDB(true);
  }

  // ── Helper: Build queries with current filters ──
  const buildQueries = useCallback(
    (offset: number) => {
      // ── Internal listings query ──
      let userQuery = supabase
        .from("listings")
        .select("*, listing_photos(*)")
        .eq("is_shadowbanned", false);

      // ── External listings query ──
      let extQuery = supabase
        .from("external_sales")
        .select("*")
        .or(
          `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`
        );

      // ── Apply search filter to both ──
      if (debouncedSearch.trim()) {
        const term = `%${debouncedSearch.trim()}%`;
        const stateAbbr = resolveStateAbbreviation(
          debouncedSearch.trim()
        );
        let conditions = `title.ilike.${term},description.ilike.${term},city.ilike.${term},state.ilike.${term}`;
        if (stateAbbr) {
          conditions += `,state.ilike.%${stateAbbr}%`;
        }
        userQuery = userQuery.or(conditions);
        extQuery = extQuery.or(conditions);
      }

      // ── Apply category filter to both ──
      if (selectedCategory) {
        userQuery = userQuery.or(
          `category.eq.${selectedCategory},categories.cs.{${selectedCategory}}`
        );
        extQuery = extQuery.or(
          `category.eq.${selectedCategory},categories.cs.{${selectedCategory}}`
        );
      }

      // ── Apply distance filter to both ──
      if (
        distance < 999 &&
        effectiveLat &&
        effectiveLng &&
        !debouncedSearch.trim()
      ) {
        const deg = milesToDeg(distance);
        userQuery = userQuery
          .gte("latitude", effectiveLat - deg)
          .lte("latitude", effectiveLat + deg)
          .gte("longitude", effectiveLng - deg)
          .lte("longitude", effectiveLng + deg);
        extQuery = extQuery
          .gte("latitude", effectiveLat - deg)
          .lte("latitude", effectiveLat + deg)
          .gte("longitude", effectiveLng - deg)
          .lte("longitude", effectiveLng + deg);
      }

      // ── Sorting ──
      userQuery = userQuery
        .order("is_boosted", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      extQuery = extQuery.order("collected_at", { ascending: false });

      // ── PAGINATION: fetch DB_PAGE_SIZE rows starting at offset ──
      userQuery = userQuery.range(offset, offset + DB_PAGE_SIZE - 1);
      extQuery = extQuery.range(offset, offset + DB_PAGE_SIZE - 1);

      return { userQuery, extQuery };
    },
    [
      debouncedSearch,
      selectedCategory,
      distance,
      effectiveLat,
      effectiveLng,
    ]
  );

  // ── Helper: Parse raw DB rows into UnifiedListing[] ──
  function parseResults(
    userData: any[] | null,
    extData: any[] | null
  ): UnifiedListing[] {
    const results: UnifiedListing[] = [];

    if (userData) {
      for (const listing of userData) {
        results.push({
          id: listing.id,
          title: listing.title,
          description: listing.description,
          city: listing.city,
          state: listing.state,
          latitude: listing.latitude,
          longitude: listing.longitude,
          price: listing.price,
          sale_date: listing.sale_date,
          sale_time_start: listing.sale_time_start,
          sale_time_end: listing.sale_time_end,
          category: listing.category,
          categories: listing.categories,
          listing_photos: listing.listing_photos || [],
          user_id: listing.user_id,
          is_boosted: listing.is_boosted || false,
          boost_tier: listing.boost_tier,
          boost_expires_at: listing.boost_expires_at,
          boost_started_at: listing.boost_started_at,
          created_at: listing.created_at,
          is_external: false,
          source: "internal",
          source_url: undefined,
        });
      }
    }

    if (extData) {
      for (const ext of extData) {
        results.push({
          id: ext.id,
          title: ext.title,
          description: ext.description,
          city: ext.city,
          state: ext.state,
          latitude: ext.latitude,
          longitude: ext.longitude,
          price: ext.price,
          sale_date: ext.sale_date,
          sale_time_start: ext.sale_time_start,
          sale_time_end: ext.sale_time_end,
          category: ext.category,
          categories: ext.categories,
          listing_photos: (ext.photo_urls || []).map((url: string) => ({
            photo_url: url,
          })),
          user_id: null,
          is_boosted: false,
          boost_tier: null,
          boost_expires_at: null,
          boost_started_at: null,
          created_at: ext.created_at,
          is_external: false,
          source: "internal",
          source_url: undefined,
        });
      }
    }

    return results;
  }

  // ── Helper: Sort results by distance or newest ──
  function sortResults(results: UnifiedListing[]): UnifiedListing[] {
    const hasLocation = !!(effectiveLat && effectiveLng);
    const useNearestSort = hasLocation && !debouncedSearch.trim();

    const boosted = results.filter((l) => l.is_boosted);
    const nonBoosted = results.filter((l) => !l.is_boosted);

    if (useNearestSort) {
      const sortByDistance = (a: UnifiedListing, b: UnifiedListing) => {
        const distA =
          a.latitude && a.longitude
            ? getDistanceMiles(
                effectiveLat!,
                effectiveLng!,
                a.latitude,
                a.longitude
              )
            : Infinity;
        const distB =
          b.latitude && b.longitude
            ? getDistanceMiles(
                effectiveLat!,
                effectiveLng!,
                b.latitude,
                b.longitude
              )
            : Infinity;
        return distA - distB;
      };
      boosted.sort(sortByDistance);
      nonBoosted.sort(sortByDistance);
    } else {
      const sortByNewest = (a: UnifiedListing, b: UnifiedListing) => {
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      };
      boosted.sort(sortByNewest);
      nonBoosted.sort(sortByNewest);
    }

    return [...boosted, ...nonBoosted];
  }

  // ── INITIAL FETCH: Runs when filters change ──
  useEffect(() => {
    if (distance < 999 && (!effectiveLat || !effectiveLng)) return;

    async function fetchListings() {
      setLoading(true);
      setDbOffset(0);
      setHasMoreInDB(true);

      const { userQuery, extQuery } = buildQueries(0);

      // ── Fetch data + count in parallel ──
      const [userResult, extResult, userCount, extCount] =
        await Promise.all([
          userQuery,
          extQuery,
          // Separate count queries (fast — no data transfer)
          supabase
            .from("listings")
            .select("id", { count: "exact", head: true })
            .eq("is_shadowbanned", false),
          supabase
            .from("external_sales")
            .select("id", { count: "exact", head: true })
            .or(
              `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`
            ),
        ]);

      const results = parseResults(
        userResult.data,
        extResult.data
      );

      // ── Date filter (client-side) ──
      let filtered = results;
      if (dateFilter) {
        filtered = results.filter((l) =>
          matchesDateFilter(l.sale_date, dateFilter)
        );
      }

      const sorted = sortResults(filtered);

      // ── Track total count for SavedPanel ──
      const total = (userCount.count || 0) + (extCount.count || 0);
      setTotalCount(total);

      // ── Check if more data exists in DB ──
      const userFetched = userResult.data?.length || 0;
      const extFetched = extResult.data?.length || 0;
      setHasMoreInDB(
        userFetched >= DB_PAGE_SIZE || extFetched >= DB_PAGE_SIZE
      );
      setDbOffset(DB_PAGE_SIZE);

      setListings(sorted);
      setVisibleCount(ITEMS_PER_PAGE);
      setLoading(false);
    }

    fetchListings();
  }, [
    debouncedSearch,
    selectedCategory,
    dateFilter,
    distance,
    effectiveLat,
    effectiveLng,
  ]);

  // ── LOAD MORE FROM DB: Fetches next batch when user exhausts loaded data ──
  async function loadMoreFromDB() {
    if (loadingMore || !hasMoreInDB) return;
    setLoadingMore(true);

    const { userQuery, extQuery } = buildQueries(dbOffset);

    const [userResult, extResult] = await Promise.all([
      userQuery,
      extQuery,
    ]);

    const newResults = parseResults(userResult.data, extResult.data);

    // ── Date filter ──
    let filtered = newResults;
    if (dateFilter) {
      filtered = newResults.filter((l) =>
        matchesDateFilter(l.sale_date, dateFilter)
      );
    }

    // ── Merge with existing listings and re-sort ──
    const merged = sortResults([...listings, ...filtered]);
    setListings(merged);

    // ── Update pagination state ──
    const userFetched = userResult.data?.length || 0;
    const extFetched = extResult.data?.length || 0;
    setHasMoreInDB(
      userFetched >= DB_PAGE_SIZE || extFetched >= DB_PAGE_SIZE
    );
    setDbOffset((prev) => prev + DB_PAGE_SIZE);

    // ── Show the next page of results ──
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
    setLoadingMore(false);
  }

  // ── "Load More" handler: show more from loaded data, or fetch from DB ──
  function handleLoadMore() {
    if (visibleCount < listings.length) {
      // Still have loaded data to show
      setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
    } else if (hasMoreInDB) {
      // Need to fetch more from database
      loadMoreFromDB();
    }
  }

  const displayedListings = listings.slice(0, visibleCount);
  const hasMore = visibleCount < listings.length || hasMoreInDB;

  const hasFilters =
    debouncedSearch ||
    selectedCategory ||
    dateFilter ||
    distance < 999 ||
    locationOverride;

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
      {
        "@type": "ListItem",
        position: 2,
        name: "Browse Yard Sales",
        item: "https://www.yardshoppers.com/browse",
      },
    ],
  };

  const itemListSchema = useMemo(() => {
    if (listings.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Yard Sales Near You",
      description:
        "Browse yard sales, garage sales, and estate sales listed on YardShoppers.",
      numberOfItems: listings.length,
      itemListElement: listings.slice(0, 20).map((listing, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://www.yardshoppers.com/listing/${listing.id}`,
        name: listing.title,
        ...(listing.city && listing.state
          ? {
              item: {
                "@type": "Event",
                name: listing.title,
                url: `https://www.yardshoppers.com/listing/${listing.id}`,
                location: {
                  "@type": "Place",
                  name: `${listing.city}, ${listing.state}`,
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: listing.city,
                    addressRegion: listing.state,
                  },
                },
                ...(listing.sale_date
                  ? { startDate: listing.sale_date }
                  : {}),
              },
            }
          : {}),
      })),
    };
  }, [listings]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      {itemListSchema && <JsonLd data={itemListSchema} />}
      <JsonLd
        data={generateCollectionPageSchema(
          "Browse Yard Sales",
          "Find yard sales, garage sales, and estate sales near you on YardShoppers.",
          "https://www.yardshoppers.com/browse"
        )}
      />
      {debouncedSearch && (
        <JsonLd
          data={generateSearchResultsPageSchema(
            debouncedSearch,
            listings.length
          )}
        />
      )}

      {locationOverride && (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-center justify-between bg-ys-50 border border-ys-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <i
                className="fa-solid fa-location-dot text-ys-700"
                aria-hidden="true"
              />
              <span className="font-semibold text-ys-900">
                Browsing sales near {locationOverride.label}
              </span>
            </div>
            <button
              onClick={() => setLocationOverride(null)}
              className="text-sm text-ys-700 hover:text-ys-900 font-semibold transition flex items-center gap-1"
            >
              <i
                className="fa-solid fa-xmark text-xs"
                aria-hidden="true"
              />
              Use my location
            </button>
          </div>
        </div>
      )}

      {/* ══════════ 3-PANEL LAYOUT: Filter | Listings | Saved ══════════ */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* ── Left Sidebar: Filters ── */}
          <FilterSidebar
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            selectedDistance={distance >= 999 ? null : distance}
            onDistanceChange={handleDistanceChange}
            selectedDate={dateFilter}
            onDateChange={handleDateChange}
            city={displayCity}
            region={displayRegion}
            onRequestLocation={() => {
              setLocationOverride(null);
              requestPreciseLocation();
            }}
            isLoggedIn={!!currentUserId}
          />

          {/* ── Center: Listings ── */}
          <div className="flex-1 min-w-0">
            {/* Search bar */}
            <div className="mb-4">
              <div className="relative">
                <i
                  className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setVisibleCount(ITEMS_PER_PAGE);
                    setDbOffset(0);
                    setHasMoreInDB(true);
                  }}
                  placeholder="Search yard sales, cities, or states..."
                  aria-label="Search yard sales"
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300 focus:border-ys-400 transition"
                />
              </div>
            </div>

            {/* Route Planner CTA */}
            <Link href="/route-planner" className="block mb-5">
              <div className="bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#388E3C] rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition">
                    <i
                      className="fa-solid fa-globe text-white text-xl"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm sm:text-base">
                      Plan Your Yard Sale Route
                    </p>
                    <p className="text-white/75 text-xs sm:text-sm truncate">
                      Map multiple stops, optimize your drive, and never
                      miss a deal
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 bg-white text-[#2E7D32] px-4 py-2 rounded-lg text-sm font-bold group-hover:bg-green-50 transition hidden sm:flex items-center gap-2">
                  <i
                    className="fa-solid fa-map-location-dot"
                    aria-hidden="true"
                  />
                  Open Map
                </div>
                <div className="flex-shrink-0 sm:hidden w-9 h-9 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition">
                  <i
                    className="fa-solid fa-chevron-right text-white text-sm"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </Link>

            {/* Results summary */}
            {hasFilters && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {totalCount > listings.length
                    ? `Showing ${listings.length} of ${totalCount.toLocaleString()}`
                    : `${listings.length} result${
                        listings.length !== 1 ? "s" : ""
                      }`}{" "}
                  {locationLabel && distance < 999 && (
                    <span>
                      within {distance} mi of {locationLabel}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("");
                    setDateFilter("");
                    setDistance(50);
                    setLocationOverride(null);
                    setDbOffset(0);
                    setHasMoreInDB(true);
                  }}
                  className="text-sm text-ys-700 hover:text-ys-900 font-semibold transition"
                >
                  <i
                    className="fa-solid fa-xmark mr-1 text-xs"
                    aria-hidden="true"
                  />
                  Clear filters
                </button>
              </div>
            )}

            {/* Listings grid */}
            {loading || (distance < 999 && !isLocationReady) ? (
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
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <i
                    className="fa-solid fa-magnifying-glass text-3xl text-gray-300"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  No sales found
                </h2>
                <p className="text-gray-500 mb-6">
                  Try expanding your distance or adjusting your search.
                </p>
                <button
                  onClick={() => {
                    setDistance(999);
                    setSelectedCategory("");
                    setDateFilter("");
                  }}
                  className="px-6 py-2.5 bg-ys-800 text-white rounded-full font-semibold hover:bg-ys-900 transition"
                >
                  Show All Sales Nationwide
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                  {displayedListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-semibold transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-wait"
                    >
                      {loadingMore ? (
                        <>
                          <i
                            className="fa-solid fa-spinner fa-spin text-sm"
                            aria-hidden="true"
                          />
                          Loading...
                        </>
                      ) : visibleCount < listings.length ? (
                        <>
                          <i
                            className="fa-solid fa-chevron-down text-sm"
                            aria-hidden="true"
                          />
                          View More Sales (
                          {listings.length - visibleCount} loaded)
                        </>
                      ) : (
                        <>
                          <i
                            className="fa-solid fa-chevron-down text-sm"
                            aria-hidden="true"
                          />
                          Load More Sales
                        </>
                      )}
                    </button>
                  </div>
                )}

                {!hasMore && listings.length > ITEMS_PER_PAGE && (
                  <p className="text-center text-sm text-gray-400 mt-6">
                    Showing all {listings.length} listings
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── Right Sidebar: Saved Sales ── */}
          <SavedPanel
            userId={currentUserId}
            totalListingsNearby={totalCount || listings.length}
          />
        </div>
      </div>

      {/* ══════════ BOTTOM CTA (centered) ══════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#388E3C] rounded-2xl p-6 md:p-10 text-white text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            Plan Your Yard Sale Route
          </h2>
          <p className="text-white/75 mb-4 max-w-xl mx-auto text-sm md:text-base">
            Map multiple stops, optimize your drive, and never miss a deal.
          </p>
          <Link
            href="/route-planner"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#2E7D32] rounded-xl font-bold hover:bg-green-50 transition-colors"
          >
            <i
              className="fa-solid fa-route"
              aria-hidden="true"
            />
            Open Route Planner
          </Link>
        </div>
      </section>
    </>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          <i
            className="fa-solid fa-spinner fa-spin mr-2"
            aria-hidden="true"
          />
          Loading...
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
