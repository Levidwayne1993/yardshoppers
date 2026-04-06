"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ListingCard from "@/components/ListingCard";

export default function SavedListingsPage() {
  const supabase = createClientComponentClient();

  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ⭐ Load saved listings
  useEffect(() => {
    const loadSaved = async () => {
      setLoading(true);

      // 1. Get logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSavedListings([]);
        setLoading(false);
        return;
      }

      // 2. Get saved listing IDs
      const { data: savedData, error: savedError } = await supabase
        .from("saved_listings")
        .select("listing_id")
        .eq("user_id", user.id);

      if (savedError) {
        console.error(savedError);
        setLoading(false);
        return;
      }

      const listingIds = savedData.map((s) => s.listing_id);

      if (listingIds.length === 0) {
        setSavedListings([]);
        setLoading(false);
        return;
      }

      // 3. Load listings
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select("*")
        .in("id", listingIds);

      if (listingsError) {
        console.error(listingsError);
        setLoading(false);
        return;
      }

      // 4. Load first photo for each listing
      const { data: photosData } = await supabase
        .from("listing_photos")
        .select("*")
        .in("listing_id", listingIds)
        .order("display_order", { ascending: true });

      // 5. Attach first photo to each listing
      const listingsWithPhotos = listingsData.map((listing) => {
        const photo = photosData?.find((p) => p.listing_id === listing.id);
        return {
          ...listing,
          imageUrl: photo?.photo_url || "/placeholder.jpg",
        };
      });

      setSavedListings(listingsWithPhotos);
      setLoading(false);
    };

    loadSaved();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        <h1 className="text-3xl font-bold mb-6">Saved Listings</h1>

        {loading ? (
          <p className="text-gray-600">Loading saved listings...</p>
        ) : savedListings.length === 0 ? (
          <p className="text-gray-600">You haven’t saved any listings yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedListings.map((listing) => (
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
      </div>
    </div>
  );
}
