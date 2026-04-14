import { createClient } from '@supabase/supabase-js';
import type { NormalizedSale } from './types.js';

// ============================================================
//  Storage — Supabase connection, upsert, and cleanup (v2)
//  v2 FIX: Deduplicates sales by source_id before upserting
//  to prevent "cannot affect row a second time" errors.
// ============================================================

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Deduplicate an array of sales by source_id.
 * If two sales share a source_id, the later one wins
 * (it likely has more complete data from a fuller API response).
 */
function deduplicateSales(sales: NormalizedSale[]): NormalizedSale[] {
  const map = new Map<string, NormalizedSale>();
  for (const sale of sales) {
    map.set(sale.source_id, sale);
  }
  return Array.from(map.values());
}

/**
 * Upsert sales into the external_sales table.
 * Uses source_id as the conflict key — if a sale with the same
 * source_id already exists, it gets updated instead of duplicated.
 *
 * Deduplicates first, then processes in chunks of 100.
 */
export async function upsertSales(sales: NormalizedSale[]): Promise<number> {
  if (sales.length === 0) return 0;

  // Deduplicate before upserting
  const uniqueSales = deduplicateSales(sales);
  const dupeCount = sales.length - uniqueSales.length;
  if (dupeCount > 0) {
    console.log(`  🔄 Removed ${dupeCount} duplicate sales (${sales.length} → ${uniqueSales.length} unique)`);
  }

  let totalUpserted = 0;
  const chunkSize = 100;

  for (let i = 0; i < uniqueSales.length; i += chunkSize) {
    const chunk = uniqueSales.slice(i, i + chunkSize);

    const { data, error } = await supabase
      .from('external_sales')
      .upsert(chunk, {
        onConflict: 'source_id',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) {
      console.error(
        `  ❌ Supabase upsert error (chunk ${Math.floor(i / chunkSize) + 1}):`,
        error.message
      );

      // Try inserting one by one to find the bad record
      for (const sale of chunk) {
        const { error: singleError } = await supabase
          .from('external_sales')
          .upsert(sale, {
            onConflict: 'source_id',
            ignoreDuplicates: false,
          });

        if (singleError) {
          console.error(
            `  ❌ Failed single upsert: "${sale.title}" (${sale.source})`,
            singleError.message
          );
        } else {
          totalUpserted++;
        }
      }
    } else {
      totalUpserted += data?.length || chunk.length;
    }
  }

  return totalUpserted;
}

/**
 * Delete sales older than 30 days.
 * Keeps the database clean and relevant.
 */
export async function cleanupOldSales(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('external_sales')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) {
    console.error('  ❌ Cleanup error:', error.message);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Get a count of all sales currently in the database.
 * Useful for summary logging.
 */
export async function getSalesCount(): Promise<number> {
  const { count, error } = await supabase
    .from('external_sales')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('  ❌ Count error:', error.message);
    return 0;
  }

  return count || 0;
}
