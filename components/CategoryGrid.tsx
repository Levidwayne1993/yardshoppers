"use client";

import Link from "next/link";

const CATEGORIES = [
  { name: "Furniture", slug: "furniture", icon: "fa-couch", color: "text-amber-700", bg: "bg-amber-50" },
  { name: "Electronics", slug: "electronics", icon: "fa-laptop", color: "text-blue-700", bg: "bg-blue-50" },
  { name: "Clothing", slug: "clothing", icon: "fa-shirt", color: "text-pink-700", bg: "bg-pink-50" },
  { name: "Toys & Games", slug: "toys-games", icon: "fa-puzzle-piece", color: "text-purple-700", bg: "bg-purple-50" },
  { name: "Tools", slug: "tools", icon: "fa-wrench", color: "text-gray-700", bg: "bg-gray-100" },
  { name: "Kitchen", slug: "kitchen", icon: "fa-utensils", color: "text-orange-700", bg: "bg-orange-50" },
  { name: "Sports", slug: "sports", icon: "fa-football", color: "text-green-700", bg: "bg-green-50" },
  { name: "Books", slug: "books", icon: "fa-book", color: "text-emerald-700", bg: "bg-emerald-50" },
  { name: "Antiques", slug: "antiques", icon: "fa-hourglass-half", color: "text-yellow-800", bg: "bg-yellow-50" },
  { name: "Garden", slug: "garden", icon: "fa-seedling", color: "text-lime-700", bg: "bg-lime-50" },
  { name: "Baby & Kids", slug: "baby-kids", icon: "fa-baby", color: "text-sky-700", bg: "bg-sky-50" },
  { name: "Vehicles", slug: "vehicles", icon: "fa-car", color: "text-indigo-700", bg: "bg-indigo-50" },
  { name: "Free Stuff", slug: "free-stuff", icon: "fa-gift", color: "text-red-600", bg: "bg-red-50" },
];

export default function CategoryGrid() {
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">
          <i className="fa-solid fa-grid-2 text-ys-600 mr-2 text-lg" aria-hidden="true" />
          Shop by Category
        </h2>
        <Link
          href="/browse"
          className="text-sm text-ys-700 hover:text-ys-900 font-semibold transition"
        >
          Browse All <i className="fa-solid fa-arrow-right text-xs ml-1" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="group flex items-center gap-3 bg-white border border-gray-100 hover:border-ys-300 rounded-xl px-4 py-3.5 transition-all hover:shadow-md"
          >
            <div
              className={`w-10 h-10 ${cat.bg} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
            >
              <i
                className={`fa-solid ${cat.icon} text-sm ${cat.color}`}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-gray-700 group-hover:text-ys-800 block truncate">
                {cat.name}
              </span>
              <span className="text-[10px] text-gray-400 group-hover:text-ys-500 transition">
                View deals →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
