"use client";

import { useState } from "react";
import { MapPin, Calendar, ExternalLink, Tag } from "lucide-react";

interface ExternalListing {
  id: string;
  source: string;
  source_url: string;
  title: string;
  description: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  sale_date: string | null;
  sale_time_start: string | null;
  sale_time_end: string | null;
  category: string | null;
  categories: string[];
  photo_urls: string[];
  address: string | null;
  collected_at: string | null;
}

interface ExternalListingCardProps {
  listing: ExternalListing;
  distance?: number | null;
}

var SOURCE_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  craigslist: { label: "Craigslist", bg: "bg-purple-100", text: "text-purple-800" },
  estatesales: { label: "EstateSales.net", bg: "bg-amber-100", text: "text-amber-800" },
  nextdoor: { label: "Nextdoor", bg: "bg-green-100", text: "text-green-800" },
};

export default function ExternalListingCard({ listing, distance }: ExternalListingCardProps) {
  var [imgError, setImgError] = useState(false);

  var sourceStyle = SOURCE_STYLES[listing.source] || {
    label: listing.source,
    bg: "bg-gray-100",
    text: "text-gray-800",
  };

  var hasPhoto = listing.photo_urls && listing.photo_urls.length > 0 && !imgError;

  var formattedDate = listing.sale_date
    ? new Date(listing.sale_date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  var locationText = [listing.city, listing.state].filter(Boolean).join(", ");

  return (
    <a
      href={listing.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-[#2E7D32]/30 transition-all duration-200"
    >
      <div className="relative w-full h-44 bg-gray-100 overflow-hidden">
        {hasPhoto ? (
          <img
            src={listing.photo_urls[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={function () { setImgError(true); }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
            <Tag className="w-10 h-10 text-gray-300" />
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold " + sourceStyle.bg + " " + sourceStyle.text}>
            {sourceStyle.label}
          </span>
        </div>

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/90 shadow-sm">
            <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
          </span>
        </div>

        {listing.category && (
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
              {listing.category}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-1.5 group-hover:text-[#2E7D32] transition-colors">
          {listing.title}
        </h3>

        {listing.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{listing.description}</p>
        )}

        {locationText && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{locationText}</span>
            {distance != null && (
              <span className="ml-auto text-[#2E7D32] font-medium flex-shrink-0">
                {distance < 1 ? "< 1 mi" : Math.round(distance) + " mi"}
              </span>
            )}
          </div>
        )}

        {formattedDate && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
        )}

        {listing.price != null && listing.price > 0 && (
          <div className="mt-1.5">
            <span className="text-sm font-bold text-[#2E7D32]">{"$" + listing.price.toFixed(0)}</span>
          </div>
        )}
      </div>
    </a>
  );
}
