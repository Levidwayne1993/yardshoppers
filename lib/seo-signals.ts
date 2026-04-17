import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

// ============================================
// VIEW TRACKING
// ============================================

/** Call on listing page mount to increment view count */
export async function trackView(listingId: string) {
  try {
    await supabase.rpc("increment_view_count", { listing_id: listingId });
  } catch (err) {
    console.error("Failed to track view:", err);
  }
}

// ============================================
// TRENDING LISTINGS
// ============================================

/** Fetch top trending listings site-wide (most viewed in last 14 days) */
export async function getTrendingListings(limit = 12) {
  const { data, error } = await supabase
    .rpc("get_trending_listings", { limit_count: limit })
    .select("*, listing_photos(*)");

  if (error) {
    // Fallback: manual query if RPC not available
    const { data: fallback } = await supabase
      .from("listings")
      .select("*, listing_photos(*)")
      .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString())
      .order("view_count", { ascending: false })
      .limit(limit);

    return fallback || [];
  }

  return data || [];
}

// ============================================
// HOT IN YOUR AREA
// ============================================

/** Fetch hot listings near a location */
export async function getHotNearby(
  lat: number,
  lng: number,
  radiusMiles = 50,
  limit = 12
) {
  const radiusDeg = radiusMiles / 69;

  const { data, error } = await supabase
    .rpc("get_hot_near", {
      user_lat: lat,
      user_lng: lng,
      radius_deg: radiusDeg,
      limit_count: limit,
    })
    .select("*, listing_photos(*)");

  if (error) {
    // Fallback: manual query
    const { data: fallback } = await supabase
      .from("listings")
      .select("*, listing_photos(*)")
      .gte("latitude", lat - radiusDeg)
      .lte("latitude", lat + radiusDeg)
      .gte("longitude", lng - radiusDeg)
      .lte("longitude", lng + radiusDeg)
      .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString())
      .order("view_count", { ascending: false })
      .limit(limit);

    return fallback || [];
  }

  return data || [];
}

// ============================================
// PRICE DROPS
// ============================================

/** Fetch listings with recent price reductions */
export async function getPriceDrops(limit = 12) {
  const { data } = await supabase
    .from("listings")
    .select("*, listing_photos(*)")
    .eq("price_reduced", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

// ============================================
// CATEGORY INSIGHTS
// ============================================

/** Fetch trending listings for a specific category */
export async function getCategoryTrending(category: string, limit = 12) {
  const { data } = await supabase
    .from("listings")
    .select("*, listing_photos(*)")
    .or(`category.eq.${category},categories.cs.{${category}}`)
    .order("view_count", { ascending: false })
    .limit(limit);

  return data || [];
}

/** Get category stats: total listings, avg views, price range */
export async function getCategoryStats(category: string) {
  const { data } = await supabase
    .from("listings")
    .select("view_count, save_count, price_reduced")
    .or(`category.eq.${category},categories.cs.{${category}}`);

  if (!data || data.length === 0) {
    return { totalListings: 0, totalViews: 0, avgViews: 0, priceDropCount: 0 };
  }

  const totalViews = data.reduce((sum, l) => sum + (l.view_count || 0), 0);
  const priceDropCount = data.filter((l) => l.price_reduced).length;

  return {
    totalListings: data.length,
    totalViews,
    avgViews: Math.round(totalViews / data.length),
    priceDropCount,
  };
}

// ============================================
// SEARCH VOLUME SIGNALS
// ============================================

/** Popular search terms — static seed + can be extended with analytics */
export function getPopularSearchTerms(): { term: string; volume: string }[] {
  return [
    { term: "furniture", volume: "High" },
    { term: "electronics", volume: "High" },
    { term: "vintage", volume: "Medium" },
    { term: "baby clothes", volume: "High" },
    { term: "tools", volume: "Medium" },
    { term: "free stuff", volume: "Very High" },
    { term: "antiques", volume: "Medium" },
    { term: "toys", volume: "High" },
    { term: "kitchen appliances", volume: "Medium" },
    { term: "sports equipment", volume: "Medium" },
    { term: "books", volume: "Medium" },
    { term: "garden supplies", volume: "Low" },
  ];
}

// ============================================
// SCHEMA GENERATORS
// ============================================

/** Generate ItemList schema for a set of listings */
export function generateItemListSchema(
  listings: any[],
  listName: string,
  description: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    description,
    numberOfItems: listings.length,
    itemListElement: listings.slice(0, 20).map((listing, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://www.yardshoppers.com/listing/${listing.id}`,
      name: listing.title,
      item: {
        "@type": "Event",
        name: listing.title,
        url: `https://www.yardshoppers.com/listing/${listing.id}`,
        ...(listing.sale_date ? { startDate: listing.sale_date } : {}),
        ...(listing.city && listing.state
          ? {
              location: {
                "@type": "Place",
                name: `${listing.city}, ${listing.state}`,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: listing.city,
                  addressRegion: listing.state,
                },
              },
            }
          : {}),
      },
    })),
  };
}

/** Generate OfferCatalog schema for category pages */
export function generateOfferCatalogSchema(
  category: string,
  listings: any[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: `${category} — Yard Sales on YardShoppers`,
    description: `Browse ${category.toLowerCase()} available at yard sales near you on YardShoppers.`,
    numberOfItems: listings.length,
    itemListElement: listings.slice(0, 20).map((listing) => ({
      "@type": "Offer",
      name: listing.title,
      url: `https://www.yardshoppers.com/listing/${listing.id}`,
      availability: "https://schema.org/InStock",
      ...(listing.city && listing.state
        ? {
            areaServed: {
              "@type": "Place",
              name: `${listing.city}, ${listing.state}`,
            },
          }
        : {}),
    })),
  };
}

/** Generate CollectionPage schema */
export function generateCollectionPageSchema(
  title: string,
  description: string,
  url: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: "YardShoppers",
      url: "https://www.yardshoppers.com",
    },
  };
}

/** Generate SearchResultsPage schema */
export function generateSearchResultsPageSchema(
  query: string,
  resultCount: number
) {
  return {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    name: `Search results for "${query}" — YardShoppers`,
    description: `Found ${resultCount} yard sale listings matching "${query}" on YardShoppers.`,
    url: `https://www.yardshoppers.com/browse?search=${encodeURIComponent(query)}`,
    isPartOf: {
      "@type": "WebSite",
      name: "YardShoppers",
      url: "https://www.yardshoppers.com",
    },
  };
}
