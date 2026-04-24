// ============================================================
// FILE: app/page.tsx
// PLACE AT: app/page.tsx  (REPLACE your existing file)
// WHAT CHANGED:
//   - Converted from "use client" to a SERVER component
//   - Fetches initial 12 listings on the server (server→Supabase
//     is ~5ms vs browser→Supabase which is ~200ms+)
//   - Passes pre-fetched data to HomeContent (client component)
//   - The HTML sent to the browser now INCLUDES the hero + listings
//     instead of a blank shell that waits for JS — THIS FIXES LCP
//   - Uses ISR (revalidate = 60) so data stays fresh every minute
//   - External sales are merged and sorted server-side too
// ============================================================

import { createClient } from "@supabase/supabase-js";
import HomeContent from "@/components/HomeContent";

/* ── Lightweight Supabase client for server-side public reads.
      No cookies needed — listings are public data. ── */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ── ISR: re-generate this page at most every 60 seconds ── */
export const revalidate = 60;

export default async function HomePage() {
  /* ── Fetch user listings + external sales in parallel ── */
  const [userResult, extResult] = await Promise.all([
    supabase
      .from("listings")
      .select("*, listing_photos(*)")
      .eq("is_shadowbanned", false)
      .order("is_boosted", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("external_sales")
      .select("*")
      .order("collected_at", { ascending: false })
      .limit(50),
  ]);

  const userListings = userResult.data || [];

  const externalListings = (extResult.data || []).map((ext: any) => ({
    ...ext,
    listing_photos: ext.photo_urls
      ? ext.photo_urls.map((url: string) => ({ photo_url: url }))
      : [],
    is_boosted: false,
    is_external: true,
    created_at: ext.collected_at,
  }));

  /* ── Merge: boosted first, then newest ── */
  const boosted = userListings.filter((l: any) => l.is_boosted);
  const nonBoosted = [
    ...userListings.filter((l: any) => !l.is_boosted),
    ...externalListings,
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const initialListings = [...boosted, ...nonBoosted].slice(0, 12);

  return <HomeContent initialListings={initialListings} />;
}
