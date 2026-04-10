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
  const [panelOpen, setPanelOpen] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);

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
        const { data: allData, error } = await supabase
          .from("listings")
          .select("*, listing_photos(photo_url)")
          .eq("sale_date", selectedDate)
          .not("latitude", "is", null)
          .not("longitude", "is", null);

        if (allData && !error) data = allData;
      } else {
        // Saved mode — fetch saved_listings joined with listings
        const { data: savedData, error } = await supabase
          .from("saved_listings")
          .select("listing_id, listings(*, listing_photos(photo_url))")
          .eq("user_id", userId!);

        if (savedData && !error) {
          // Flatten and filter by date
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
        address: l.address || "",
        city: l.city || "",
        state: l.state || "",
        latitude: parseFloat(l.latitude),
        longitude: parseFloat(l.longitude),
        sale_date: l.sale_date,
        sale_time_start: l.sale_time_start || "",
        sale_time_end: l.sale_time_end || "",
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
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setRouteStops([]);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* ── Date Bar + View Toggle ── */}
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

        {/* Row 2: All / Saved Toggle */}
        <div className="flex items-center gap-2">
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
              onAddToRoute={addToRoute}
              onRemoveFromRoute={removeFromRoute}
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
          />
        </div>
      </div>
    </div>
  );
}
