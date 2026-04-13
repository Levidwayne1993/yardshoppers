import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { collectAllSources } from "@/lib/collectors";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clean expired listings
    let cleaned = 0;
    try {
      const { data } = await supabaseAdmin.rpc(
        "cleanup_expired_external_sales"
      );
      cleaned = typeof data === "number" ? data : 0;
    } catch {
      /* cleanup is optional */
    }

    // Collect from all sources
    const { sales, errors } = await collectAllSources();

    let inserted = 0;
    let skipped = 0;

    // Batch insert in chunks of 50
    for (let i = 0; i < sales.length; i += 50) {
      const chunk = sales.slice(i, i + 50).map((sale) => ({
        source: sale.source,
        source_id: sale.source_id,
        source_url: sale.source_url,
        title: sale.title,
        description: sale.description || null,
        city: sale.city || null,
        state: sale.state || null,
        latitude: sale.latitude || null,
        longitude: sale.longitude || null,
        price: sale.price || null,
        sale_date: sale.sale_date || null,
        sale_time_start: sale.sale_time_start || null,
        sale_time_end: sale.sale_time_end || null,
        category: sale.category || null,
        categories: sale.categories || [],
        photo_urls: sale.photo_urls || [],
        address: sale.address || null,
        expires_at: sale.expires_at || null,
        collected_at: new Date().toISOString(),
      }));

      const { data, error } = await supabaseAdmin
        .from("external_sales")
        .upsert(chunk, {
          onConflict: "source_id",
          ignoreDuplicates: true,
        })
        .select("id");

      if (error) {
        skipped += chunk.length;
        errors.push(`DB insert error: ${error.message}`);
      } else {
        inserted += data?.length || 0;
        skipped += chunk.length - (data?.length || 0);
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
      cleaned,
      total_collected: sales.length,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
