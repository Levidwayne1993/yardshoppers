import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { collectAllSources } from '@/lib/collectors';
import {
  normalizeCollectorResult,
  deduplicateListings,
} from '@/lib/normalizers';
import type { NormalizedExternalListing } from '@/types/external';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = 50;

async function handleCollect(request: Request): Promise<NextResponse> {
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const { results } = await collectAllSources();

    let allListings: NormalizedExternalListing[] = [];
    const allErrors: string[] = [];

    for (const result of results) {
      const normalized = normalizeCollectorResult(result);
      allListings.push(...normalized);
      allErrors.push(...result.errors);
    }

    allListings = deduplicateListings(allListings);

    let upsertedCount = 0;
    let upsertErrors = 0;

    for (let i = 0; i < allListings.length; i += BATCH_SIZE) {
      const batch = allListings.slice(i, i + BATCH_SIZE);

      const rows = batch.map((listing) => ({
        source: listing.source,
        source_id: listing.source_id,
        source_url: listing.source_url,
        title: listing.title,
        description: listing.description,
        city: listing.city,
        state: listing.state,
        latitude: listing.latitude,
        longitude: listing.longitude,
        price: listing.price,
        sale_date: listing.sale_date,
        sale_time_start: listing.sale_time_start,
        sale_time_end: listing.sale_time_end,
        category: listing.category,
        categories: listing.categories,
        photo_urls: listing.photo_urls,
        address: listing.address,
        collected_at: listing.collected_at,
        expires_at: listing.expires_at,
        raw_data: listing.raw_data,
      }));

      const { error } = await supabaseAdmin
        .from('external_sales')
        .upsert(rows, { onConflict: 'source,source_id', ignoreDuplicates: false });

      if (error) {
        upsertErrors += batch.length;
        allErrors.push(`DB upsert batch ${Math.floor(i / BATCH_SIZE)}: ${error.message}`);
      } else {
        upsertedCount += batch.length;
      }
    }

    const { error: cleanupError } = await supabaseAdmin.rpc('cleanup_expired_external_sales');
    if (cleanupError) {
      allErrors.push(`Cleanup: ${cleanupError.message}`);
    }

    return NextResponse.json({
      success: true,
      collected: allListings.length,
      upserted: upsertedCount,
      upsertErrors,
      collectorErrors: allErrors,
      sources: results.map((r) => ({
        source: r.source,
        count: r.sales.length,
        errors: r.errors,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('External collection failed:', error);
    return NextResponse.json(
      { error: 'Collection failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleCollect(request);
}

export async function POST(request: Request) {
  return handleCollect(request);
}
