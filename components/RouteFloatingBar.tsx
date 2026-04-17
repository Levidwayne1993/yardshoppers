"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function RouteFloatingBarInner({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromRoute = searchParams.get("from") === "route-planner";

  if (!fromRoute) return null;

  const handleAddAndReturn = () => {
    sessionStorage.setItem("ys-pending-route-add", listingId);
    router.back();
  };

  const handleBackToRoute = () => {
    router.back();
  };

  return (
    <div className="fixed bottom-14 md:bottom-4 left-0 right-0 z-50 px-0 md:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#388E3C] md:rounded-2xl shadow-2xl px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-3 border-t border-green-400/20">
          {/* Left: Icon + context */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-route text-white text-lg" aria-hidden="true" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-white/60 text-[11px] font-medium uppercase tracking-wider">
                Route Planner
              </p>
              <p className="text-white font-semibold text-sm truncate max-w-[240px]">
                {listingTitle}
              </p>
            </div>
            <p className="text-white/80 text-sm font-medium sm:hidden truncate">
              Route Planner
            </p>
          </div>

          {/* Right: Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleBackToRoute}
              className="px-3 sm:px-4 py-2.5 rounded-xl text-white/90 hover:text-white text-sm font-medium hover:bg-white/10 transition flex items-center gap-1.5"
            >
              <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true" />
              <span className="hidden sm:inline">Back to Map</span>
              <span className="sm:hidden">Back</span>
            </button>
            <button
              onClick={handleAddAndReturn}
              className="px-4 sm:px-5 py-2.5 bg-white text-[#2E7D32] rounded-xl text-sm font-bold hover:bg-green-50 transition shadow-lg flex items-center gap-1.5"
            >
              <i className="fa-solid fa-plus text-xs" aria-hidden="true" />
              Add to Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RouteFloatingBar({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  return (
    <Suspense fallback={null}>
      <RouteFloatingBarInner listingId={listingId} listingTitle={listingTitle} />
    </Suspense>
  );
}
