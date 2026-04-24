// ============================================================
// FILE: app/listing/[id]/page.tsx
// PLACE AT: app/listing/[id]/page.tsx  (REPLACE your existing file)
// PRIORITY: 🔴 CRITICAL — #1 SEO FIX IN THIS AUDIT
//
// WHAT'S WRONG:
//   Your current file is just:
//     import ListingDetailClient from "./ListingDetailClient";
//     export default async function ListingPage({ params }) {
//       const { id } = await params;
//       return <ListingDetailClient listingId={id} />;
//     }
//
//   That means Google sees ZERO title, ZERO description, ZERO
//   metadata for ALL 13,575+ listing pages in your sitemap.
//   Every listing URL Google crawls from your sitemap.xml gets
//   an empty <title> and empty <meta description>. Google will
//   either ignore these pages or rank them dead last.
//
// THE FIX:
//   1. ADDED generateMetadata() — fetches listing data from
//      Supabase server-side, generates proper <title> and
//      <meta description> for EVERY listing page
//   2. Checks listings table first, falls back to external_sales
//   3. Graceful fallback if listing not found
//   4. Adds canonical URL, OpenGraph, and Twitter cards
//   5. ListingDetailClient still handles all interactive features
//
// IMPACT: Instantly makes 13,575+ pages properly indexable
// ============================================================

import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import ListingDetailClient from "./ListingDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

async function getListingMeta(id: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Try listings table first
    const { data: listing } = await supabase
      .from("listings")
      .select("title, description, city, state, sale_date, category")
      .eq("id", id)
      .single();

    if (listing) return listing;

    // Fallback to external_sales
    const { data: external } = await supabase
      .from("external_sales")
      .select("title, description, city, state, sale_date, category")
      .eq("id", id)
      .single();

    return external || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingMeta(id);

  if (!listing) {
    return {
      title: "Listing Not Found — YardShoppers",
      description:
        "This yard sale listing may have been removed or is no longer available on YardShoppers.",
    };
  }

  const location = [listing.city, listing.state].filter(Boolean).join(", ");

  const title = listing.title
    ? `${listing.title}${location ? ` in ${location}` : ""} — YardShoppers`
    : `Yard Sale${location ? ` in ${location}` : ""} — YardShoppers`;

  const desc = listing.description
    ? listing.description.slice(0, 155) +
      (listing.description.length > 155 ? "…" : "")
    : `Find this yard sale${location ? ` in ${location}` : ""} on YardShoppers. Browse photos, get directions, and plan your visit.`;

  return {
    title,
    description: desc,
    alternates: { canonical: `/listing/${id}` },
    openGraph: {
      title,
      description: desc,
      url: `https://www.yardshoppers.com/listing/${id}`,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: listing.title || "Yard Sale on YardShoppers",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
    },
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingDetailClient listingId={id} />;
}
