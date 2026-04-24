// ============================================================
// FILE: app/sitemap.ts
// PLACE AT: app/sitemap.ts  (REPLACE your existing file)
// BUILD FIX:
//   Changed `supabase: ReturnType<typeof createClient>` to
//   `supabase: any` on line 31. The strict ReturnType typing
//   resolves to SupabaseClient<unknown, ...> which doesn't match
//   the actual SupabaseClient<any, "public", ...> returned by
//   createClient(url, key). Using `any` fixes the mismatch.
//   Everything else is IDENTICAL to what you already pushed.
// ============================================================

import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { getAllCities } from "@/lib/cities";

const BASE = "https://www.yardshoppers.com";

export const revalidate = 3600; // regenerate sitemap hourly

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAllIds(
  table: string,
  supabase: any
): Promise<{ id: string }[]> {
  const PAGE = 1000;
  const all: { id: string }[] = [];
  let from = 0;

  while (true) {
    const { data } = await supabase
      .from(table)
      .select("id")
      .range(from, from + PAGE - 1);

    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ──
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/browse`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/yard-sales`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/route-planner`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/tips`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // ── Blog posts ──
  const blogPosts: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/blog/how-to-have-a-successful-yard-sale`,
      lastModified: new Date("2025-03-01"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/blog/how-to-price-items-for-yard-sale`,
      lastModified: new Date("2025-03-15"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // ── City landing pages ──
  const cities = getAllCities();
  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${BASE}/yard-sales/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // ── Listing pages (paginated to avoid Vercel timeouts) ──
  let listingPages: MetadataRoute.Sitemap = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [internalIds, externalIds] = await Promise.all([
      fetchAllIds("listings", supabase),
      fetchAllIds("external_sales", supabase),
    ]);

    const allIds = [...internalIds, ...externalIds];

    listingPages = allIds.map((item) => ({
      url: `${BASE}/listing/${item.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // If DB fails, sitemap still returns static + city pages
    console.error("Sitemap: failed to fetch listing IDs");
  }

  return [...staticPages, ...blogPosts, ...cityPages, ...listingPages];
}
