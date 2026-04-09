"use client";

import { useEffect, useState, useCallback } from "react";

interface LocationState {
  city: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  loading: boolean;
  precise: boolean;
}

const CACHE_KEY = "ys_location";
const CACHE_TTL = 30 * 60 * 1000; // 30 min

function getCached(): LocationState | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return { ...parsed, loading: false };
  } catch {
    return null;
  }
}

function setCache(state: LocationState) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...state, ts: Date.now() })
    );
  } catch {}
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    city: null,
    region: null,
    lat: null,
    lng: null,
    loading: true,
    precise: false,
  });

  // Step 1: On mount, use cached or IP-based location (no prompt)
  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setLocation(cached);
      return;
    }

    async function fetchIPLocation() {
      try {
        const res = await fetch("/api/location");
        if (!res.ok) throw new Error("Location API failed");
        const data = await res.json();
        const state: LocationState = {
          city: data.city || null,
          region: data.region || null,
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          loading: false,
          precise: false,
        };
        setLocation(state);
        setCache(state);
      } catch {
        setLocation((prev) => ({ ...prev, loading: false }));
      }
    }

    fetchIPLocation();
  }, []);

  // Step 2: Call this to upgrade to GPS (triggers browser prompt)
  const requestPreciseLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let city: string | null = null;
        let region: string | null = null;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                "User-Agent": "YardShoppers/1.0 (https://yardshoppers.com)",
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            city = data.address?.city || data.address?.town || null;
            region = data.address?.state || null;
          }
        } catch {}

        const state: LocationState = {
          city,
          region,
          lat: latitude,
          lng: longitude,
          loading: false,
          precise: true,
        };
        setLocation(state);
        setCache(state);
      },
      () => {
        // User denied — keep IP-based location, no error
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  return { ...location, requestPreciseLocation };
}
