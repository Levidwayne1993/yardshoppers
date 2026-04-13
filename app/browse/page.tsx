"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import ListingCard from "@/components/ListingCard";
import DistanceSelector from "@/components/DistanceSelector";
import JsonLd from "@/components/JsonLd";
import { useLocation } from "@/lib/useLocation";
import { useDebounce } from "@/lib/useDebounce";
import { cities } from "@/lib/cities";
import { generateCollectionPageSchema, generateSearchResultsPageSchema } from "@/lib/seo-signals";
import { UnifiedListing } from "@/types/external";

const supabase = createClient();

const ITEMS_PER_PAGE = 24;

const CATEGORIES = [
  "Furniture", "Electronics", "Clothing", "Toys & Games", "Tools",
  "Kitchen", "Sports", "Books", "Antiques", "Garden", "Baby & Kids",
  "Vehicles", "Free Stuff",
];

const SOURCE_FILTERS = [
  { key: "all", label: "All Sales", icon: "fa-solid fa-layer-group" },
  { key: "internal", label: "User Posted", icon: "fa-solid fa-user" },
  { key: "external", label: "External", icon: "fa-solid fa-arrow-up-right-from-square" },
] as const;

type SourceFilter = "all" | "internal" | "external";

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
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
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
        (!stateCode || c.stateCode.toLowerCase() === stateCode.toLowerCase())
    );
    if (matchedCity) {
      return { label: locationParam, lat: matchedCity.lat, lng: matchedCity.lng };
    }
  }

  return null;
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const { city, region, lat, lng, loading: locationLoading, requestPreciseLocation } = useLocation();

  const locationParam = searchParams.get("location");
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");

  const [locationOverride, setLocationOverride] = useState<{
    label: string;
    lat: number;
    lng: number;
  } | null>(() => resolveLocationOverride(locationParam, latParam, lngParam));

  useEffect(() => {
    const resolved = resolveLocationOverride(locationParam, latParam, lngParam);
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

  const initialCategory = searchParams.get("category");
  const [listings, setListings] = useState<UnifiedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory && initialCategory !== "All" ? [initialCategory] : []
  );
  const [sort, setSort] = useState("nearest");
  const [distance, setDistance] = useState(50);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    }
    getUser();
  }, []);

  function handleDistanceChange(value: number) {
    setDistance(value);
    setVisibleCount(ITEMS_PER_PAGE);
    if (value < 999 && !locationOverride) {
      requestPreciseLocation();
    }
  }

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setVisibleCount(ITEMS_PER_PAGE);
  }

  function clearCategories() {
    setSelectedCategories([]);
    setVisibleCount(ITEMS_PER_PAGE);
  }

  useEffect(() => {
    if (distance < 999 && (!effectiveLat || !effectiveLng)) return;

    async function fetchListings() {
      setLoading(true);

      const results: UnifiedListing[] = [];

      // Fetch internal listings
      if (sourceFilter === "all" || sourceFilter === "internal") {
        let query = supabase.from("listings").select("*, listing_photos(*)");

        if (debouncedSearch.trim()) {
          const term = `%${debouncedSearch.trim()}%`;
          query = query.or(
            `title.ilike.${term},description.ilike.${term},city.ilike.${term}`
          );
        }

        if (selectedCategories.length > 0) {
          const orClauses = selectedCategories
            .map((cat) => `category.eq.${cat},categories.cs.{${cat}}`)
            .join(",");
          query = query.or(orClauses);
        }

        if (distance < 999 && effectiveLat && effectiveLng) {
          const deg = milesToDeg(distance);
          query = query
            .gte("latitude", effectiveLat - deg)
            .lte("latitude", effectiveLat + deg)
            .gte("longitude", effectiveLng - deg)
            .lte("longitude", effectiveLng + deg);
        }

        query = query
          .order("is_boosted", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: sort === "oldest" });

        query = query.limit(500);

        const { data } = await query;

        if (data) {
          for (const listing of data) {
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
              source: null,
              source_url: null,
            });
          }
        }
      }

      // Fetch external listings
      if (sourceFilter === "all" || sourceFilter === "external") {
        let extQuery = supabase
          .from("external_sales")
          .select("*")
          .gt("expires_at", new Date().toISOString());

        if (debouncedSearch.trim()) {
          const term = `%${debouncedSearch.trim()}%`;
          extQuery = extQuery.or(
            `title.ilike.${term},description.ilike.${term},city.ilike.${term}`
          );
        }

        if (selectedCategories.length > 0) {
          const orClauses = selectedCategories
            .map((cat) => `category.eq.${cat},categories.cs.{${cat}}`)
            .join(",");
          extQuery = extQuery.or(orClauses);
        }

        if (distance < 999 && effectiveLat && effectiveLng) {
          const deg = milesToDeg(distance);
          extQuery = extQuery
            .gte("latitude", effectiveLat - deg)
            .lte("latitude", effectiveLat + deg)
            .gte("longitude", effectiveLng - deg)
            .lte("longitude", effectiveLng + deg);
        }

        extQuery = extQuery
          .order("collected_at", { ascending: sort === "oldest" })
          .limit(500);

        const { data: extData } = await extQuery;

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
              is_external: true,
              source: ext.source,
              source_url: ext.source_url,
            });
          }
        }
      }

      // Sort merged results
      if (sort === "nearest" && effectiveLat && effectiveLng && results.length > 0) {
        const boosted = results.filter((l) => l.is_boosted);
        const nonBoosted = results.filter((l) => !l.is_boosted);

        const sortByDistance = (a: UnifiedListing, b: UnifiedListing) => {
          const distA =
            a.latitude && a.longitude
              ? getDistanceMiles(effectiveLat, effectiveLng, a.latitude, a.longitude)
              : Infinity;
          const distB =
            b.latitude && b.longitude
              ? getDistanceMiles(effectiveLat, effectiveLng, b.latitude, b.longitude)
              : Infinity;
          return distA - distB;
        };

        boosted.sort(sortByDistance);
        nonBoosted.sort(sortByDistance);

        setListings([...boosted, ...nonBoosted]);
      } else {
        setListings(results);
      }

      setVisibleCount(ITEMS_PER_PAGE);
      setLoading(false);
    }

    fetchListings();
  }, [debouncedSearch, selectedCategories, sort, distance, effectiveLat, effectiveLng, sourceFilter]);

  const displayedListings = listings.slice(0, visibleCount);
  const hasMore = visibleCount < listings.length;

  const internalCount = listings.filter((l) => !l.is_external).length;
  const externalCount = listings.filter((l) => l.is_external).length;

  const hasFilters = debouncedSearch || selectedCategories.length > 0 || distance < 999 || locationOverride || sourceFilter !== "all";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.yardshoppers.com",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Browse Yard Sales",
        "item": "https://www.yardshoppers.com/browse",
      },
    ],
  };

  const itemListSchema = useMemo(() => {
    if (listings.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Yard Sales Near You",
      "description": "Browse yard sales, garage sales, and estate sales listed on YardShoppers.",
      "numberOfItems": listings.length,
      "itemListElement": listings.slice(0, 20).map((listing, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": listing.is_external
          ? listing.source_url
          : `https://www.yardshoppers.com/listing/${listing.id}`,
        "name": listing.title,
        ...(listing.city && listing.state
          ? {
              "item": {
                "@type": "Event",
                "name": listing.title,
                "url": listing.is_external
                  ? listing.source_url
                  : `https://www.yardshoppers.com/listing/${listing.id}`,
                "location": {
                  "@type": "Place",
                  "name": `${listing.city}, ${listing.state}`,
                  "address": {
                    "@type": "PostalAddress",
                    "addressLocality": listing.city,
                    "addressRegion": listing.state,
                  },
                },
                ...(listing.sale_date
                  ? { "startDate": listing.sale_date }
                  : {}),
              },
            }
          : {}),
      })),
    };
  }, [listings]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <JsonLd data={breadcrumbSchema} />
      {itemListSchema && <JsonLd data={itemListSchema} />}
      <JsonLd data={generateCollectionPageSchema("Browse Yard Sales", "Find yard sales, garage sales, and estate sales near you on YardShoppers.", "https://www.yardshoppers.com/browse")} />
      {debouncedSearch && <JsonLd data={generateSearchResultsPageSchema(debouncedSearch, listings.length)} />}

      {locationOverride && (
        <div className="flex items-center justify-between bg-ys-50 border border-ys-200 rounded-xl px-4 py-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <i className="fa-solid fa-location-dot text-ys-700" aria-hidden="true" />
            <span className="font-semibold text-ys-900">
              Browsing sales near {locationOverride.label}
            </span>
          </div>
          <button
            onClick={() => setLocationOverride(null)}
            className="text-sm text-ys-700 hover:text-ys-900 font-semibold transition flex items-center gap-1"
          >
            <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
            Use my location
          </button>
        </div>
      )}

      <div className="sticky top-[65px] z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setVisibleCount(ITEMS_PER_PAGE); }}
                placeholder="Search yard sales..."
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300 focus:border-ys-400 transition"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort listings"
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-ys-300"
            >
              <option value="nearest">Nearest first</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          <DistanceSelector value={distance} onChange={handleDistanceChange} />

          {/* Source filter row */}
          <div className="flex gap-2 items-center">
            {SOURCE_FILTERS.map((sf) => (
              <button
                key={sf.key}
                onClick={() => { setSourceFilter(sf.key as SourceFilter); setVisibleCount(ITEMS_PER_PAGE); }}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  sourceFilter === sf.key
                    ? "bg-ys-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <i className={`${sf.icon} text-[10px]`} aria-hidden="true" />
                {sf.label}
                {sf.key === "internal" && !loading && (
                  <span className="text-[10px] opacity-75">({internalCount})</span>
                )}
                {sf.key === "external" && !loading && (
                  <span className="text-[10px] opacity-75">({externalCount})</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 items-center">
            <button
              onClick={clearCategories}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                selectedCategories.length === 0
                  ? "bg-ys-800 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  selectedCategories.includes(cat)
                    ? "bg-ys-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {selectedCategories.length > 1 && (
            <p className="text-xs text-gray-500">
              Filtering by {selectedCategories.length} categories
            </p>
          )}
        </div>
      </div>

      <Link href="/route-planner" className="block mb-5">
        <div className="bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#388E3C] rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all group cursor-pointer">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition">
              <i className="fa-solid fa-globe text-white text-xl" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm sm:text-base">Plan Your Yard Sale Route</p>
              <p className="text-white/75 text-xs sm:text-sm truncate">
                Map multiple stops, optimize your drive, and never miss a deal
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 bg-white text-[#2E7D32] px-4 py-2 rounded-lg text-sm font-bold group-hover:bg-green-50 transition hidden sm:flex items-center gap-2">
            <i className="fa-solid fa-map-location-dot" aria-hidden="true" />
            Open Map
          </div>
          <div className="flex-shrink-0 sm:hidden w-9 h-9 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition">
            <i className="fa-solid fa-chevron-right text-white text-sm" aria-hidden="true" />
          </div>
        </div>
      </Link>

      {hasFilters && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {listings.length} result{listings.length !== 1 ? "s" : ""} found
            {locationLabel && distance < 999 && (
              <span> within {distance} mi of {locationLabel}</span>
            )}
            {sourceFilter !== "all" && (
              <span> &middot; {sourceFilter === "internal" ? "User posted" : "External"} only</span>
            )}
          </p>
          <button
            onClick={() => {
              setSearch("");
              clearCategories();
              setDistance(50);
              setSort("nearest");
              setLocationOverride(null);
              setSourceFilter("all");
            }}
            className="text-sm text-ys-700 hover:text-ys-900 font-semibold transition"
          >
            <i className="fa-solid fa-xmark mr-1 text-xs" aria-hidden="true" />
            Clear filters
          </button>
        </div>
      )}

      {loading || (distance < 999 && !isLocationReady) ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {[...Array(8)].map((_, i) => (
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
            <i className="fa-solid fa-magnifying-glass text-3xl text-gray-300" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No sales found</h2>
          <p className="text-gray-500 mb-6">Try expanding your distance or adjusting your search.</p>
          <button
            onClick={() => {
              setDistance(999);
              setSort("newest");
              setSourceFilter("all");
            }}
            className="px-6 py-2.5 bg-ys-800 text-white rounded-full font-semibold hover:bg-ys-900 transition"
          >
            Show All Sales Nationwide
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
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
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                className="inline-flex items-center gap-2 px-8 py-3 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-semibold transition-all hover:shadow-lg"
              >
                <i className="fa-solid fa-chevron-down text-sm" aria-hidden="true" />
                Load More ({listings.length - visibleCount} remaining)
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
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          <i className="fa-solid fa-spinner fa-spin mr-2" aria-hidden="true" />
          Loading...
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}