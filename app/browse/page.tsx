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

const ITEMS_PER_PAGE = 24;
const DB_PAGE_SIZE = 200;
const DB_PAGE_SIZE_BOUNDED = 1000;

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

// ── STATE CENTROIDS ──
// When useLocation returns only a state (e.g. "WA") with no city or coords,
// we use these as fallback so bounding-box + distance sort still work.
const STATE_COORDS: Record<string, [number, number]> = {
  AL: [32.8067, -86.7911], AK: [61.3707, -152.4044], AZ: [33.7298, -111.4312],
  AR: [34.9697, -92.3731], CA: [36.1162, -119.6816], CO: [39.0598, -105.3111],
  CT: [41.5978, -72.7554], DE: [39.3185, -75.5071], FL: [27.7663, -81.6868],
  GA: [33.0406, -83.6431], HI: [21.0943, -157.4983], ID: [44.2405, -114.4788],
  IL: [40.3495, -88.9861], IN: [39.8494, -86.2583], IA: [42.0115, -93.2105],
  KS: [38.5266, -96.7265], KY: [37.6681, -84.6701], LA: [31.1695, -91.8678],
  ME: [44.6939, -69.3819], MD: [39.0639, -76.8021], MA: [42.2302, -71.5301],
  MI: [43.3266, -84.5361], MN: [45.6945, -93.9002], MS: [32.7416, -89.6787],
  MO: [38.4561, -92.2884], MT: [46.9219, -110.4544], NE: [41.1254, -98.2681],
  NV: [38.3135, -117.0554], NH: [43.4525, -71.5639], NJ: [40.2989, -74.5210],
  NM: [34.8405, -106.2485], NY: [42.1657, -74.9481], NC: [35.6301, -79.8064],
  ND: [47.5289, -99.7840], OH: [40.3888, -82.7649], OK: [35.5653, -96.9289],
  OR: [44.5720, -122.0709], PA: [40.5908, -77.2098], RI: [41.6809, -71.5118],
  SC: [33.8569, -80.9450], SD: [44.2998, -99.4388], TN: [35.7478, -86.6923],
  TX: [31.0545, -97.5635], UT: [40.1500, -111.8624], VT: [44.0459, -72.7107],
  VA: [37.7693, -78.1700], WA: [47.4009, -121.4905], WV: [38.4912, -80.9545],
  WI: [44.2685, -89.6165], WY: [42.7560, -107.3025], DC: [38.9072, -77.0369],
};

// Full state name to abbreviation for fallback
const STATE_ABBREV: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "district of columbia": "DC",
};

function normalizeState(raw: string): string {
  const s = (raw || "").trim();
  if (s.length === 2) return s.toUpperCase();
  return STATE_ABBREV[s.toLowerCase()] || s.toUpperCase().substring(0, 2);
}

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
    // Try state centroid if city not found
    if (stateCode) {
      const abbr = normalizeState(stateCode);
      if (STATE_COORDS[abbr]) {
        return {
          label: locationParam,
          lat: STATE_COORDS[abbr][0],
          lng: STATE_COORDS[abbr][1],
        };
      }
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

  // ── FALLBACK COORDINATE LOOKUP ──
  // useLocation often returns region="WA" (or "Washington") but city=null
  // and lat/lng=null from IP geolocation. This cascading fallback:
  //   1. Try city+state lookup in the cities table
  //   2. If no city, fall back to state centroid from STATE_COORDS
  // This ensures distance sorting ALWAYS works.
  const fallbackCoords = useMemo(() => {
    // Already have real coords from useLocation — no fallback needed
    if (lat && lng) return null;

    const regionAbbr = region
      ? resolveStateAbbreviation(region) || normalizeState(region)
      : "";

    // Try city-level lookup first
    if (city) {
      const match = cities.find(
        (c) =>
          c.name.toLowerCase() === city.toLowerCase() &&
          (!regionAbbr ||
            c.stateCode.toLowerCase() === regionAbbr.toLowerCase())
      );
      if (match) return { lat: match.lat, lng: match.lng };
    }

    // Fall back to state centroid — works even when city is empty
    if (regionAbbr && STATE_COORDS[regionAbbr]) {
      return {
        lat: STATE_COORDS[regionAbbr][0],
        lng: STATE_COORDS[regionAbbr][1],
      };
    }

    // Last resort: try the raw region string as a 2-letter code
    if (region) {
      const upper = region.trim().toUpperCase();
      if (upper.length === 2 && STATE_COORDS[upper]) {
        return { lat: STATE_COORDS[upper][0], lng: STATE_COORDS[upper][1] };
      }
    }

    return null;
  }, [city, region, lat, lng]);

  // Use fallback coords when real ones are missing
  const effectiveLat = locationOverride
    ? locationOverride.lat
    : lat || fallbackCoords?.lat || null;
  const effectiveLng = locationOverride
    ? locationOverride.lng
    : lng || fallbackCoords?.lng || null;

  const locationLabel = locationOverride
    ? locationOverride.label
    : city
    ? `${city}${region ? `, ${region}` : ""}`
    : region || "";

  const isLocationReady = locationOverride
    ? true
    : !locationLoading || !!(fallbackCoords);

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

  useEffect(() => {
    if (initialCategory && initialCategory !== "All") {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

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

  const isBounded =
    distance < 999 &&
    !!effectiveLat &&
    !!effectiveLng &&
    !debouncedSearch.trim();
  const effectivePageSize = isBounded ? DB_PAGE_SIZE_BOUNDED : DB_PAGE_SIZE;

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

  const buildQueries = useCallback(
    (offset: number) => {
      const now = new Date().toISOString();
      const today = new Date().toISOString().split("T")[0];

      let userQuery = supabase
        .from("listings")
        .select("*, listing_photos(*)")
        .eq("is_shadowbanned", false);

      let extQuery = supabase
        .from("external_sales")
        .select("*")
        .or(
          `expires_at.is.null,expires_at.gt.${now}`
        )
        // Filter out ended sales (sale_date in the past)
        .or(
          `sale_date.is.null,sale_date.gte.${today}`
        );

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

      if (selectedCategory) {
        userQuery = userQuery.or(
          `category.eq.${selectedCategory},categories.cs.{${selectedCategory}}`
        );
        extQuery = extQuery.or(
          `category.eq.${selectedCategory},categories.cs.{${selectedCategory}}`
        );
      }

      if (isBounded) {
        const deg = milesToDeg(distance);
        userQuery = userQuery
          .gte("latitude", effectiveLat! - deg)
          .lte("latitude", effectiveLat! + deg)
          .gte("longitude", effectiveLng! - deg)
          .lte("longitude", effectiveLng! + deg);
        extQuery = extQuery
          .gte("latitude", effectiveLat! - deg)
          .lte("latitude", effectiveLat! + deg)
          .gte("longitude", effectiveLng! - deg)
          .lte("longitude", effectiveLng! + deg);
      }

      userQuery = userQuery
        .order("is_boosted", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      extQuery = extQuery.order("collected_at", { ascending: false });

      userQuery = userQuery.range(offset, offset + effectivePageSize - 1);
      extQuery = extQuery.range(offset, offset + effectivePageSize - 1);

      return { userQuery, extQuery };
    },
    [
      debouncedSearch,
      selectedCategory,
      distance,
      effectiveLat,
      effectiveLng,
      isBounded,
      effectivePageSize,
    ]
  );

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

  useEffect(() => {
    // Only block if user explicitly picked a radius AND we truly have no coords
    if (distance < 999 && (!effectiveLat || !effectiveLng)) return;

    async function fetchListings() {
      setLoading(true);
      setDbOffset(0);
      setHasMoreInDB(true);

      const { userQuery, extQuery } = buildQueries(0);

      // Count queries also apply bounding box so "Near You" is accurate
      let userCountQuery = supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("is_shadowbanned", false);
      let extCountQuery = supabase
        .from("external_sales")
        .select("id", { count: "exact", head: true })
        .or(
          `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`
        )
        .or(
          `sale_date.is.null,sale_date.gte.${new Date().toISOString().split("T")[0]}`
        );

      if (isBounded) {
        const deg = milesToDeg(distance);
        userCountQuery = userCountQuery
          .gte("latitude", effectiveLat! - deg)
          .lte("latitude", effectiveLat! + deg)
          .gte("longitude", effectiveLng! - deg)
          .lte("longitude", effectiveLng! + deg);
        extCountQuery = extCountQuery
          .gte("latitude", effectiveLat! - deg)
          .lte("latitude", effectiveLat! + deg)
          .gte("longitude", effectiveLng! - deg)
          .lte("longitude", effectiveLng! + deg);
      }

      const [userResult, extResult, userCount, extCount] =
        await Promise.all([
          userQuery,
          extQuery,
          userCountQuery,
          extCountQuery,
        ]);

      const results = parseResults(userResult.data, extResult.data);

      let filtered = results;
      if (dateFilter) {
        filtered = results.filter((l) =>
          matchesDateFilter(l.sale_date, dateFilter)
        );
      }

      const sorted = sortResults(filtered);

      const total = (userCount.count || 0) + (extCount.count || 0);
      setTotalCount(total);

      const userFetched = userResult.data?.length || 0;
      const extFetched = extResult.data?.length || 0;
      setHasMoreInDB(
        userFetched >= effectivePageSize ||
          extFetched >= effectivePageSize
      );
      setDbOffset(effectivePageSize);

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

  async function loadMoreFromDB() {
    if (loadingMore || !hasMoreInDB) return;
    setLoadingMore(true);

    const { userQuery, extQuery } = buildQueries(dbOffset);
    const [userResult, extResult] = await Promise.all([
      userQuery,
      extQuery,
    ]);

    const newResults = parseResults(userResult.data, extResult.data);

    let filtered = newResults;
    if (dateFilter) {
      filtered = newResults.filter((l) =>
        matchesDateFilter(l.sale_date, dateFilter)
      );
    }

    const merged = sortResults([...listings, ...filtered]);
    setListings(merged);

    const userFetched = userResult.data?.length || 0;
    const extFetched = extResult.data?.length || 0;
    setHasMoreInDB(
      userFetched >= effectivePageSize ||
        extFetched >= effectivePageSize
    );
    setDbOffset((prev) => prev + effectivePageSize);

    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
    setLoadingMore(false);
  }

  function handleLoadMore() {
    if (visibleCount < listings.length) {
      setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
    } else if (hasMoreInDB) {
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

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
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

          <div className="flex-1 min-w-0">
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
                      Map multiple stops, optimize your drive, and never miss a
                      deal
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

          <SavedPanel
            userId={currentUserId}
            totalListingsNearby={totalCount || listings.length}
          />
        </div>
      </div>

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
            <i className="fa-solid fa-route" aria-hidden="true" />
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
