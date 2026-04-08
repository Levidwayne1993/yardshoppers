"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";
import Image from "next/image";
import { deleteListing } from "@/app/post/actions";

const ADMIN_EMAIL = "erwin-levi@outlook.com";

export default function DashboardPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);
      const admin = user.email?.toLowerCase() === ADMIN_EMAIL;
      setIsAdmin(admin);

      let query = supabase
        .from("listings")
        .select("*, listing_photos(photo_url)")
        .order("created_at", { ascending: false });

      if (!admin) {
        query = query.eq("user_id", user.id);
      }

      const { data } = await query;
      setListings(data || []);
      setCheckingAuth(false);
    };

    init();
  }, []);

  const handleDelete = async (listingId: string, title: string) => {
    const msg = isAdmin
      ? `⚠️ ADMIN DELETE: "${title}"?\n\nThis cannot be undone.`
      : `Delete "${title}"?\n\nThis cannot be undone.`;

    if (!confirm(msg)) return;

    setDeleting(listingId);
    try {
      await deleteListing(listingId);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch (err: any) {
      alert(err.message || "Failed to delete listing");
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">
          My Account
          {isAdmin && (
            <span className="ml-3 text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
              Admin
            </span>
          )}
        </h1>

        {/* Account Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Account Info</h2>
            <p className="text-gray-700">
              <span className="font-medium">Email:</span> {user.email}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/saved"
              className="w-full text-center bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              View Saved Listings
            </Link>
            <Link
              href="/browse"
              className="w-full text-center bg-white border py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Browse All Listings
            </Link>
            <Link
              href="/post"
              className="w-full text-center bg-emerald-700 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 transition"
            >
              Post a New Sale
            </Link>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Listings Section */}
        <h2 className="text-2xl font-bold mb-4">
          {isAdmin ? "All Listings (Admin)" : "My Listings"}
        </h2>

        {listings.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center text-gray-500">
            <p className="text-lg mb-3">No listings yet</p>
            <Link
              href="/post"
              className="text-emerald-600 font-semibold hover:underline"
            >
              Post your first yard sale →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => {
              const photo =
                listing.listing_photos && listing.listing_photos.length > 0
                  ? listing.listing_photos[0].photo_url
                  : null;

              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <Link href={`/listing/${listing.id}`}>
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                      {photo ? (
                        <Image
                          src={photo}
                          alt={listing.title}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-400 text-sm">No photo</p>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link href={`/listing/${listing.id}`}>
                      <h3 className="font-semibold text-gray-900 text-[15px] leading-snug line-clamp-2 hover:text-emerald-700 transition-colors">
                        {listing.title}
                      </h3>
                    </Link>

                    {listing.city && (
                      <p className="text-xs text-gray-500 mt-1">
                        📍 {listing.city}
                        {listing.state ? `, ${listing.state}` : ""}
                      </p>
                    )}

                    {/* Boost Button */}
                    {!listing.is_boosted && (
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          if (
                            !confirm(
                              `Boost "${listing.title}" for $2.99?\n\nBoosted listings appear at the top of browse results.`
                            )
                          )
                            return;
                          try {
                            const res = await fetch("/api/checkout", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ listingId: listing.id }),
                            });
                            const data = await res.json();
                            if (data.url) {
                              window.location.href = data.url;
                            } else {
                              alert(data.error || "Failed to start checkout");
                            }
                          } catch {
                            alert("Something went wrong");
                          }
                        }}
                        className="mt-2 w-full bg-amber-50 text-amber-700 py-2 rounded-lg text-sm font-semibold hover:bg-amber-100 transition"
                      >
                        🚀 Boost Listing — $2.99
                      </button>
                    )}
                    {listing.is_boosted && (
                      <div className="mt-2 w-full bg-emerald-50 text-emerald-700 py-2 rounded-lg text-sm font-semibold text-center">
                        ✅ Boosted
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(listing.id, listing.title)}
                      disabled={deleting === listing.id}
                      className="mt-3 w-full bg-red-50 text-red-600 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting === listing.id
                        ? "Deleting..."
                        : "🗑️ Delete Listing"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
