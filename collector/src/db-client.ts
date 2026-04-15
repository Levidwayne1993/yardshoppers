import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { NormalizedSale } from './types.js';

// ============================================
// SUPABASE CLIENT INIT
// ============================================

let supabase: SupabaseClient | null = null;

/**
 * Initialize and return the Supabase client.
 * Uses NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * from .env.local (or process.env).
 */
export function getSupabase(): SupabaseClient {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment'
    );
  }

  supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  return supabase;
}

// ============================================
// BATCH UPSERT
// ============================================

const BATCH_SIZE = 50;

/**
 * Upsert normalized listings into the external_sales table.
 * Uses source_id as the conflict column for deduplication.
 * Processes in batches of 50 to avoid payload limits.
 *
 * Returns { inserted: number, errors: string[] }
 */
export async function batchUpsert(
  listings: NormalizedSale[]
): Promise<{ inserted: number; errors: string[] }> {
  const db = getSupabase();
  let totalInserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < listings.length; i += BATCH_SIZE) {
    const batch = listings.slice(i, i + BATCH_SIZE);

    // Map to DB columns
    const rows = batch.map((sale) => ({
      source: sale.source,
      source_id: sale.source_id,
      source_url: sale.source_url,
      title: sale.title,
      description: sale.description,
      city: sale.city,
      state: sale.state,
      latitude: sale.latitude,
      longitude: sale.longitude,
      price: sale.price,
      sale_date: sale.sale_date,
      sale_time_start: sale.sale_time_start,
      sale_time_end: sale.sale_time_end,
      category: sale.category,
      categories: sale.categories,
      photo_urls: sale.photo_urls,
      address: sale.address,
      expires_at: sale.expires_at,
      collected_at: sale.collected_at,
    }));

    try {
      const { data, error } = await db
        .from('external_sales')
        .upsert(rows, {
          onConflict: 'source_id',
          ignoreDuplicates: false, // Update existing records
        });

      if (error) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
        console.error(
          `  DB Error (batch ${Math.floor(i / BATCH_SIZE) + 1}):`,
          error.message
        );
      } else {
        totalInserted += batch.length;
      }
    } catch (err: any) {
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err.message}`);
      console.error(
        `  DB Exception (batch ${Math.floor(i / BATCH_SIZE) + 1}):`,
        err.message
      );
    }
  }

  return { inserted: totalInserted, errors };
}

// ============================================
// CLEANUP EXPIRED LISTINGS
// ============================================

/**
 * Remove expired listings from external_sales.
 * Calls the cleanup_expired_external_sales RPC function
 * if it exists, otherwise deletes directly.
 */
export async function cleanupExpired(): Promise<{
  deleted: number;
  error: string | null;
}> {
  const db = getSupabase();

  try {
    // Try RPC first (if the function exists in Supabase)
    const { data, error } = await db.rpc('cleanup_expired_external_sales');

    if (error) {
      // Fallback: direct delete
      console.log('  RPC not available, using direct delete...');
      const now = new Date().toISOString();
      const { data: deleteData, error: deleteError } = await db
        .from('external_sales')
        .delete()
        .lt('expires_at', now)
        .select('id');

      if (deleteError) {
        return { deleted: 0, error: deleteError.message };
      }

      const count = Array.isArray(deleteData) ? deleteData.length : 0;
      return { deleted: count, error: null };
    }

    // RPC returns the count of deleted rows
    const count = typeof data === 'number' ? data : 0;
    return { deleted: count, error: null };
  } catch (err: any) {
    return { deleted: 0, error: err.message };
  }
}

// ============================================
// STATS / COUNTS
// ============================================

/**
 * Get the total count of listings in external_sales.
 */
export async function getTotalListingCount(): Promise<number> {
  const db = getSupabase();
  try {
    const { count, error } = await db
      .from('external_sales')
      .select('*', { count: 'exact', head: true });
    if (error) return -1;
    return count || 0;
  } catch {
    return -1;
  }
}

/**
 * Get listing counts grouped by source.
 */
export async function getCountsBySource(): Promise<
  Record<string, number>
> {
  const db = getSupabase();
  try {
    const { data, error } = await db
      .from('external_sales')
      .select('source');
    if (error || !data) return {};

    const counts: Record<string, number> = {};
    for (const row of data) {
      counts[row.source] = (counts[row.source] || 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

/**
 * Get listing counts grouped by city.
 */
export async function getCountsByCity(): Promise<
  Record<string, number>
> {
  const db = getSupabase();
  try {
    const { data, error } = await db
      .from('external_sales')
      .select('city');
    if (error || !data) return {};

    const counts: Record<string, number> = {};
    for (const row of data) {
      const city = row.city || 'Unknown';
      counts[city] = (counts[city] || 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}
