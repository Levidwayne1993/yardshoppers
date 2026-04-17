import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const rawCity = req.headers.get("x-vercel-ip-city");
    const region = req.headers.get("x-vercel-ip-country-region");
    const lat = req.headers.get("x-vercel-ip-latitude");
    const lng = req.headers.get("x-vercel-ip-longitude");

    if (lat && lng) {
      const city = rawCity ? decodeURIComponent(rawCity) : null;
      return NextResponse.json({
        city,
        region: region || null,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      });
    }

    // Fallback — ipapi.co over HTTPS (free 1,000 req/day)
    const res = await fetch("https://ipapi.co/json/", {
      headers: { "User-Agent": "YardShoppers/1.0 (https://yardshoppers.com)" },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ city: null, region: null, lat: null, lng: null });
    }

    const data = await res.json();
    return NextResponse.json({
      city: data.city || null,
      region: data.region || null,
      lat: data.latitude ?? null,
      lng: data.longitude ?? null,
    });
  } catch (err) {
    console.error("Location API error:", err);
    return NextResponse.json({ city: null, region: null, lat: null, lng: null });
  }
}
