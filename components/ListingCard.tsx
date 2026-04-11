"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import CountdownTimer from "./CountdownTimer";
import BoostModal from "./BoostModal";
import BoostBadge from "./BoostBadge";
import BoostProgressBar from "./BoostProgressBar";

const CATEGORY_COLORS: Record<string, string> = {
  Furniture: "bg-amber-100 text-amber-800",
  Electronics: "bg-blue-100 text-blue-800",
  Clothing: "bg-pink-100 text-pink-800",
  "Toys & Games": "bg-purple-100 text-purple-800",
  Tools: "bg-slate-100 text-slate-800",
  Kitchen: "bg-orange-100 text-orange-800",
  Sports: "bg-lime-100 text-lime-800",
  Books: "bg-teal-100 text-teal-800",
  Antiques: "bg-yellow-100 text-yellow-800",
  Garden: "bg-emerald-100 text-emerald-800",
  "Baby & Kids": "bg-rose-100 text-rose-800",
  Vehicles: "bg-cyan-100 text-cyan-800",
  "Free Stuff": "bg-green-100 text-green-800",
};

interface ListingCardProps {
  listing: any;
  currentUserId?: string | null;
}

export default function ListingCard({
  listing,
  currentUserId,
}: ListingCardProps) {
  const [saved, setSaved] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);

  const photos = listing.listing_photos || [];
  const coverPhoto = photos[0]?.photo_url;

  let categories: string[] = [];
  if (Array.isArray(listing.category)) {
    categories = listing.category;
  } else if (typeof listing.category === "string") {
    categories = listing.category.includes(",")
      ? listing.category.split(",").map((c: string) => c.trim())
      : [listing.category];
  }

  const isOwner = currentUserId && listing.user_id === currentUserId;
  const isBoosted = listing.is_boosted;

  return (
    <>
      <div
        className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${
          isBoosted
            ? "border-amber-200 shadow-md shadow-amber-100/50"
            : "border-gray-100 shadow-sm"
        }`}
      >
        <Link href={`/listing/${listing.id}`} className="block relative">
          <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
            {coverPhoto ? (
              <Image
                src={coverPhoto}
                alt={listing.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-ys-50">
                <i className="fa-solid fa-tag text-3xl text-ys-300 mb-1" />
                <p className="text-xs text-ys-400">No photo</p>
              </div>
            )}

            {/* ✅ NEW: Tier-aware BoostBadge replaces hardcoded badge */}
            {isBoosted && (
              <div className="absolute top-3 left-3">
                <BoostBadge
                  tierKey={listing.boost_tier}
                  expiresAt={listing.boost_expires_at}
                />
              </div>
            )}

            {categories.length > 0 && (
              <div className="absolute top-3 right-3 flex flex-wrap gap-1 justify-end max-w-[60%]">
                {categories.slice(0, 3).map((cat) => (
                  <span
                    key={cat}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      CATEGORY_COLORS[cat] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {cat}
                  </span>
                ))}
                {categories.length > 3 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                    +{categories.length - 3}
                  </span>
                )}
              </div>
            )}

            {photos.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-medium px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1">
                <i className="fa-solid fa-images" />
                {photos.length}
              </div>
            )}

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSaved(!saved);
              }}
              className={`absolute bottom-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                saved
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-gray-400 hover:text-red-500"
              }`}
            >
              <i
                className={`${saved ? "fa-solid" : "fa-regular"} fa-heart text-xs`}
              />
            </button>
          </div>
        </Link>

        <div className="p-4">
          <Link href={`/listing/${listing.id}`}>
            <h3 className="font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-ys-800 transition-colors">
              {listing.title}
            </h3>
          </Link>

          {listing.price && (
            <p className="text-lg font-extrabold text-ys-800 mt-1">
              {listing.price}
            </p>
          )}

          {(listing.city || listing.state) && (
            <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
              <i className="fa-solid fa-location-dot text-[10px] text-ys-500" />
              {[listing.city, listing.state].filter(Boolean).join(", ")}
            </p>
          )}

          {listing.sale_date && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <i className="fa-regular fa-calendar text-[10px] text-ys-500" />
              {new Date(listing.sale_date + "T00:00:00").toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric" }
              )}
            </p>
          )}

          {listing.sale_date && (
            <div className="mt-2">
              <CountdownTimer
                saleDate={listing.sale_date}
                saleTimeStart={listing.sale_time_start}
                saleTimeEnd={listing.sale_time_end}
              />
            </div>
          )}

          {/* ✅ NEW: Show live countdown bar for owners with active boosts */}
          {isOwner && isBoosted && (
            <div className="mt-3">
              <BoostProgressBar
                tierKey={listing.boost_tier}
                startsAt={listing.boost_started_at}
                expiresAt={listing.boost_expires_at}
              />
            </div>
          )}

          {isOwner && !isBoosted && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowBoostModal(true);
              }}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-900 py-2 rounded-xl text-sm font-bold transition-all hover:shadow-md"
            >
              <i className="fa-solid fa-rocket text-xs" />
              Boost This Listing
            </button>
          )}

          {isOwner && isBoosted && (
            <div className="mt-3 w-full flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 py-2 rounded-xl text-sm font-semibold">
              <i className="fa-solid fa-check-circle text-xs" />
              Boosted
            </div>
          )}
        </div>
      </div>

      {showBoostModal && (
        <BoostModal
          listingId={listing.id}
          listingTitle={listing.title}
          onClose={() => setShowBoostModal(false)}
        />
      )}
    </>
  );
}
