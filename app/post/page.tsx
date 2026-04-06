"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function PostPage() {
  const supabase = createClientComponentClient();

  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ⭐ Protect the page
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);
      setCheckingAuth(false);
    };

    checkUser();
  }, []);

  // ⭐ Prevent UI flash while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Checking authentication...
      </div>
    );
  }

  // ⭐ Your existing state
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<File[]>([]);

  // ⭐ Create Listing Logic (unchanged)
  const handleCreateListing = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in to post a sale.");
      return;
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .insert({
        user_id: user.id,
        title,
        description,
        category,
        city,
        state,
        sale_date_start: date,
        sale_time_start: time,
      })
      .select()
      .single();

    if (listingError) {
      alert(listingError.message);
      return;
    }

    // Upload photos
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileName = `${listing.id}-${Date.now()}-${file.name}`;

      const { error: storageError } = await supabase.storage
        .from("listing_photos")
        .upload(fileName, file);

      if (storageError) {
        console.error(storageError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("listing_photos")
        .getPublicUrl(fileName);

      await supabase.from("listing_photos").insert({
        listing_id: listing.id,
        photo_url: urlData.publicUrl,
        display_order: i,
      });
    }

    window.location.href = `/listing/${listing.id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">

        <h1 className="text-3xl font-bold mb-6">Post a Yard Sale</h1>

        <div className="bg-white p-6 rounded-lg shadow-sm border">

          {/* Title */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              placeholder="e.g., Huge Multi-Family Yard Sale"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* City + State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                placeholder="Olympia"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <input
                type="text"
                placeholder="WA"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input
                type="text"
                placeholder="8 AM - 2 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>

          {/* Category */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
            >
              <option value="">Select a category</option>
              <option>General Yard Sale</option>
              <option>Multi-Family Sale</option>
              <option>Estate Sale</option>
              <option>Community Sale</option>
              <option>Moving Sale</option>
            </select>
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              placeholder="Describe your yard sale, items available, special deals, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg h-32 focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* Photo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Photos</label>

            <div className="border-2 border-dashed rounded-lg p-6 text-center bg-gray-50">
              <input
                type="file"
                multiple
                onChange={(e) =>
                  setImages(Array.from(e.target.files || []))
                }
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer text-green-700 font-medium hover:underline"
              >
                Click to upload photos
              </label>

              {images.length > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  {images.length} file(s) selected
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleCreateListing}
            className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition"
          >
            Post Sale
          </button>
        </div>
      </div>
    </div>
  );
}
