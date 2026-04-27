// ============================================================
// PASTE INTO: components/route-planner/RouteMapClient.tsx
//
// FIX #6a — Grey / blank map tiles
//
// WHAT CHANGED:
// 1. Added CDN backup for Leaflet CSS — Next.js bundler
//    sometimes silently drops node_modules CSS in dynamic()
//    components. This guarantees the stylesheet loads.
// 2. Added <InvalidateSize /> — Leaflet calculates 0-height
//    when it mounts inside a flex layout before paint finishes.
//    This forces a re-measure + watches for container resizes.
// 3. Everything else is identical to the original file.
// ============================================================

'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import { RouteStop } from '@/lib/routeOptimizer';

/* ── Ensure Leaflet CSS is loaded (CDN backup) ──
   Next.js + Turbopack/webpack can silently fail to bundle
   CSS from node_modules in ssr:false dynamic imports.
   Injecting a <link> tag guarantees the stylesheet exists. */
if (typeof window !== 'undefined') {
  const LEAFLET_CSS = 'leaflet-css-cdn';
  if (!document.getElementById(LEAFLET_CSS)) {
    const link = document.createElement('link');
    link.id = LEAFLET_CSS;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    document.head.appendChild(link);
  }
}

/* ── Fix Leaflet default icon paths for Next.js ── */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/* ── NEW: Fix grey tiles ──
   Leaflet often sees 0×0 container size when it mounts inside
   a flex layout. invalidateSize() forces a re-measure once the
   browser has painted the final dimensions. ResizeObserver keeps
   it correct if the panel opens/closes or window resizes. */
function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    // First re-measure after initial paint
    const t = setTimeout(() => map.invalidateSize(), 250);
    // Ongoing re-measure on container resize (panel toggle, etc.)
    const ro = new ResizeObserver(() => map.invalidateSize());
    const container = map.getContainer();
    if (container) ro.observe(container);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [map]);
  return null;
}

/* ── Custom pin icons ── */
function createSaleIcon(
  isOnRoute: boolean,
  routeNumber?: number,
  isBoosted?: boolean,
  isSelected?: boolean
) {
  const bg = isSelected
    ? '#1565C0'
    : isOnRoute
    ? '#2D6A4F'
    : isBoosted
    ? '#F59E0B'
    : '#16A34A';
  const label =
    isOnRoute && routeNumber
      ? routeNumber.toString()
      : isBoosted
      ? '★'
      : '';
  const size = isSelected ? 38 : isOnRoute ? 34 : 28;
  const border = isSelected ? '4px solid #90CAF9' : '3px solid #fff';

  return L.divIcon({
    className: 'custom-sale-marker',
    html: `<div style="
      background:${bg};
      color:#fff;
      border:${border};
      border-radius:50%;
      width:${size}px;
      height:${size}px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:700;
      font-size:${isOnRoute ? '14px' : '11px'};
      box-shadow:0 2px 8px rgba(0,0,0,.35);
      font-family:Poppins,sans-serif;
      transition: all 0.2s ease;
    ">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

/* ── Auto-fit map bounds ── */
function FitBounds({
  listings,
  userLat,
  userLng,
  searchCenter,
}: {
  listings: RouteStop[];
  userLat?: number;
  userLng?: number;
  searchCenter?: { lat: number; lng: number };
}) {
  const map = useMap();

  useEffect(() => {
    // 1. Manual city/state search — fly there
    if (searchCenter) {
      map.flyTo([searchCenter.lat, searchCenter.lng], 12, { duration: 1.5 });
      return;
    }

    // 2. User location known — always center on them (~50mi radius)
    //    Zoom 9 ≈ 50 miles at US latitudes. Professional, local, not spammy.
    if (userLat && userLng) {
      map.setView([userLat, userLng], 9);
      return;
    }

    // 3. No user location — fit all listings (fallback only)
    if (listings.length > 0) {
      const bounds = L.latLngBounds(
        listings.map((l) => [l.latitude, l.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [listings, userLat, userLng, searchCenter, map]);

  return null;
}



/* ── Props ── */
interface RouteMapClientProps {
  listings: RouteStop[];
  routeStops: RouteStop[];
  userLat?: number;
  userLng?: number;
  searchCenter?: { lat: number; lng: number };
  onAddToRoute: (stop: RouteStop) => void;
  onRemoveFromRoute: (stopId: string) => void;
  onSelectListing?: (listing: RouteStop) => void;
}

/* ── Map Component ── */
export default function RouteMapClient({
  listings,
  routeStops,
  userLat,
  userLng,
  searchCenter,
  onAddToRoute,
  onRemoveFromRoute,
  onSelectListing,
}: RouteMapClientProps) {
  const routeStopIds = new Set(routeStops.map((s) => s.id));

  // Build polyline from user → stop 1 → stop 2 → …
  const routeCoords: [number, number][] = [];
  if (userLat && userLng && routeStops.length > 0) {
    routeCoords.push([userLat, userLng]);
  }
  routeStops.forEach((s) => routeCoords.push([s.latitude, s.longitude]));

  const center: [number, number] =
    userLat && userLng ? [userLat, userLng] : [39.8283, -98.5795];

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="w-full h-full"
      style={{ zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* ★ NEW — fixes grey tiles in flex layouts */}
      <InvalidateSize />

      <FitBounds
        listings={listings}
        userLat={userLat}
        userLng={userLng}
        searchCenter={searchCenter}
      />

      {/* User location blue dot */}
      {userLat && userLng && (
        <CircleMarker
          center={[userLat, userLng]}
          radius={10}
          pathOptions={{
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.4,
            weight: 3,
          }}
        />
      )}

      {/* Sale pins */}
      {listings.map((listing) => {
        const isOnRoute = routeStopIds.has(listing.id);
        const routeIdx = routeStops.findIndex((s) => s.id === listing.id);

        return (
          <Marker
            key={listing.id}
            position={[listing.latitude, listing.longitude]}
            icon={createSaleIcon(
              isOnRoute,
              routeIdx >= 0 ? routeIdx + 1 : undefined,
              listing.is_boosted,
              false
            )}
            eventHandlers={{
              click: () => {
                if (onSelectListing) {
                  onSelectListing(listing);
                }
              },
            }}
          >
            <Popup maxWidth={280} minWidth={220}>
              <div style={{ fontFamily: 'Poppins, sans-serif' }}>
                {listing.photo_url && (
                  <img
                    src={listing.photo_url}
                    alt={listing.title}
                    style={{
                      width: '100%',
                      height: '110px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '8px',
                    }}
                  />
                )}
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '15px',
                    color: '#1f2937',
                    marginBottom: '4px',
                  }}
                >
                  {listing.title}
                </div>
                <div
                  style={{
                    color: '#6b7280',
                    fontSize: '12px',
                    marginTop: '4px',
                  }}
                >
                  📍 {listing.address}, {listing.city}, {listing.state}
                </div>
                {listing.sale_time_start && (
                  <div
                    style={{
                      color: '#6b7280',
                      fontSize: '12px',
                      marginTop: '2px',
                    }}
                  >
                    🕐 {listing.sale_time_start} – {listing.sale_time_end}
                  </div>
                )}
                {listing.is_boosted && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      padding: '2px 8px',
                      background: '#FEF3C7',
                      color: '#B45309',
                      fontSize: '11px',
                      borderRadius: '9999px',
                      fontWeight: 600,
                    }}
                  >
                    ⚡ Boosted
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    isOnRoute
                      ? onRemoveFromRoute(listing.id)
                      : onAddToRoute(listing);
                  }}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif',
                    background: isOnRoute ? '#FEF2F2' : '#16A34A',
                    color: isOnRoute ? '#DC2626' : '#fff',
                  }}
                >
                  {isOnRoute ? '✕ Remove from Route' : '＋ Add to Route'}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Route line */}
      {routeCoords.length >= 2 && (
        <Polyline
          positions={routeCoords}
          pathOptions={{
            color: '#2D6A4F',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 6',
          }}
        />
      )}
    </MapContainer>
  );
}
