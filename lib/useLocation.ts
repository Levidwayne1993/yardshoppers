"use client";

import { useState, useEffect } from "react";

interface UserLocation {
  city: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  precise: boolean;
}

const CACHE_KEY = "ys_user_location";
const CACHE_DURATION = 30 * 60 * 1000; // 30 min for precise

export function useLocation() {
  const [location, setLocation] = useState<UserLocation>({
    city: null,
    region: null,
    lat: null,
    lng: null,
    precise: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setLocation(data);
          setLoading(false);
          return;
        }
      } catch {}
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { "User-Agent": "YardShoppers/1.0" } }
            );
            const data = await res.json();
            const loc: UserLocation = {
              city:
                data.address?.city ||
                data.address?.town ||
                data.address?.village ||
                null,
              region: data.address?.state || null,
              lat: latitude,
              lng: longitude,
              precise: true,
            };
            setLocation(loc);
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ data: loc, timestamp: Date.now() })
            );
          } catch {
            const loc: UserLocation = {
              city: null,
              region: null,
              lat: latitude,
              lng: longitude,
              precise: true,
            };
            setLocation(loc);
          }
          setLoading(false);
        },
        async () => {
          // Denied or error — fall back to IP
          try {
            const res = await fetch("/api/location");
            const data = await res.json();
            const loc: UserLocation = { ...data, precise: false };
            setLocation(loc);
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ data: loc, timestamp: Date.now() })
            );
          } catch {}
          setLoading(false);
        },
        { timeout: 8000, enableHighAccuracy: false }
      );
    } else {
      fetch("/api/location")
        .then((res) => res.json())
        .then((data) => {
          const loc: UserLocation = { ...data, precise: false };
          setLocation(loc);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: loc, timestamp: Date.now() })
          );
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, []);

  return { ...location, loading };
}
