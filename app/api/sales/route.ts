import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UnifiedSaleListing {
  id: string;
  source: string;
  source_id: string;
  source_url: string;
  title: string;
  description: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  category: string | null;
  sale_date: string | null;
  sale_time_start: string | null;
  sale_time_end: string | null;
  photo_urls: string[];
  address: string | null;
  is_boosted: boolean;
  boost_tier: string | null;
  created_at: string;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const city = searchParams.get('city') || '';
    const state = searchParams.get('state') || '';
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const radius = parseFloat(searchParams.get('radius') || '50');
    const category = searchParams.get('category') || '';
    const source = searchParams.get('source') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    const results: UnifiedSaleListing[] = [];

    // INTERNAL LISTINGS
    if (!source || source === 'internal') {
      let internalQuery = supabase
        .from('listings')
        .select('*, listing_photos(url, position)')
        .eq('status', 'active')
        .order('is_boosted', { ascending: false })
        .order('created_at', { ascending: false });

      if (query) internalQuery = internalQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      if (city) internalQuery = internalQuery.ilike('city', `%${city}%`);
      if (state) internalQuery = internalQuery.ilike('state', `%${state}%`);
      if (category) internalQuery = internalQuery.eq('category', category);

      const { data: internalListings, error: internalError } = await internalQuery;
      if (internalError) console.error('Internal listings error:', internalError);

      if (internalListings) {
        for (const listing of internalListings) {
          const rawPhotos = listing.listing_photos as { url: string; position: number }[] | null;
          const photos = (rawPhotos || [])
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map((p) => p.url);

          results.push({
            id: listing.id,
            source: 'internal',
            source_id: listing.id,
            source_url: `https://www.yardshoppers.com/listing/${listing.id}`,
            title: listing.title,
            description: listing.description || null,
            city: listing.city || null,
            state: listing.state || null,
            latitude: listing.latitude ?? null,
            longitude: listing.longitude ?? null,
            price: listing.price ?? null,
            category: listing.category || null,
            sale_date: listing.sale_date || null,
            sale_time_start: listing.sale_time_start || null,
            sale_time_end: listing.sale_time_end || null,
            photo_urls: photos,
            address: listing.address || null,
            is_boosted: listing.is_boosted || false,
            boost_tier: listing.boost_tier || null,
            created_at: listing.created_at,
          });
        }
      }
    }

    // EXTERNAL LISTINGS
    if (!source || source !== 'internal') {
      let externalQuery = supabase
        .from('external_sales')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('collected_at', { ascending: false });

      if (query) externalQuery = externalQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      if (city) externalQuery = externalQuery.ilike('city', `%${city}%`);
      if (state) externalQuery = externalQuery.ilike('state', `%${state}%`);
      if (category) externalQuery = externalQuery.eq('category', category);
      if (source && source !== 'internal') externalQuery = externalQuery.eq('source', source);

      const { data: externalListings, error: externalError } = await externalQuery;
      if (externalError) console.error('External listings error:', externalError);

      if (externalListings) {
        for (const listing of externalListings) {
          results.push({
            id: listing.id,
            source: listing.source,
            source_id: listing.source_id,
            source_url: listing.source_url,
            title: listing.title,
            description: listing.description || null,
            city: listing.city || null,
            state: listing.state || null,
            latitude: listing.latitude ?? null,
            longitude: listing.longitude ?? null,
            price: listing.price ?? null,
            category: listing.category || null,
            sale_date: listing.sale_date || null,
            sale_time_start: listing.sale_time_start || null,
            sale_time_end: listing.sale_time_end || null,
            photo_urls: listing.photo_urls || [],
            address: listing.address || null,
            is_boosted: false,
            boost_tier: null,
            created_at: listing.created_at,
          });
        }
      }
    }

    // GEO FILTERING + SORTING
    let filteredResults = results;

    if (!isNaN(lat) && !isNaN(lng)) {
      filteredResults = results.filter((r) => {
        if (r.latitude === null || r.longitude === null) return true;
        return haversineDistance(lat, lng, r.latitude, r.longitude) <= radius;
      });
      filteredResults.sort((a, b) => {
        if (a.is_boosted && !b.is_boosted) return -1;
        if (!a.is_boosted && b.is_boosted) return 1;
        const distA = a.latitude !== null && a.longitude !== null
          ? haversineDistance(lat, lng, a.latitude, a.longitude) : Infinity;
        const distB = b.latitude !== null && b.longitude !== null
          ? haversineDistance(lat, lng, b.latitude, b.longitude) : Infinity;
        return distA - distB;
      });
    } else {
      filteredResults.sort((a, b) => {
        if (a.is_boosted && !b.is_boosted) return -1;
        if (!a.is_boosted && b.is_boosted) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    const paginatedResults = filteredResults.slice(offset, offset + limit);

    return NextResponse.json({
      sales: paginatedResults,
      total: filteredResults.length,
      page,
      limit,
      hasMore: offset + limit < filteredResults.length,
    });
  } catch (error) {
    console.error('Sales API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
