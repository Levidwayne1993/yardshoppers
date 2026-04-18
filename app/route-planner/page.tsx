// ============================================================
// PASTE INTO: app/route-planner/page.tsx (yardshoppers project)
//
// This is the CORRECTED FILE3 — restored from original working
// route planner (commit 0924519) + added external_sales query
// so aggregated listings show as map pins alongside user-posted.
//
// CHANGES FROM ORIGINAL:
// - "All Sales" view now fetches BOTH listings + external_sales
// - External sales mapped to same RouteStop shape
// - Pending route add checks external_sales too
// - No mention of "external", "Craigslist", or any source
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase-browser";
import { useLocation } from "@/lib/useLocation";
import RoutePanel from "@/components/route-planner/RoutePanel";
import { RouteStop, optimizeRoute } from "@/lib/routeOptimizer";

const RouteMapClient = dynamic(
  () => import("@/components/route-planner/RouteMapClient"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
        <i className="fa-solid fa-map text-4xl text-gray-300"></i>
      </div>
    ),
  }
);

type ViewMode = "all" | "saved";

export default function RoutePlannerPage() {
  const supabase = createClient();
  const { lat, lng } = useLocation();

  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [listings, setListings] = useState<RouteStop[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);

  /* ── City/State Search ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchCenter, setSearchCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchLabel, setSearchLabel] = useState<string | null>(null);

  /* ── Selected Listing (pin click → right panel preview) ── */
  const [selectedListing, setSelectedListing] = useState<RouteStop | null>(
    null
  );

  /* ── Get user on mount ── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  /* ── Fetch listings based on date + view mode ── */
  useEffect(() => {
    async function fetchListings() {
      setLoading(true);

      if (viewMode === "saved" && !userId) {
        setListings([]);
        setLoading(false);
        return;
      }

      let data: any[] = [];

      if (viewMode === "all") {
        // ── Fetch user-posted listings ──
        const { data: userPosted, error: upErr } = await supabase
          .from("listings")
          .select("*, listing_photos(photo_url)")
          .eq("sale_date", selectedDate)
          .not("latitude", "is", null)
          .not("longitude", "is", null);

        if (userPosted && !upErr) data = userPosted;

        // ── Fetch external (aggregated) listings ──
        const now = new Date().toISOString();
        const { data: extData, error: extErr } = await supabase
          .from("external_sales")
          .select("*")
          .eq("sale_date", selectedDate)
          .gt("expires_at", now)
          .not("latitude", "is", null)
          .not("longitude", "is", null);

        if (extData && !extErr) {
          const mapped = extData.map((e: any) => ({
            ...e,
            // Map external_sales fields to match listings shape
            sale_time_start: e.sale_time_start || "",
            sale_time_end: e.sale_time_end || "",
            listing_photos: e.photo_urls?.length
              ? e.photo_urls.map((url: string) => ({ photo_url: url }))
              : [],
          }));
          data = [...data, ...mapped];
        }
      } else {
        const { data: savedData, error } = await supabase
          .from("saved_listings")
          .select("listing_id, listings(*, listing_photos(photo_url))")
          .eq("user_id", userId!);

        if (savedData && !error) {
          data = savedData
            .map((s: any) => s.listings)
            .filter(
              (l: any) =>
                l &&
                l.sale_date === selectedDate &&
                l.latitude !== null &&
                l.longitude !== null
            );
        }
      }

      const mapped = data.map((l: any) => ({
        id: l.id,
        title: l.title,
        address: l.address || l.street_address || "",
        city: l.city || "",
        state: l.state || "",
        latitude: parseFloat(l.latitude),
        longitude: parseFloat(l.longitude),
        sale_date: l.sale_date,
        sale_time_start: l.sale_time_start || l.start_time || "",
        sale_time_end: l.sale_time_end || l.end_time || "",
        price: l.price || "",
        category: l.category || "",
        categories: l.categories || [],
        is_boosted: l.is_boosted || false,
        photo_url: l.listing_photos?.[0]?.photo_url || null,
      }));

      setListings(mapped);
      setLoading(false);
    }

    fetchListings();
  }, [selectedDate, viewMode, userId]);

  /* ── Fetch total saved count for badge ── */
  useEffect(() => {
    async function fetchSavedCount() {
      if (!userId) {
        setSavedCount(0);
        return;
      }
      const { count } = await supabase
        .from("saved_listings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      setSavedCount(count || 0);
    }
    fetchSavedCount();
  }, [userId]);

  /* ── Route actions ── */
  const addToRoute = useCallback((stop: RouteStop) => {
    setRouteStops((prev) => {
      if (prev.find((s) => s.id === stop.id)) return prev;
      return [...prev, stop];
    });
    setSelectedListing(null);
    setPanelOpen(true);
  }, []);

  const removeFromRoute = useCallback((stopId: string) => {
    setRouteStops((prev) => prev.filter((s) => s.id !== stopId));
  }, []);

  const reorderStops = useCallback((from: number, to: number) => {
    setRouteStops((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const optimizeStops = useCallback(() => {
    if (!lat || !lng) return;
    setRouteStops((prev) => optimizeRoute(prev, lat, lng));
  }, [lat, lng]);

  const clearRoute = useCallback(() => setRouteStops([]), []);

  /* ── Pin click → show in panel ── */
  const handleSelectListing = useCallback((listing: RouteStop) => {
    setSelectedListing(listing);
    setPanelOpen(true);
  }, []);

  const handleDismissSelection = useCallback(() => {
    setSelectedListing(null);
  }, []);

  /* ── Auto-add listing when returning from detail page ── */
  useEffect(() => {
    const checkPendingRoute = async () => {
      const pendingId = sessionStorage.getItem("ys-pending-route-add");
      if (!pendingId) return;
      sessionStorage.removeItem("ys-pending-route-add");

      // Try user-posted listings first
      let { data } = await supabase
        .from("listings")
        .select("*, listing_photos(photo_url)")
        .eq("id", pendingId)
        .single();

      // If not found, try external_sales
      if (!data) {
        const { data: extData } = await supabase
          .from("external_sales")
          .select("*")
          .eq("id", pendingId)
          .single();

        if (extData) {
          data = {
            ...extData,
            listing_photos: extData.photo_urls?.length
              ? extData.photo_urls.map((url: string) => ({ photo_url: url }))
              : [],
          };
        }
      }

      if (data && data.latitude && data.longitude) {
        addToRoute({
          id: data.id,
          title: data.title,
          address: data.address || data.street_address || "",
          city: data.city || "",
          state: data.state || "",
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          sale_date: data.sale_date,
          sale_time_start: data.sale_time_start || data.start_time || "",
          sale_time_end: data.sale_time_end || data.end_time || "",
          price: data.price || "",
          category: data.category || "",
          categories: data.categories || [],
          is_boosted: data.is_boosted || false,
          photo_url: data.listing_photos?.[0]?.photo_url || null,
        });
        setPanelOpen(true);
      }
    };

    checkPendingRoute();
    window.addEventListener("pageshow", checkPendingRoute);
    window.addEventListener("focus", checkPendingRoute);

    return () => {
      window.removeEventListener("pageshow", checkPendingRoute);
      window.removeEventListener("focus", checkPendingRoute);
    };
  }, [addToRoute]);

  /* ── City/State Search Handler ── */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery.trim()
        )}&format=json&countrycodes=us&limit=1`,
        {
          headers: { "User-Agent": "YardShoppers/1.0" },
        }
      );
      const results = await res.json();

      if (results && results.length > 0) {
        const { lat: rLat, lon: rLng, display_name } = results[0];
        setSearchCenter({ lat: parseFloat(rLat), lng: parseFloat(rLng) });
        const parts = display_name.split(",").map((s: string) => s.trim());
        setSearchLabel(parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : parts[0]);
      } else {
        setSearchLabel("Location not found");
        setTimeout(() => setSearchLabel(null), 3000);
      }
    } catch {
      setSearchLabel("Search failed");
      setTimeout(() => setSearchLabel(null), 3000);
    }

    setSearching(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchCenter(null);
    setSearchLabel(null);
  };

  /* ── Date helpers ── */
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const todayStr = fmt(new Date());
  const tomorrowStr = fmt(new Date(Date.now() + 86400000));

  const getNextDay = (dow: number) => {
    const d = new Date();
    const diff = (dow - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
    return fmt(d);
  };
  const satStr = getNextDay(6);
  const sunStr = getNextDay(0);

  const quickDates = [
    { label: "Today", value: todayStr },
    { label: "Tomorrow", value: tomorrowStr },
    ...(satStr !== todayStr && satStr !== tomorrowStr
      ? [{ label: "Sat", value: satStr }]
      : []),
    ...(sunStr !== todayStr && sunStr !== tomorrowStr
      ? [{ label: "Sun", value: sunStr }]
      : []),
  ];

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setRouteStops([]);
    setSelectedListing(null);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setRouteStops([]);
    setSelectedListing(null);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* ── Top Bar: Date, View Toggle, Search ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col gap-3 z-10">
        {/* Row 1: Date picker + quick picks */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-calendar-day text-ys-600"></i>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-ys-500 focus:border-ys-500 outline-none"
            />
          </div>

          <div className="flex gap-2">
            {quickDates.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleDateChange(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedDate === opt.value
                    ? "bg-ys-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Stats + mobile toggle */}
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            <span className="hidden sm:inline">
              {listings.length} sale{listings.length !== 1 ? "s" : ""} found
            </span>
            {routeStops.length > 0 && (
              <span className="bg-ys-100 text-ys-700 px-2 py-0.5 rounded-full font-semibold">
                {routeStops.length} in route
              </span>
            )}
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="lg:hidden w-10 h-10 rounded-full bg-ys-600 text-white flex items-center justify-center shadow-lg relative"
            >
              <i className="fa-solid fa-route"></i>
              {routeStops.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {routeStops.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: All / Saved Toggle + City/State Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange("all")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold transition ${
                viewMode === "all"
                  ? "bg-white text-[#2E7D32] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className="fa-solid fa-globe text-xs" aria-hidden="true" />
              All Sales
            </button>
            <button
              onClick={() => handleViewModeChange("saved")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold transition relative ${
                viewMode === "saved"
                  ? "bg-white text-[#2E7D32] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className="fa-solid fa-heart text-xs" aria-hidden="true" />
              Saved Sales
              {savedCount > 0 && (
                <span className="bg-[#FF6B35] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                  {savedCount > 99 ? "99+" : savedCount}
                </span>
              )}
            </button>
          </div>

          {/* City / State Search */}
          <div className="flex-1 flex items-center gap-2 min-w-[200px]">
            <div className="relative flex-1 max-w-sm">
              <i className="fa-solid fa-magnifying-glass-location absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search city or state..."
                className="w-full pl-9 pr-9 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ys-300 focus:border-ys-400 transition"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-1.5 bg-[#2E7D32] text-white rounded-lg text-sm font-semibold hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {searching ? (
                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
              ) : (
                <>
                  <i className="fa-solid fa-search mr-1.5 hidden sm:inline" aria-hidden="true" />
                  Go
                </>
              )}
            </button>
          </div>

          {/* Search result label */}
          {searchLabel && (
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-ys-50 text-ys-700 px-3 py-1 rounded-full font-medium">
                <i className="fa-solid fa-location-dot mr-1.5" aria-hidden="true" />
                {searchLabel}
              </span>
              <button
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>
          )}

          {viewMode === "saved" && !userId && (
            <a
              href="/login"
              className="text-sm text-[#2E7D32] font-semibold hover:underline ml-2"
            >
              Sign in to see saved sales
            </a>
          )}

          {viewMode === "saved" && userId && listings.length === 0 && !loading && (
            <span className="text-xs text-gray-400 ml-2">
              No saved sales on this date
            </span>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
              <div className="text-center">
                <i className="fa-solid fa-spinner fa-spin text-3xl text-ys-600 mb-2 block"></i>
                <p className="text-gray-400 text-sm">Loading sales...</p>
              </div>
            </div>
          ) : (
            <RouteMapClient
              listings={listings}
              routeStops={routeStops}
              userLat={lat || undefined}
              userLng={lng || undefined}
              searchCenter={searchCenter || undefined}
              onAddToRoute={addToRoute}
              onRemoveFromRoute={removeFromRoute}
              onSelectListing={handleSelectListing}
            />
          )}

          {/* Empty state overlay */}
          {!loading && listings.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-8 text-center max-w-sm pointer-events-auto">
                <div className="w-14 h-14 bg-ys-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i
                    className={`fa-solid ${
                      viewMode === "saved" ? "fa-heart" : "fa-map-pin"
                    } text-2xl text-ys-600`}
                  ></i>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">
                  {viewMode === "saved"
                    ? "No saved sales on this day"
                    : "No sales on this day"}
                </h3>
                <p className="text-gray-500 text-sm">
                  {viewMode === "saved"
                    ? "Save yard sales from the browse page, then come back here to plan your route!"
                    : "Try picking a different date — weekends usually have the most yard sales!"}
                </p>
                {viewMode === "saved" && (
                  <a
                    href="/browse"
                    className="inline-block mt-4 px-5 py-2 bg-[#2E7D32] text-white rounded-lg text-sm font-semibold hover:bg-green-800 transition"
                  >
                    <i className="fa-solid fa-magnifying-glass mr-1.5" aria-hidden="true" />
                    Browse Sales
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Route Panel — sidebar on desktop, slide-over on mobile */}
        <div
          className={`
            absolute lg:relative right-0 top-0 h-full z-[600]
            w-full sm:w-96 lg:w-[380px]
            bg-white border-l border-gray-200 shadow-xl lg:shadow-none
            transition-transform duration-300 ease-in-out
            ${panelOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          `}
        >
          <button
            onClick={() => setPanelOpen(false)}
            className="lg:hidden absolute top-3 left-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 z-10"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          <RoutePanel
            routeStops={routeStops}
            userLat={lat || undefined}
            userLng={lng || undefined}
            onRemove={removeFromRoute}
            onReorder={reorderStops}
            onOptimize={optimizeStops}
            onClear={clearRoute}
            selectedListing={selectedListing}
            onAddToRoute={addToRoute}
            onDismissSelection={handleDismissSelection}
          />
        </div>
      </div>
    </div>
  );
}
