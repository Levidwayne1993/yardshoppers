import { createClient } from "@supabase/supabase-js";
import { runAllCollectors } from "@/lib/collectors";
import { normalizeCollectorResult, deduplicateListings } from "@/lib/normalizers";
import { NormalizedListing } from "@/types/external";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function runCollectionJob(): Promise<{
  inserted: number;
  skipped: number;
  errors: string[];
}> {
  const supabase = getAdminClient();
  const allErrors: string[] = [];
  let allNormalized: NormalizedListing[] = [];

  const results = await runAllCollectors();

  for (const result of results) {
    allErrors.push(...result.errors);
    const normalized = await normalizeCollectorResult(result);
    allNormalized.push(...normalized);
  }

  allNormalized = deduplicateListings(allNormalized);

  let inserted = 0;
  let skipped = 0;

  const batchSize = 50;
  for (let i = 0; i < allNormalized.length; i += batchSize) {
    const batch = allNormalized.slice(i, i + batchSize);

    const sourceIds = batch.map((l) => l.source_id);
    const { data: existing } = await supabase
      .from("external_sales")
      .select("source_id")
      .in("source_id", sourceIds);

    const existingIds = new Set((existing || []).map((e) => e.source_id));

    const newListings = batch.filter((l) => !existingIds.has(l.source_id));
    skipped += batch.length - newListings.length;

    if (newListings.length > 0) {
      const rows = newListings.map((l) => ({
        source: l.source,
        source_id: l.source_id,
        source_url: l.source_url,
        title: l.title,
        description: l.description,
        city: l.city,
        state: l.state,
        latitude: l.latitude,
        longitude: l.longitude,
        price: l.price,
        sale_date: l.sale_date,
        sale_time_start: l.sale_time_start,
        sale_time_end: l.sale_time_end,
        category: l.category,
        categories: l.categories,
        photo_urls: l.photo_urls,
        address: l.address,
        collected_at: l.collected_at,
        expires_at: l.expires_at,
        raw_data: l.raw_data,
      }));

      const { error } = await supabase.from("external_sales").insert(rows);

      if (error) {
        allErrors.push(`Insert batch error: ${error.message}`);
      } else {
        inserted += newListings.length;
      }
    }
  }

  return { inserted, skipped, errors: allErrors };
}

export async function cleanupExpiredListings(): Promise<number> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("external_sales")
    .delete()
    .lt("expires_at", now)
    .select("id");

  if (error) {
    console.error("Cleanup error:", error.message);
    return 0;
  }

  return data?.length || 0;
}
