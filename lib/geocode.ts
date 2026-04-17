interface GeocodeResult {
  lat: number;
  lng: number;
  city: string | null;
  state: string | null;
}

export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&countrycodes=us&addressdetails=1`,
      {
        headers: {
          "User-Agent": "YardShoppers/1.0",
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length === 0) return null;

    const result = data[0];
    const addr = result.address || {};

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      city:
        addr.city ||
        addr.town ||
        addr.village ||
        addr.hamlet ||
        addr.county ||
        null,
      state: addr.state || null,
    };
  } catch {
    return null;
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ city: string | null; state: string | null }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "YardShoppers/1.0",
        },
      }
    );

    if (!res.ok) return { city: null, state: null };

    const data = await res.json();
    const addr = data.address || {};

    return {
      city:
        addr.city ||
        addr.town ||
        addr.village ||
        addr.hamlet ||
        addr.county ||
        null,
      state: addr.state || null,
    };
  } catch {
    return { city: null, state: null };
  }
}
