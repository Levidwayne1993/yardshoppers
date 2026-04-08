"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import CountdownTimer from "./CountdownTimer";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    description?: string;
    price?: string;
    city?: string;
    state?: string;
    category?: string;
    categories?: string[];
    sale_date?: string;
    sale_time_start?: string;
    sale_time_end?: string;
    created_at?: string;
    is_boosted?: boolean;
    listing_photos?: { photo_url: string }[];
  };
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [saved, setSaved] = useState(false);

  const photo =
    listing.listing_photos && listing.listing_photos.length > 0
      ? listing.listing_photos[0].photo_url
      : null;

  const location = [listing.city, listing.state]
    .filter(Boolean)
    .join(", ");

  const saleDay = listing.sale_date
    ? new Date(listing.sale_date + "T00:00:00").toLocaleDateString(
        "en-US",
        { weekday: "short", month: "short", day: "numeric" }
      )
    : null;

  const displayCategories: string[] =
    listing.categories && listing.categories.length > 0
      ? listing.categories
      : listing.category
      ? [listing.category]
      : [];

  function badgeColor(cat: string) {
    const colors: Record<string, string> = {
      Furniture: "bg-amber-100 text-amber-800",
      Electronics: "bg-blue-100 text-blue-800",
      Clothing: "bg-pink-100 text-pink-800",
      "Toys & Games": "bg-purple-100 text-purple-800",
      Tools: "bg-orange-100 text-orange-800",
      Kitchen: "bg-rose-100 text-rose-800",
      Sports: "bg-cyan-100 text-cyan-800",
      Books: "bg-indigo-100 text-indigo-800",
      Antiques: "bg-yellow-100 text-yellow-800",
      Garden: "bg-emerald-100 text-emerald-800",
      "Baby & Kids": "bg-teal-100 text-teal-800",
      Vehicles: "bg-slate-100 text-slate-800",
      "Free Stuff": "bg-green-100 text-green-800",
    };
    return colors[cat] || "bg-gray-100 text-gray-800";
  }

  return (
    <Link href={`/listing/${listing.id}`} className="group block">
      <div
        className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
          listing.is_boosted
            ? "border-2 border-amber-300 shadow-md"
            : "border border-gray-100"
        }`}
      >
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {photo ? (
            <Image
              src={photo}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-ys-50">
              <div className="text-center">
                <i className="fa-solid fa-tag text-4xl text-ys-300" />
                <p className="text-xs text-ys-400 mt-2">No photo yet</p>
              </div>
            </div>
          )}

          {displayCategories.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[70%]">
              {displayCategories.slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeColor(
                    cat
                  )}`}
                >
                  {cat}
                </span>
              ))}
              {displayCategories.length > 3 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                  +{displayCategories.length - 3}
                </span>
              )}
            </div>
          )}

          {listing.is_boosted && (
            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              🚀 Boosted
            </span>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSaved(!saved);
            }}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              saved
                ? "bg-red-500 text-white shadow-md"
                : "bg-white/90 text-gray-500 hover:text-red-500 hover:bg-white shadow-sm"
            }`}
            aria-label={saved ? "Unsave" : "Save"}
          >
            <i
              className={`${
                saved ? "fa-solid" : "fa-regular"
              } fa-heart text-sm`}
            />
          </button>

          {listing.listing_photos &&
            listing.listing_photos.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                <i className="fa-solid fa-images text-[10px]" />
                {listing.listing_photos.length}
              </div>
            )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-[15px] leading-snug line-clamp-2 group-hover:text-ys-800 transition-colors">
            {listing.title}
          </h3>

          {listing.price && (
            <p className="text-ys-800 font-bold text-lg mt-1.5">
              {listing.price}
            </p>
          )}

          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2.5 text-xs text-gray-500">
            {location && (
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-location-dot text-ys-600" />
                {location}
              </span>
            )}
            {saleDay && (
              <span className="flex items-center gap-1">
                <i className="fa-regular fa-calendar text-ys-600" />
                {saleDay}
              </span>
            )}
          </div>

          <div className="mt-2">
            <CountdownTimer
              saleDate={listing.sale_date}
              saleTimeStart={listing.sale_time_start}
              saleTimeEnd={listing.sale_time_end}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
