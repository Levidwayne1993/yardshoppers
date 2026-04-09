import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Try Vercel geo headers first (free, automatic on Vercel)
    const city = req.headers.get("x-vercel-ip-city");
    const region = req.headers.get("x-vercel-ip-country-region");
    const lat = req.headers.get("x-vercel-ip-latitude");
    const lng = req.headers.get("x-vercel-ip-longitude");

    if (lat && lng) {
      return NextResponse.json({
        city: city ? decodeURIComponent(city) : "Unknown",
        region: region || "Unknown",
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      });
    }

    // Fallback to HTTPS ip-api (secure endpoint)
    const res = await fetch(
      "https://pro.ip-api.com/json/?fields=city,regionName,lat,lon",
      { next: { revalidate: 300 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Could not determine location" },
        { status: 502 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      city: data.city || "Unknown",
      region: data.regionName || "Unknown",
      lat: data.lat,
      lng: data.lon,
    });
  } catch (err) {
    console.error("Location API error:", err);
    return NextResponse.json(
      { error: "Failed to detect location" },
      { status: 500 }
    );
  }
}
