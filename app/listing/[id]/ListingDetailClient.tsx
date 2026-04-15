"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import BoostModal from "@/components/BoostModal";
import ReportModal from "@/components/ReportModal";
import CommentsSection from "@/components/CommentsSection";
import RatingSection from "@/components/RatingSection";
import MessageModal from "@/components/MessageModal";
import RouteFloatingBar from "@/components/RouteFloatingBar";
import { trackView } from "@/lib/seo-signals";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: string;
  street_address?: string;
  address?: string;
  city: string;
  state: string;
  zip_code: string;
  category: string;
  sale_date: string;
  start_time?: string;
  end_time?: string;
  sale_time_start?: string;
  sale_time_end?: string;
  created_at: string;
  user_id: string;
  is_boosted?: boolean;
  profiles?: { display_name?: string } | null;
  listing_photos?: { id: string; photo_url: string }[];
  latitude?: number | null;
  longitude?: number | null;
}

export default function ListingDetailClient({
  listingId,
}: {
  listingId: string;
}) {
  const supabase = createClient();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [hostAvgRating, setHostAvgRating] = useState<number | null>(null);
  const [hostTotalRatings, setHostTotalRatings] = useState<number>(0);
  const [isFromExternal, setIsFromExternal] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u);

      let data: any = null;

      // Try internal listings table first (with profiles join)
      {
        const { data: d, error } = await supabase
          .from("listings")
          .select("*, listing_photos(*), profiles(display_name)")
          .eq("id", listingId)
          .single();

        if (!error && d) {
          data = d;
        }
      }

      // If profiles join fails, retry without it
      if (!data) {
        const { data: fallback } = await supabase
          .from("listings")
          .select("*, listing_photos(*)")
          .eq("id", listingId)
          .single();
        if (fallback) {
          data = { ...fallback, profiles: null };
        }
      }

      // If still not found, try external_sales table
      if (!data) {
        const { data: extData } = await supabase
          .from("external_sales")
          .select("*")
          .eq("id", listingId)
          .single();

        if (extData) {
          setIsFromExternal(true);
          data = {
            id: extData.id,
            title: extData.title || "Classified Listing",
            description: extData.description || "",
            price: extData.price || "",
            street_address: extData.address || "",
            address: extData.address || "",
            city: extData.city || "",
            state: extData.state || "",
            zip_code: "",
            category: extData.category || "",
            sale_date: extData.sale_date || "",
            start_time: null,
            end_time: null,
            sale_time_start: extData.sale_time_start || null,
            sale_time_end: extData.sale_time_end || null,
            created_at: extData.collected_at || extData.created_at || "",
            user_id: "",
            is_boosted: false,
            profiles: null,
            listing_photos: (extData.photo_urls || []).map(
              (url: string, i: number) => ({
                id: `ext-photo-${i}`,
                photo_url: url,
              })
            ),
            latitude: extData.latitude ?? null,
            longitude: extData.longitude ?? null,
          };
        }
      }

      if (data) {
        setListing(data);

        // Fetch host rating summary (only for internal listings with a user_id)
        if (data.user_id) {
          const { data: ratingData } = await supabase
            .from("host_ratings")
            .select("avg_rating, total_ratings")
            .eq("host_id", data.user_id)
            .maybeSingle();

          if (ratingData) {
            setHostAvgRating(ratingData.avg_rating);
            setHostTotalRatings(ratingData.total_ratings);
          }
        }
      }

      if (u) {
        const { data: s } = await supabase
          .from("saved_listings")
          .select("id")
          .eq("user_id", u.id)
          .eq("listing_id", listingId)
          .maybeSingle();
        setSaved(!!s);
      }

      setLoading(false);
    }
    load();
  }, [listingId]);

  useEffect(() => {
    trackView(listingId);
  }, [listingId]);

  async function toggleSave() {
    if (!user) return;
    if (saved) {
      await supabase
        .from("saved_listings")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);
      setSaved(false);
    } else {
      await supabase
        .from("saved_listings")
        .insert({ user_id: user.id, listing_id: listingId });
      setSaved(true);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: listing?.title,
        text: "Check out this yard sale on YardShoppers!",
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 aspect-[4/3] bg-gray-200 rounded-2xl" />
            <div className="lg:col-span-2 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
          <i
            className="fa-solid fa-ghost text-3xl text-gray-300"
            aria-hidden="true"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Listing Not Found
        </h1>
        <p className="text-gray-500 mb-6">
          This listing may have been removed or doesn&apos;t exist.
        </p>
        <Link
          href="/browse"
          className="px-6 py-2.5 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-semibold transition"
        >
          Browse Sales
        </Link>
      </div>
    );
  }

  const photos = listing.listing_photos || [];
  const displayAddress = listing.street_address || listing.address || "";
  // Prevent address from duplicating the city name
  const showAddress =
    displayAddress &&
    displayAddress.toLowerCase().trim() !== listing.city?.toLowerCase().trim();
  const location = [
    showAddress ? displayAddress : "",
    listing.city,
    listing.state,
    listing.zip_code,
  ]
    .filter(Boolean)
    .join(", ");

  // Build maps URL — prefer lat/lng if available, otherwise use text address
  const mapsUrl =
    listing.latitude && listing.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  const saleDay = listing.sale_date
    ? new Date(listing.sale_date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  function formatTime(timeStr: string | null | undefined): string | null {
    if (!timeStr) return null;
    try {
      const [hours, minutes] = timeStr.split(":");
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${h12}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  }

  const rawStart = listing.start_time || listing.sale_time_start;
  const rawEnd = listing.end_time || listing.sale_time_end;
  const formattedStart = formatTime(rawStart);
  const formattedEnd = formatTime(rawEnd);

  const isOwner = user && listing.user_id && listing.user_id === user.id;

  return (
    <article
      className="max-w-6xl mx-auto px-4 sm:px-6 py-8"
      itemScope
      itemType="https://schema.org/Product"
    >
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm text-gray-500 mb-6"
      >
        <Link href="/" className="hover:text-ys-800 transition">
          Home
        </Link>
        <i
          className="fa-solid fa-chevron-right text-[10px] text-gray-300"
          aria-hidden="true"
        />
        <Link href="/browse" className="hover:text-ys-800 transition">
          Browse
        </Link>
        {listing.category && (
          <>
            <i
              className="fa-solid fa-chevron-right text-[10px] text-gray-300"
              aria-hidden="true"
            />
            <Link
              href={`/browse?category=${encodeURIComponent(listing.category)}`}
              className="hover:text-ys-800 transition"
            >
              {listing.category}
            </Link>
          </>
        )}
        <i
          className="fa-solid fa-chevron-right text-[10px] text-gray-300"
          aria-hidden="true"
        />
        <span className="text-gray-900 font-medium truncate max-w-[200px]">
          {listing.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <div className="relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden">
            {photos.length > 0 ? (
              <Image
                src={photos[activePhoto].photo_url}
                alt={`${listing.title} — photo ${activePhoto + 1} of ${photos.length}${listing.city ? `, ${listing.city}` : ""}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
                itemProp="image"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-ys-50">
                <i
                  className="fa-solid fa-camera text-5xl text-ys-300 mb-3"
                  aria-hidden="true"
                />
                <p className="text-sm text-ys-400">No photos available</p>
              </div>
            )}

            {photos.length > 1 && (
              <div
                className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm"
                aria-live="polite"
              >
                {activePhoto + 1} / {photos.length}
              </div>
            )}

            {photos.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActivePhoto((p) =>
                      p === 0 ? photos.length - 1 : p - 1
                    )
                  }
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition"
                >
                  <i
                    className="fa-solid fa-chevron-left text-sm text-gray-700"
                    aria-hidden="true"
                  />
                </button>
                <button
                  onClick={() =>
                    setActivePhoto((p) =>
                      p === photos.length - 1 ? 0 : p + 1
                    )
                  }
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition"
                >
                  <i
                    className="fa-solid fa-chevron-right text-sm text-gray-700"
                    aria-hidden="true"
                  />
                </button>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div
              className="flex gap-2 mt-3 overflow-x-auto pb-1"
              role="tablist"
              aria-label="Listing photos"
            >
              {photos.map((photo: { id: string; photo_url: string }, i: number) => (
                <button
                  key={photo.id}
                  onClick={() => setActivePhoto(i)}
                  role="tab"
                  aria-selected={i === activePhoto}
                  aria-label={`View photo ${i + 1} of ${photos.length}`}
                  className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    i === activePhoto
                      ? "border-ys-600 shadow-md"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={photo.photo_url}
                    alt={`${listing.title} — thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}

          {listing.description && (
            <section className="mt-8 bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                About This Sale
              </h2>
              <p
                className="text-gray-600 leading-relaxed whitespace-pre-line"
                itemProp="description"
              >
                {listing.description}
              </p>
            </section>
          )}

          {!isFromExternal && (
            <RatingSection listingId={listing.id} hostId={listing.user_id} />
          )}
          <CommentsSection listingId={listing.id} />
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24 space-y-5">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              {listing.category && (
                <Link
                  href={`/browse?category=${encodeURIComponent(listing.category)}`}
                  className="inline-block text-xs font-semibold text-ys-800 bg-ys-100 px-3 py-1 rounded-full hover:bg-ys-200 transition mb-3"
                >
                  {listing.category}
                </Link>
              )}

              <div className="flex items-start justify-between gap-3">
                <h1
                  className="text-xl font-bold text-gray-900 leading-tight"
                  itemProp="name"
                >
                  {listing.title}
                </h1>
                <button
                  onClick={toggleSave}
                  className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                    saved
                      ? "bg-red-50 border-red-200 text-red-500"
                      : "bg-gray-50 border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200"
                  }`}
                  aria-label={
                    saved ? "Unsave this listing" : "Save this listing"
                  }
                >
                  <i
                    className={`${saved ? "fa-solid" : "fa-regular"} fa-heart`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {listing.price && (
                <p
                  className="text-2xl font-extrabold text-ys-800 mt-2"
                  itemProp="offers"
                  itemScope
                  itemType="https://schema.org/Offer"
                >
                  <span itemProp="price">{listing.price}</span>
                  <meta itemProp="priceCurrency" content="USD" />
                  <meta
                    itemProp="availability"
                    content="https://schema.org/InStock"
                  />
                </p>
              )}

              <div className="mt-5 space-y-3">
                {location && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-ys-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <i
                        className="fa-solid fa-location-dot text-sm text-ys-700"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Location
                      </p>
                      <p className="text-sm text-gray-500">{location}</p>
                    </div>
                  </div>
                )}

                {saleDay && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-ys-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <i
                        className="fa-regular fa-calendar text-sm text-ys-700"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Date</p>
                      <time
                        className="text-sm text-gray-500"
                        dateTime={listing.sale_date}
                      >
                        {saleDay}
                      </time>
                    </div>
                  </div>
                )}

                {(formattedStart || formattedEnd) && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-ys-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <i
                        className="fa-regular fa-clock text-sm text-ys-700"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Time</p>
                      <p className="text-sm text-gray-500">
                        {formattedStart}
                        {formattedEnd ? ` – ${formattedEnd}` : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-ys-800 hover:bg-ys-900 text-white py-3 rounded-xl font-semibold transition-all hover:shadow-lg"
                >
                  <i
                    className="fa-solid fa-diamond-turn-right text-sm"
                    aria-hidden="true"
                  />
                  Directions
                </a>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-gray-700 hover:border-ys-600 hover:text-ys-800 transition-all"
                >
                  <i
                    className={`fa-solid ${copied ? "fa-check" : "fa-share-nodes"} text-sm`}
                    aria-hidden="true"
                  />
                  {copied ? "Copied!" : "Share"}
                </button>
              </div>

              {/* Message Seller — only for internal listings with a real seller */}
              {!isFromExternal && !isOwner && (
                <button
                  onClick={() => {
                    if (!user) {
                      window.location.href = "/login";
                      return;
                    }
                    setShowMessageModal(true);
                  }}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-[#2E7D32] hover:bg-green-800 text-white py-3 rounded-xl font-semibold transition-all hover:shadow-lg"
                >
                  <i
                    className="fa-solid fa-envelope text-sm"
                    aria-hidden="true"
                  />
                  Message Seller
                </button>
              )}

              {/* Boost controls — only for internal listings owned by the user */}
              {!isFromExternal && isOwner && !listing.is_boosted && (
                <button
                  onClick={() => setShowBoostModal(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-900 py-3 rounded-xl font-bold transition-all hover:shadow-md"
                >
                  <i
                    className="fa-solid fa-rocket text-sm"
                    aria-hidden="true"
                  />
                  Boost This Listing
                </button>
              )}

              {!isFromExternal && isOwner && listing.is_boosted && (
                <div className="mt-4 w-full flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 py-3 rounded-xl font-semibold">
                  <i
                    className="fa-solid fa-check-circle text-sm"
                    aria-hidden="true"
                  />
                  This listing is boosted
                </div>
              )}
            </div>

            {/* Posted by section — only for internal listings */}
            {!isFromExternal && listing.profiles && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Posted by
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-ys-100 rounded-full flex items-center justify-center">
                    <i
                      className="fa-solid fa-user text-ys-700"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {listing.profiles.display_name || "YardShoppers Seller"}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">
                        Joined{" "}
                        {new Date(listing.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </p>
                      {hostAvgRating !== null && (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                          <i className="fa-solid fa-star text-yellow-400 text-[10px]" />
                          {hostAvgRating} ({hostTotalRatings})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!user && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-xs text-amber-800">
                      <Link
                        href="/login"
                        className="font-semibold underline hover:no-underline"
                      >
                        Log in
                      </Link>{" "}
                      to contact the seller or save this listing.
                    </p>
                  </div>
                )}
              </div>
            )}

            <p className="text-center">
              <button
                onClick={() => {
                  if (!user) {
                    window.location.href = "/login";
                    return;
                  }
                  setShowReportModal(true);
                }}
                className="text-xs text-gray-400 hover:text-red-500 transition"
              >
                <i
                  className="fa-regular fa-flag mr-1"
                  aria-hidden="true"
                />
                Report this listing
              </button>
            </p>
          </div>
        </div>
      </div>

      {showBoostModal && listing && (
        <BoostModal
          listingId={listing.id}
          listingTitle={listing.title}
          onClose={() => setShowBoostModal(false)}
        />
      )}

      {showReportModal && listing && (
        <ReportModal
          listingId={listing.id}
          listingTitle={listing.title}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {showMessageModal && listing && !isFromExternal && (
        <MessageModal
          receiverId={listing.user_id}
          receiverName={listing.profiles?.display_name || "Seller"}
          listingId={listing.id}
          listingTitle={listing.title}
          onClose={() => setShowMessageModal(false)}
        />
      )}

      <RouteFloatingBar listingId={listing.id} listingTitle={listing.title} />
    </article>
  );
}
