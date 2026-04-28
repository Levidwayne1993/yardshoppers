// ============================================================
// app/api/admin/check-duplicates/route.ts
// Server-side duplicate scanning endpoint
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  checkAgainstExisting,
  checkIntraBatchDuplicates,
  type ParsedListing,
} from '@/lib/duplicate-detection';

export async function POST(request: NextRequest) {
  try {
    const { listings } = (await request.json()) as { listings: ParsedListing[] };

    if (!listings || !Array.isArray(listings) || listings.length === 0) {
      return NextResponse.json({ error: 'No listings provided' }, { status: 400 });
    }

    // ---- Supabase client ----
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Read-only context — safe to ignore
            }
          },
        },
      }
    );

    // ---- Verify admin ----
    const { data: { user } } = await supabase.auth.getUser();
    const adminEmails = ['levistocks93@gmail.com', 'admin@yardshoppers.com', 'erwin-levi@outlook.com', 'gary.w.erwin@gmail.com'];
    if (!user || !adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ---- Fetch existing listings scoped to matching cities ----
    const incomingCities = [...new Set(listings.map(l => l.city.trim()))];

    // Build case variants so we match regardless of DB casing
    const cityVariants = incomingCities.flatMap(c => [
      c,
      c.toLowerCase(),
      c.charAt(0).toUpperCase() + c.slice(1).toLowerCase(),
      c.toUpperCase(),
    ]);
    const uniqueVariants = [...new Set(cityVariants)];

    const { data: existingListings, error } = await supabase
      .from('listings')
      .select('id, title, description, address, city, state, zip_code, sale_date')
      .in('city', uniqueVariants)
      .limit(25000);
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to query existing listings' }, { status: 500 });
    }

    // ---- Run duplicate detection ----
    const results = listings.map(listing =>
      checkAgainstExisting(listing, existingListings || [])
    );

    const intraBatchDuplicates = checkIntraBatchDuplicates(listings);

    // ---- Summary stats ----
    const flagged = results.filter(r => r.status === 'flagged').length;
    const clear = results.filter(r => r.status === 'clear').length;
    const highRisk = results.filter(r => r.highestProbability >= 75).length;
    const mediumRisk = results.filter(r => r.highestProbability >= 40 && r.highestProbability < 75).length;
    const lowRisk = results.filter(r => r.highestProbability >= 20 && r.highestProbability < 40).length;

    return NextResponse.json({
      results,
      intraBatchDuplicates,
      summary: {
        total: listings.length,
        flagged,
        clear,
        highRisk,
        mediumRisk,
        lowRisk,
        intraBatchDuplicateCount: intraBatchDuplicates.length,
        existingListingsScanned: existingListings?.length || 0,
      },
    });
  } catch (err) {
    console.error('Duplicate check error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
