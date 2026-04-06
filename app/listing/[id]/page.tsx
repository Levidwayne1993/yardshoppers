// ⭐ Dynamic SEO for each listing
import { createClient } from "@supabase/supabase-js";

export async function generateMetadata({ params }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch listing
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!listing) {
    return {
      title: "Listing Not Found | YardShoppers",
      description: "This yard sale listing could not be found.",
    };
  }

  // Fetch first photo
  const { data: photos } = await supabase
    .from("listing_photos")
    .select("*")
    .eq("listing_id", params.id)
    .order("display_order", { ascending: true })
    .limit(1);

  const imageUrl = photos?.[0]?.photo_url || "/placeholder.jpg";

  return {
    title: `${listing.title} — Yard Sale in ${listing.city}, ${listing.state}`,
    description:
      listing.description?.slice(0, 150) ||
      `Yard sale in ${listing.city}, ${listing.state}.`,
    openGraph: {
      title: listing.title,
      description: listing.description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: listing.title,
      description: listing.description,
      images: [imageUrl],
    },
  };
}

"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClientComponentClient();

  const [listing, setListing] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // ⭐ Load listing + photos + saved state
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch listing
      const { data: listingData } = await supabase
        .from("listings")
        .select("*")
        .eq("id", params.id)
        .single();

      setListing(listingData);

      // 2. Fetch photos
      const { data: photoData } = await supabase
        .from("listing_photos")
        .select("*")
        .eq("listing_id", params.id)
        .order("display_order", { ascending: true });

      setPhotos(photoData || []);

      // 3. Check if saved
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: savedData } = await supabase
          .from("saved_listings")
          .select("*")
          .eq("user_id", user.id)
          .eq("listing_id", params.id)
          .maybeSingle();

        setSaved(!!savedData);
      }

      setLoading(false);
    };

    fetchData();
  }, [params.id]);

  // ⭐ Toggle Save Listing
  const toggleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in to save listings.");
      return;
    }

    if (saved) {
      // Unsave
      await supabase
        .from("saved_listings")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", params.id);

      setSaved(false);
    } else {
      // Save
      await supabase.from("saved_listings").insert({
        user_id: user.id,
        listing_id: params.id,
      });

      setSaved(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading listing...
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Listing not found.
      </div>
    );
  }

  const mainPhoto = photos[0]?.photo_url || "/placeholder.jpg";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Back Button */}
        <button
          onClick={() => history.back()}
          className="mb-6 text-green-700 hover:underline"
        >
          ← Back to Browse
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* LEFT: Main Photo + Thumbnails */}
          <div>
            <div className="relative w-full h-80 rounded-lg overflow-hidden shadow">
              <Image
                src={mainPhoto}
                alt="Listing Image"
                fill
                className="object-cover"
              />
            </div>

            <div className="flex gap-3 mt-4">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="relative w-24 h-20 rounded-lg overflow-hidden border shadow-sm"
                >
                  <Image
                    src={p.photo_url}
                    alt="Thumbnail"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Listing Info */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>

            <p className="text-gray-600 mb-4">
              {listing.city}, {listing.state} • {listing.sale_date_start} •{" "}
              {listing.sale_time_start}
            </p>

            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700 leading-relaxed">
                {listing.description}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
              <h2 className="text-xl font-semibold mb-2">Seller</h2>
              <p className="text-gray-700">User ID: {listing.user_id}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={toggleSave}
                className={`flex-1 py-3 rounded-lg shadow transition ${
                  saved
                    ? "bg-gray-300 text-gray-700 hover:bg-gray-400"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {saved ? "Saved" : "Save Listing"}
              </button>

              <button className="flex-1 bg-white border py-3 rounded-lg shadow hover:bg-gray-100 transition">
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="mt-10 bg-white p-4 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-3">Location</h2>
          <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
            Map Placeholder
          </div>
        </div>
      </div>
    </div>
  );
}
