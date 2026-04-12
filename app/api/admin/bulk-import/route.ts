import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// ─── Admin Lock ───────────────────────────────────────────────
const ADMIN_EMAIL = 'erwin-levi@outlook.com';

// ─── Types ────────────────────────────────────────────────────
interface BulkListing {
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  date: string;
  startTime: string;
  endTime: string;
  categorySlug: string;
  description: string;
  sourceUrl: string;
}

interface ListingResult {
  title: string;
  status: 'success' | 'failed' | 'duplicate';
  error?: string;
}

// ─── Geocoding (OpenStreetMap Nominatim — free, no key) ───────
async function geocode(
  address: string,
  city: string,
  state: string,
  zip: string
): Promise<{ lat: number; lng: number } | null> {
  const parts = [address, city, state, zip].filter(Boolean).join(', ');
  const query = encodeURIComponent(parts);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`,
      {
        headers: {
          'User-Agent': 'YardShoppers/1.0 (admin-bulk-import)',
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (e) {
    console.error('Geocoding failed for:', parts, e);
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Time Parser (server-side validation) ─────────────────────
function validateTime(input: string): string | null {
  if (!input || input.trim() === '') return null;
  if (/^\d{2}:\d{2}:\d{2}$/.test(input)) return input;
  if (/^\d{2}:\d{2}$/.test(input)) return `${input}:00`;
  return null;
}

// ─── POST Handler ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // ── 1. Authenticate via session cookie ─────────────────
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized — admin access required' },
        { status: 403 }
      );
    }

    // ── 2. Parse request body ──────────────────────────────
    const body = await request.json();
    const listings: BulkListing[] = body.listings;

    if (!listings || !Array.isArray(listings) || listings.length === 0) {
      return NextResponse.json(
        { error: 'No listings provided' },
        { status: 400 }
      );
    }

    if (listings.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 listings per import' },
        { status: 400 }
      );
    }

    // ── 3. Service role client for inserts ──────────────────
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── 4. Process each listing ────────────────────────────
    const results = {
      total: listings.length,
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: [] as string[],
      details: [] as ListingResult[],
    };

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];

      try {
        // ── Validate minimum fields ────────────────────────
        if (!listing.title || (!listing.city && !listing.address)) {
          results.failed++;
          results.errors.push(`#${i + 1} "${listing.title || 'Untitled'}": Missing title or location`);
          results.details.push({
            title: listing.title || 'Untitled',
            status: 'failed',
            error: 'Missing title or location',
          });
          continue;
        }

        // ── Check for duplicates ───────────────────────────
        let query = adminClient
          .from('listings')
          .select('id')
          .eq('title', listing.title)
          .eq('city', listing.city);

        if (listing.date) {
          query = query.eq('sale_date', listing.date);
        }

        const { data: existing } = await query.limit(1);

        if (existing && existing.length > 0) {
          results.duplicates++;
          results.details.push({
            title: listing.title,
            status: 'duplicate',
          });
          continue;
        }

        // ── Geocode address ────────────────────────────────
        let latitude: number | null = null;
        let longitude: number | null = null;

        if (listing.address && listing.city) {
          const coords = await geocode(
            listing.address,
            listing.city,
            listing.state,
            listing.zip
          );
          if (coords) {
            latitude = coords.lat;
            longitude = coords.lng;
          }
          // Nominatim rate limit: max 1 request per second
          await sleep(1100);
        }

        // ── Build description with source URL ──────────────
        let description = listing.description || '';
        if (listing.sourceUrl) {
          description += description ? '\n\n' : '';
          description += `Source: ${listing.sourceUrl}`;
        }

        // ── Insert into database ───────────────────────────
        const insertData: Record<string, any> = {
          user_id: user.id,
          title: listing.title.trim(),
          description: description.trim(),
          category: listing.categorySlug || 'other',
          street_address: listing.address?.trim() || '',
          city: listing.city?.trim() || '',
          state: listing.state?.trim() || '',
          zip_code: listing.zip?.trim() || '',
          status: 'active',
        };

        if (listing.date) {
          insertData.sale_date = listing.date;
        }

        const startTime = validateTime(listing.startTime);
        if (startTime) {
          insertData.start_time = startTime;
        }

        const endTime = validateTime(listing.endTime);
        if (endTime) {
          insertData.end_time = endTime;
        }

        if (latitude !== null && longitude !== null) {
          insertData.latitude = latitude;
          insertData.longitude = longitude;
        }

        const { error: insertError } = await adminClient
          .from('listings')
          .insert(insertData);

        if (insertError) {
          results.failed++;
          results.errors.push(`"${listing.title}": ${insertError.message}`);
          results.details.push({
            title: listing.title,
            status: 'failed',
            error: insertError.message,
          });
        } else {
          results.success++;
          results.details.push({
            title: listing.title,
            status: 'success',
          });
        }
      } catch (e: any) {
        results.failed++;
        results.errors.push(`"${listing.title}": ${e.message}`);
        results.details.push({
          title: listing.title,
          status: 'failed',
          error: e.message,
        });
      }
    }

    return NextResponse.json(results);
  } catch (e: any) {
    console.error('Bulk import error:', e);
    return NextResponse.json(
      { error: `Server error: ${e.message}` },
      { status: 500 }
    );
  }
}
