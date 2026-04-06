"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ListingCard from "@/components/ListingCard";

export default function BrowsePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ⭐ Supabase client
  const supabase = createClientComponentClient();

  // ⭐ Load listings + first photo for each listing
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);

      // 1. Load listings
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (listingsError) {
        console.error("Error loading listings:", listingsError);
        setLoading(false);
        return;
      }

      // 2. Load first photo for each listing
      const listingIds = listingsData.map((l) => l.id);

      const { data: photosData, error: photosError } = await supabase
        .from("listing_photos")
        .select("*")
        .in("listing_id", listingIds)
        .order("display_order", { ascending: true });

      if (photosError) {
        console.error("Error loading photos:", photosError);
      }

      // 3. Attach first photo to each listing
      const listingsWithPhotos = listingsData.map((listing) => {
        const photo = photosData?.find((p) => p.listing_id === listing.id);
        return {
          ...listing,
          imageUrl: photo?.photo_url || "/placeholder.jpg",
        };
      });

      setListings(listingsWithPhotos);
      setLoading(false);
    };

    fetchListings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Page Title */}
        <h1 className="text-3xl font-bold mb-6">Browse Yard Sales</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search yard sales..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
          />
        </div>

        {/* Category Buttons */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-6">
          {[
            "All",
            "Furniture",
            "Tools",
            "Clothing",
            "Electronics",
            "Toys",
            "Collectibles",
            "Appliances",
          ].map((cat) => (
            <button
              key={cat}
              className="px-4 py-2 bg-white border rounded-full shadow-sm hover:bg-green-600 hover:text-white transition whitespace-nowrap"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Filters Sidebar */}
          <aside className="bg-white p-4 rounded-lg shadow-sm h-fit border">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>

            {/* City */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                placeholder="Enter city..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
              />
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Category</label>
              <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                <option>All Categories</option>
                <option>Furniture</option>
                <option>Tools</option>
                <option>Clothing</option>
                <option>Electronics</option>
                <option>Toys</option>
                <option>Collectibles</option>
                <option>Appliances</option>
              </select>
            </div>

            <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
              Apply Filters
            </button>
          </aside>

          {/* Listings Grid */}
          <main className="md:col-span-3">
            {loading ? (
              <p className="text-gray-600">Loading listings...</p>
            ) : listings.length === 0 ? (
              <p className="text-gray-600">No yard sales found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    city={listing.city}
                    state={listing.state}
                    date={listing.sale_date_start}
                    time={listing.sale_time_start}
                    description={listing.description}
                    imageUrl={listing.imageUrl} // ⭐ REAL PHOTO NOW
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
