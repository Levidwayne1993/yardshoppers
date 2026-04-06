"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";

export default function HomePage() {
  const supabase = createClientComponentClient();

  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ⭐ Load featured listings (latest 6)
  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);

      const { data: listings } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (!listings) {
        setFeatured([]);
        setLoading(false);
        return;
      }

      // Load photos
      const ids = listings.map((l) => l.id);

      const { data: photos } = await supabase
        .from("listing_photos")
        .select("*")
        .in("listing_id", ids)
        .order("display_order", { ascending: true });

      const withPhotos = listings.map((l) => {
        const photo = photos?.find((p) => p.listing_id === l.id);
        return {
          ...l,
          imageUrl: photo?.photo_url || "/placeholder.jpg",
        };
      });

      setFeatured(withPhotos);
      setLoading(false);
    };

    loadFeatured();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ⭐ HERO SECTION */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-400 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Discover Local Yard Sales Near You
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            Find hidden treasures, great deals, and community events — all in one place.
          </p>

          <Link
            href="/browse"
            className="inline-block bg-white text-emerald-700 font-semibold px-8 py-3 rounded-full shadow hover:bg-gray-100 transition"
          >
            Browse Yard Sales
          </Link>
        </div>
      </section>

      {/* ⭐ CATEGORIES */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-6">Popular Categories</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            "Furniture",
            "Tools",
            "Clothing",
            "Electronics",
            "Toys",
            "Collectibles",
          ].map((cat) => (
            <Link
              key={cat}
              href="/browse"
              className="bg-white border rounded-lg shadow-sm p-4 text-center hover:bg-emerald-50 transition"
            >
              <span className="font-medium text-gray-700">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ⭐ FEATURED LISTINGS */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Listings</h2>
          <Link href="/browse" className="text-emerald-700 hover:underline">
            View all →
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading featured listings...</p>
        ) : featured.length === 0 ? (
          <p className="text-gray-600">No listings available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                city={listing.city}
                state={listing.state}
                date={listing.sale_date_start}
                time={listing.sale_time_start}
                description={listing.description}
                imageUrl={listing.imageUrl}
              />
            ))}
          </div>
        )}
      </section>

      {/* ⭐ CTA BANNER */}
      <section className="bg-white border-t py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Hosting a Yard Sale?</h2>
          <p className="text-gray-600 mb-8">
            Reach more shoppers in your neighborhood by posting your sale on YardShoppers.
          </p>

          <Link
            href="/post"
            className="inline-block bg-emerald-700 text-white font-semibold px-8 py-3 rounded-full shadow hover:bg-emerald-600 transition"
          >
            Post Your Sale
          </Link>
        </div>
      </section>
    </div>
  );
}
