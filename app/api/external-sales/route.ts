import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export var dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  var supabase = createClient(supabaseUrl, supabaseKey);
  var searchParams = request.nextUrl.searchParams;

  var source = searchParams.get("source");
  var category = searchParams.get("category");
  var search = searchParams.get("search");
  var lat = searchParams.get("lat");
  var lng = searchParams.get("lng");
  var page = parseInt(searchParams.get("page") || "1", 10);
  var limit = parseInt(searchParams.get("limit") || "24", 10);

  if (limit > 100) limit = 100;
  if (page < 1) page = 1;
  var offset = (page - 1) * limit;

  try {
    var query = supabase.from("external_sales").select("*", { count: "exact" });

    if (source) query = query.eq("source", source);
    if (category) query = query.ilike("category", "%" + category + "%");
    if (search) {
      query = query.or("title.ilike.%" + search + "%,description.ilike.%" + search + "%");
    }

    query = query.or("expires_at.is.null,expires_at.gt." + new Date().toISOString());
    query = query.order("collected_at", { ascending: false }).range(offset, offset + limit - 1);

    var { data, error, count } = await query;

    if (error) {
      console.error("External sales query error:", error);
      return NextResponse.json({ error: "Failed to fetch external sales" }, { status: 500 });
    }

    var listings: any[] = data || [];

    if (lat && lng) {
      var userLat = parseFloat(lat);
      var userLng = parseFloat(lng);
      if (!isNaN(userLat) && !isNaN(userLng)) {
        listings = listings.map(function (listing) {
          var dist: number | null = null;
          if (listing.latitude && listing.longitude) {
            dist = haversineDistance(userLat, userLng, listing.latitude, listing.longitude);
          }
          return { ...listing, distance: dist };
        });
        listings.sort(function (a, b) {
          if (a.distance != null && b.distance != null) return a.distance - b.distance;
          if (a.distance != null) return -1;
          if (b.distance != null) return 1;
          return 0;
        });
      }
    }

    return NextResponse.json({
      listings: listings,
      total: count || 0,
      page: page,
      limit: limit,
      hasMore: offset + limit < (count || 0),
    });
  } catch (err: any) {
    console.error("External sales API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  var R = 3958.8;
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
