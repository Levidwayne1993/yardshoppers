"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import ListingCard from "@/components/ListingCard";

/* ── Category data ─────────────────────────── */
const CATEGORIES = [
  { name: "Furniture", emoji: "🛋️" },
  { name: "Electronics", emoji: "📱" },
  { name: "Clothing", emoji: "👕" },
  { name: "Toys & Games", emoji: "🎮" },
  { name: "Tools", emoji: "🔧" },
  { name: "Kitchen", emoji: "🍳" },
  { name: "Sports", emoji: "⚽" },
  { name: "Books", emoji: "📚" },
  { name: "Antiques", emoji: "🏺" },
  { name: "Garden", emoji: "🌿" },
  { name: "Baby & Kids", emoji: "👶" },
  { name: "Vehicles", emoji: "🚗" },
  { name: "Free Stuff", emoji: "🎁" },
];

/* ── How‑it‑works steps ────────────────────── */
const STEPS = [
  {
    icon: "fa-solid fa-magnifying-glass",
    title: "Search",
    text: "Browse yard sales by location, category, or keyword. Find exactly what you're looking for.",
  },
  {
    icon: "fa-solid fa-heart",
    title: "Save",
    text: "Save your favorite listings and get notified when new sales pop up in your area.",
  },
  {
    icon: "fa-solid fa-map-location-dot",
    title: "Visit",
    text: "Get directions, see sale times, and show up ready to score incredible deals.",
  },
];

/* ── Trust signals ─────────────────────────── */
const TRUST = [
  { icon: "fa-solid fa-dollar-sign", title: "100% Free", text: "Post and browse – always free" },
  { icon: "fa-solid fa-shield-halved", title: "Safe & Local", text: "Verified community sellers" },
  { icon: "fa-solid fa-bolt", title: "Instant Post", text: "Live in under 60 seconds" },
  { icon: "fa-solid fa-earth-americas", title: "Nationwide", text: "Every city, every state" },
];

export default function HomePage() {
  const supabase = createClient();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      const { data } = await supabase
        .from("listings")
        .select("*, listing_photos(*)")
        .order("is_boosted", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(6);
      setListings(data || []);
      setLoading(false);
    }
    fetchListings();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/browse?search=${encodeURIComponent(search.trim())}`);
    }
  }

  return (
    <>
      {/* ━━━━━ HERO ━━━━━ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ys-900 via-ys-800 to-ys-700 text-white">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ys-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-ys-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 text-sm font-medium mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-ys-400 rounded-full animate-pulse" />
            The #1 Yard Sale Marketplace
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight max-w-3xl mx-auto">
            Discover Amazing{" "}
            <span className="relative">
              <span className="relative z-10">Yard Sales</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-ys-500/40 rounded-sm -z-0" />
            </span>{" "}
            Near You
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-ys-200 max-w-2xl mx-auto leading-relaxed">
            Find hidden treasures in your neighborhood. Post your sale for free and
            reach thousands of local buyers.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-10 max-w-2xl mx-auto bg-white rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row gap-2"
          >
            <div className="flex items-center gap-3 flex-1 px-4 py-3">
              <i className="fa-solid fa-magnifying-glass text-ys-600" />
              <input
                type="text"
                placeholder="What are you looking for?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 outline-none text-base"
              />
            </div>
            <button
              type="submit"
              className="bg-ys-800 hover:bg-ys-900 text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:shadow-lg shrink-0"
            >
              Search Sales
            </button>
          </form>

          <div className="mt-14 flex flex-wrap justify-center gap-x-12 gap-y-4">
            {[
              ["10,000+", "Listings Posted"],
              ["500+", "Cities Covered"],
              ["50,000+", "Happy Shoppers"],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold">{num}</div>
                <div className="text-sm text-ys-300 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ CATEGORIES ━━━━━ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Browse by Category</h2>
            <p className="text-gray-500 mt-2">Find exactly what you&apos;re looking for</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/browse?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center gap-3 p-5 bg-ys-50 border border-ys-100 rounded-2xl hover:border-ys-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                  {cat.emoji}
                </span>
                <span className="text-sm font-semibold text-gray-800 group-hover:text-ys-800 transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ RECENT LISTINGS ━━━━━ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Recently Posted</h2>
              <p className="text-gray-500 mt-1">Fresh finds from your community</p>
            </div>
            <Link
              href="/browse"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-ys-800 hover:text-ys-900 transition"
            >
              View all <i className="fa-solid fa-arrow-right text-xs" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-5 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-ys-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <i className="fa-solid fa-tag text-3xl text-ys-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No listings yet &mdash; be the first!
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Your community is waiting. Post your yard sale and start reaching local buyers today.
              </p>
              <Link
                href="/post"
                className="inline-flex items-center gap-2 bg-ys-800 hover:bg-ys-900 text-white px-6 py-3 rounded-full font-semibold transition-all hover:shadow-lg"
              >
                <i className="fa-solid fa-plus text-sm" /> Post Your First Sale
              </Link>
            </div>
          )}

          {listings.length > 0 && (
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/browse"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ys-800 hover:text-ys-900 transition"
              >
                View all listings <i className="fa-solid fa-arrow-right text-xs" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ━━━━━ BOOST YOUR SALE CTA ━━━━━ */}
      <section className="py-16 bg-gradient-to-r from-amber-50 to-orange-50 border-y border-amber-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <i className="fa-solid fa-rocket text-xs" />
            New Feature
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Boost Your Sale to the Top 🚀
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            Want more buyers at your yard sale? Boosted listings appear{" "}
            <strong>first in search results</strong> and get up to{" "}
            <strong>10x more views</strong>.
          </p>
          <p className="text-3xl font-extrabold text-amber-600 mb-8">
            Just $2.99
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/post"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-3.5 rounded-full font-bold transition-all hover:shadow-lg"
            >
              <i className="fa-solid fa-plus text-sm" />
              Post &amp; Boost a Sale
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-900 font-semibold transition"
            >
              Boost an existing listing <i className="fa-solid fa-arrow-right text-xs" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: "fa-solid fa-arrow-up-wide-short", title: "Top Placement", text: "Always appears first in browse & search" },
              { icon: "fa-solid fa-eye", title: "10x More Views", text: "Stand out with a highlighted listing" },
              { icon: "fa-solid fa-bolt", title: "Instant Activation", text: "Goes live the moment you pay" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-2 p-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <i className={`${item.icon} text-amber-700`} />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                <p className="text-xs text-gray-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ HOW IT WORKS ━━━━━ */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">How YardShoppers Works</h2>
            <p className="text-gray-500 mt-2">Three simple steps to treasure hunting</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative text-center p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-ys-800 text-white text-sm font-bold rounded-full flex items-center justify-center shadow-md">
                  {i + 1}
                </div>
                <div className="w-14 h-14 bg-ys-100 rounded-2xl flex items-center justify-center mx-auto mb-5 mt-2">
                  <i className={`${step.icon} text-xl text-ys-700`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ TRUST SIGNALS ━━━━━ */}
      <section className="py-16 bg-ys-50 border-y border-ys-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST.map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-3 p-6">
                <div className="w-12 h-12 bg-ys-200 rounded-full flex items-center justify-center">
                  <i className={`${item.icon} text-lg text-ys-800`} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
