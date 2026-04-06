"use client";
import Link from "next/link";

export function ListingCard({
  id,
  title,
  city,
  state,
  time,
  date,
  tags = [],
  image,
  badge,
}: {
  id: string | number;
  title: string;
  city: string;
  state: string;
  time: string;
  date: string;
  tags?: string[];
  image: string;
  badge?: "featured" | "estate" | null;
}) {
  return (
    <Link
      href={`/listing/${id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-200"
    >
      {/* IMAGE */}
      <div className="relative h-48 w-full">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover"
        />

        {/* BADGE */}
        {badge === "featured" && (
          <span className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
            ★ Featured
          </span>
        )}

        {badge === "estate" && (
          <span className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
            💎 Estate Sale
          </span>
        )}

        {/* SAVE BUTTON */}
        <button
          className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm w-9 h-9 rounded-full flex items-center justify-center hover:bg-white transition"
          onClick={(e) => {
            e.preventDefault();
            e.currentTarget.classList.toggle("saved");
          }}
        >
          <i className="fa-regular fa-heart"></i>
        </button>
      </div>

      {/* BODY */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{title}</h3>

        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
          <span>
            <i className="fa-solid fa-location-dot mr-1"></i>
            {city}, {state}
          </span>
          <span>
            <i className="fa-solid fa-clock mr-1"></i>
            {time}
          </span>
        </div>

        {/* TAGS */}
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            <i className="fa-regular fa-calendar mr-1"></i>
            {date}
          </span>

          <span className="text-emerald-600 font-semibold hover:underline">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}
