import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");

    if (!address || address.trim().length < 2 || address.length > 200) {
      return NextResponse.json(
        { error: "Invalid address parameter" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address.trim()
      )}&limit=1`,
      {
        headers: {
          "User-Agent": "YardShoppers/1.0 (https://yardshoppers.com)",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data.length) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display_name: data[0].display_name,
    });
  } catch (err) {
    console.error("Geocode error:", err);
    return NextResponse.json(
      { error: "Geocoding failed" },
      { status: 500 }
    );
  }
}
