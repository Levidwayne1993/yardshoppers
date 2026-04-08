import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const city = req.headers.get("x-vercel-ip-city");
  const region = req.headers.get("x-vercel-ip-country-region");
  const lat = req.headers.get("x-vercel-ip-latitude");
  const lng = req.headers.get("x-vercel-ip-longitude");

  if (city && region) {
    return NextResponse.json({
      city: decodeURIComponent(city),
      region,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
    });
  }

  try {
    const res = await fetch("http://ip-api.com/json/?fields=city,regionName,lat,lon");
    const data = await res.json();
    return NextResponse.json({
      city: data.city || null,
      region: data.regionName || null,
      lat: data.lat || null,
      lng: data.lon || null,
    });
  } catch {
    return NextResponse.json({ city: null, region: null, lat: null, lng: null });
  }
}
