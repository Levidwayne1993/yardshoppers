"use client";

import { useState, useEffect } from "react";

interface UserLocation {
  city: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
}

const CACHE_KEY = "ys_user_location";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export function useLocation() {
  const [location, setLocation] = useState<UserLocation>({
    city: null,
    region: null,
    lat: null,
    lng: null,
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

    fetch("/api/location")
      .then((res) => res.json())
      .then((data) => {
        setLocation(data);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { ...location, loading };
}
