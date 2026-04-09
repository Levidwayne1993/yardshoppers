'use client';

import { useState, useEffect } from 'react';
import {
  RouteStop,
  TimeWarning,
  totalRouteDistance,
  generateGoogleMapsUrl,
  generateAppleMapsUrl,
  getTimeWarnings,
} from '@/lib/routeOptimizer';

interface RoutePanelProps {
  routeStops: RouteStop[];
  userLat?: number;
  userLng?: number;
  onRemove: (stopId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onOptimize: () => void;
  onClear: () => void;
}

export default function RoutePanel({
  routeStops,
  userLat,
  userLng,
  onRemove,
  onReorder,
  onOptimize,
  onClear,
}: RoutePanelProps) {
  const [warnings, setWarnings] = useState<TimeWarning[]>([]);

  /* Refresh time warnings every 60s */
  useEffect(() => {
    setWarnings(getTimeWarnings(routeStops));
    const iv = setInterval(() => setWarnings(getTimeWarnings(routeStops)), 60000);
    return () => clearInterval(iv);
  }, [routeStops]);

  const distance =
    userLat && userLng ? totalRouteDistance(routeStops, userLat, userLng) : 0;

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleStartGoogle = () => {
    if (routeStops.length === 0) return;
    window.open(generateGoogleMapsUrl(routeStops, userLat, userLng), '_blank');
  };

  const handleStartApple = () => {
    if (routeStops.length === 0) return;
    window.open(generateAppleMapsUrl(routeStops, userLat, userLng), '_blank');
  };

  const urgentWarnings = warnings.filter(
    (w) => w.type === 'ending-soon' || w.type === 'starting-soon'
  );

  /* ── Empty state ── */
  if (routeStops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-16 h-16 bg-ys-100 rounded-full flex items-center justify-center mb-4">
          <i className="fa-solid fa-route text-2xl text-ys-600"></i>
        </div>
        <h3 className="font-bold text-gray-800 text-lg mb-2">Plan Your Route</h3>
        <p className="text-gray-500 text-sm">
          Tap a yard sale pin on the map, then hit{' '}
          <strong className="text-ys-700">&quot;Add to Route&quot;</strong> to
          start building your driving route.
        </p>
      </div>
    );
  }

  /* ── Active route ── */
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-800 text-lg">
            <i className="fa-solid fa-route text-ys-600 mr-2"></i>
            Your Route
          </h3>
          <span className="text-sm text-gray-500">
            {routeStops.length} stop{routeStops.length !== 1 ? 's' : ''}
          </span>
        </div>
        {distance > 0 && (
          <p className="text-sm text-gray-500">
            <i className="fa-solid fa-car mr-1"></i>
            ~{distance.toFixed(1)} miles total
          </p>
        )}
      </div>

      {/* Time Warnings Banner */}
      {urgentWarnings.length > 0 && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 space-y-1">
          {urgentWarnings.map((w) => (
            <div key={w.stopId} className="flex items-start gap-2 text-sm">
              <i
                className={`fa-solid mt-0.5 ${
                  w.type === 'ending-soon'
                    ? 'fa-triangle-exclamation text-red-500'
                    : 'fa-bell text-amber-500'
                }`}
              ></i>
              <span
                className={
                  w.type === 'ending-soon' ? 'text-red-700' : 'text-amber-700'
                }
              >
                {w.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stops List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {routeStops.map((stop, index) => {
          const warning = warnings.find((w) => w.stopId === stop.id);
          const isEnded = warning?.type === 'ended';

          return (
            <div
              key={stop.id}
              className={`rounded-xl border p-3 transition ${
                isEnded
                  ? 'border-red-200 bg-red-50/60'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Numbered badge */}
                <div className="w-8 h-8 rounded-full bg-ys-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {index + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {stop.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {stop.address}, {stop.city}
                  </p>
                  {stop.sale_time_start && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {stop.sale_time_start} – {stop.sale_time_end}
                    </p>
                  )}
                  {warning && (
                    <p
                      className={`text-xs mt-1 font-medium ${
                        warning.type === 'ended' || warning.type === 'ending-soon'
                          ? 'text-red-500'
                          : warning.type === 'starting-soon'
                          ? 'text-amber-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {warning.type === 'ended' && (
                        <i className="fa-solid fa-circle-xmark mr-1"></i>
                      )}
                      {warning.type === 'ending-soon' && (
                        <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                      )}
                      {warning.type === 'starting-soon' && (
                        <i className="fa-solid fa-bell mr-1"></i>
                      )}
                      {warning.type === 'not-started' && (
                        <i className="fa-solid fa-clock mr-1"></i>
                      )}
                      {warning.message}
                    </p>
                  )}
                </div>

                {/* Reorder + remove */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {index > 0 && (
                    <button
                      onClick={() => onReorder(index, index - 1)}
                      className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xs"
                      aria-label="Move up"
                    >
                      <i className="fa-solid fa-chevron-up"></i>
                    </button>
                  )}
                  {index < routeStops.length - 1 && (
                    <button
                      onClick={() => onReorder(index, index + 1)}
                      className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xs"
                      aria-label="Move down"
                    >
                      <i className="fa-solid fa-chevron-down"></i>
                    </button>
                  )}
                  <button
                    onClick={() => onRemove(stop.id)}
                    className="w-7 h-7 rounded bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 text-xs"
                    aria-label="Remove stop"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-200 bg-white space-y-2">
        <div className="flex gap-2">
          <button
            onClick={onOptimize}
            className="flex-1 py-2.5 rounded-xl bg-ys-50 text-ys-700 font-semibold text-sm hover:bg-ys-100 transition"
          >
            <i className="fa-solid fa-wand-magic-sparkles mr-1"></i> Optimize
          </button>
          <button
            onClick={onClear}
            className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-semibold text-sm hover:bg-gray-200 transition"
          >
            Clear
          </button>
        </div>

        <button
          onClick={handleStartGoogle}
          className="w-full py-3 rounded-xl bg-ys-600 text-white font-bold text-base hover:bg-ys-700 transition shadow-lg"
        >
          <i className="fa-solid fa-diamond-turn-right mr-2"></i>
          Start Route in Google Maps
        </button>

        {isIOS && (
          <button
            onClick={handleStartApple}
            className="w-full py-3 rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-900 transition"
          >
            <i className="fa-brands fa-apple mr-2"></i>
            Open in Apple Maps
          </button>
        )}
      </div>
    </div>
  );
}
