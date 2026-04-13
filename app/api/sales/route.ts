import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const distance = searchParams.get("distance");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50"),
      100
    );
    const offset = parseInt(searchParams.get("offset") || "0");

    const results: Record<string, unknown>[] = [];

    // ---- INTERNAL LISTINGS ----
    if (!source || source === "internal") {
      let internalQuery = supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (search) {
        internalQuery = internalQuery.or(
          `title.ilike.%${search}%,description.ilike.%${search}%`
        );
      }
      if (category) {
        internalQuery = internalQuery.eq("category", category);
      }
      if (city) {
        internalQuery = internalQuery.ilike("city", `%${city}%`);
      }
      if (state) {
        internalQuery = internalQuery.eq("state", state);
      }

      const { data: internalData } = await internalQuery;

      if (internalData) {
        for (const item of internalData) {
          results.push({
            id: item.id,
            title: item.title,
            description: item.description,
            city: item.city,
            state: item.state,
            latitude: item.latitude,
            longitude: item.longitude,
            price: item.price,
            photo_urls: item.photo_urls || item.images || [],
            category: item.category,
            categories: item.categories || [item.category].filter(Boolean),
            source: "internal",
            source_url: null,
            created_at: item.created_at,
            address: item.address,
            sale_date: item.sale_date,
            boosted: item.boosted || false,
            boost_tier: item.boost_tier || null,
            user_id: item.user_id,
          });
        }
      }
    }

    // ---- EXTERNAL LISTINGS ----
    if (!source || source === "external") {
      let externalQuery = supabase
        .from("external_sales")
        .select("*")
        .order("collected_at", { ascending: false })
        .limit(limit);

      if (search) {
        externalQuery = externalQuery.or(
          `title.ilike.%${search}%,description.ilike.%${search}%`
        );
      }
      if (category) {
        externalQuery = externalQuery.eq("category", category);
      }
      if (city) {
        externalQuery = externalQuery.ilike("city", `%${city}%`);
      }
      if (state) {
        externalQuery = externalQuery.eq("state", state);
      }

      const { data: externalData } = await externalQuery;

      if (externalData) {
        for (const item of externalData) {
          results.push({
            id: item.id,
            title: item.title,
            description: item.description,
            city: item.city,
            state: item.state,
            latitude: item.latitude,
            longitude: item.longitude,
            price: item.price,
            photo_urls: item.photo_urls || [],
            category: item.category,
            categories: item.categories || [],
            source: item.source,
            source_url: item.source_url,
            created_at: item.created_at,
            address: item.address,
            sale_date: item.sale_date,
            boosted: false,
            boost_tier: null,
            user_id: null,
          });
        }
      }
    }

    // ---- DISTANCE FILTER (post-query) ----
    let filtered = results;
    if (lat && lng && distance) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxDist = parseFloat(distance);

      filtered = results.filter((item) => {
        const itemLat = item.latitude as number;
        const itemLng = item.longitude as number;
        if (!itemLat || !itemLng) return true; // include items with no coordinates
        const dist = haversine(userLat, userLng, itemLat, itemLng);
        return dist <= maxDist;
      });
    }

    // Sort: boosted first, then by date
    filtered.sort((a, b) => {
      if (a.boosted && !b.boosted) return -1;
      if (!a.boosted && b.boosted) return 1;
      return (
        new Date(b.created_at as string).getTime() -
        new Date(a.created_at as string).getTime()
      );
    });

    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      listings: paginated,
      total: filtered.length,
      limit,
      offset,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Haversine formula — returns distance in miles
function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
