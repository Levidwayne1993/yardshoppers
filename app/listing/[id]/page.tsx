import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Metadata } from "next";
import ListingDetailClient from "./ListingDetailClient";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
}

async function getListing(id: string) {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("listings")
    .select("*, listing_photos(*), profiles(display_name)")
    .eq("id", id)
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    return { title: "Listing Not Found" };
  }

  const location = [listing.city, listing.state].filter(Boolean).join(", ");
  const title = `${listing.title}${location ? ` in ${location}` : ""}`;
  const description =
    listing.description?.slice(0, 160) ||
    `Check out this yard sale listing${location ? ` in ${location}` : ""} on YardShoppers.`;
  const photos = listing.listing_photos || [];
  const ogImage =
    photos.length > 0
      ? photos[0].photo_url
      : "https://www.yardshoppers.com/og-image.png";

  return {
    title,
    description,
    alternates: {
      canonical: `/listing/${id}`,
    },
    openGraph: {
      type: "article",
      url: `https://www.yardshoppers.com/listing/${id}`,
      title,
      description,
      siteName: "YardShoppers",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);

  const jsonLd = listing ? buildJsonLd(listing, id) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ListingDetailClient listingId={id} />
    </>
  );
}

function buildJsonLd(listing: any, id: string) {
  const baseUrl = "https://www.yardshoppers.com";
  const photos = listing.listing_photos || [];
  const location = [listing.address, listing.city, listing.state, listing.zip_code]
    .filter(Boolean)
    .join(", ");
  const sellerName =
    listing.profiles?.display_name || "YardShoppers Seller";

  const priceNum = listing.price
    ? parseFloat(listing.price.replace(/[^0-9.]/g, ""))
    : null;

  let startDateTime: string | null = null;
  let endDateTime: string | null = null;

  if (listing.sale_date) {
    const startTime = listing.sale_time_start || "08:00";
    const endTime = listing.sale_time_end || "17:00";
    const normalizeTime = (t: string) => {
      const match = t.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
      if (!match) return "08:00";
      let h = parseInt(match[1]);
      const m = match[2] || "00";
      const ampm = match[3];
      if (ampm?.toUpperCase() === "PM" && h < 12) h += 12;
      if (ampm?.toUpperCase() === "AM" && h === 12) h = 0;
      return `${h.toString().padStart(2, "0")}:${m}`;
    };
    startDateTime = `${listing.sale_date}T${normalizeTime(startTime)}:00`;
    endDateTime = `${listing.sale_date}T${normalizeTime(endTime)}:00`;
  }

  const graph: any[] = [];

  // BreadcrumbList
  const breadcrumbItems: any[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: baseUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Browse",
      item: `${baseUrl}/browse`,
    },
  ];

  if (listing.category) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: listing.category,
      item: `${baseUrl}/browse?category=${encodeURIComponent(listing.category)}`,
    });
  }

  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: listing.title,
    item: `${baseUrl}/listing/${id}`,
  });

  graph.push({
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  });

  // Product schema
  const product: any = {
    "@type": "Product",
    name: listing.title,
    description: listing.description || `Yard sale listing on YardShoppers`,
    url: `${baseUrl}/listing/${id}`,
    image: photos.map((p: any) => p.photo_url),
    brand: {
      "@type": "Organization",
      name: "YardShoppers",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/listing/${id}`,
      priceCurrency: "USD",
      price: priceNum && !isNaN(priceNum) ? priceNum.toFixed(2) : "0.00",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: {
        "@type": "Person",
        name: sellerName,
      },
    },
  };

  if (location) {
    product.offers.availableAtOrFrom = {
      "@type": "Place",
      name: listing.city || "Yard Sale Location",
      address: {
        "@type": "PostalAddress",
        streetAddress: listing.address || undefined,
        addressLocality: listing.city || undefined,
        addressRegion: listing.state || undefined,
        postalCode: listing.zip_code || undefined,
        addressCountry: "US",
      },
    };
  }

  graph.push(product);

  // Event schema (GarageSaleEvent)
  if (startDateTime) {
    const event: any = {
      "@type": "Event",
      name: listing.title,
      description:
        listing.description ||
        `Yard sale${listing.city ? ` in ${listing.city}` : ""} — browse items on YardShoppers`,
      startDate: startDateTime,
      endDate: endDateTime || startDateTime,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode:
        "https://schema.org/OfflineEventAttendanceMode",
      url: `${baseUrl}/listing/${id}`,
      image: photos.length > 0 ? photos[0].photo_url : `${baseUrl}/og-image.png`,
      organizer: {
        "@type": "Person",
        name: sellerName,
      },
      offers: {
        "@type": "Offer",
        url: `${baseUrl}/listing/${id}`,
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        validFrom: listing.created_at,
      },
    };

    if (location) {
      event.location = {
        "@type": "Place",
        name: `Yard Sale — ${listing.city || "Local"}`,
        address: {
          "@type": "PostalAddress",
          streetAddress: listing.address || undefined,
          addressLocality: listing.city || undefined,
          addressRegion: listing.state || undefined,
          postalCode: listing.zip_code || undefined,
          addressCountry: "US",
        },
      };
    }

    graph.push(event);
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
