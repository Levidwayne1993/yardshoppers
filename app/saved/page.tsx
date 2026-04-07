"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import ListingCard from "@/components/ListingCard";

export default function SavedListingsPage() {
  const supabase = createClient();
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSaved = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSavedListings([]);
        setLoading(false);
        return;
      }

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

      // Load listings WITH their photos in one query
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select("*, listing_photos(*)")
        .in("id", listingIds);

      if (listingsError) {
        console.error(listingsError);
        setLoading(false);
        return;
      }

      setSavedListings(listingsData || []);
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
          <p className="text-gray-600">You haven&apos;t saved any listings yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
