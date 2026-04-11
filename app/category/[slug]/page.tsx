"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import JsonLd from "@/components/JsonLd";
import {
  getCategoryTrending,
  getCategoryStats,
  getHotNearby,
  generateOfferCatalogSchema,
  generateCollectionPageSchema,
  generateItemListSchema,
} from "@/lib/seo-signals";
import { useLocation } from "@/lib/useLocation";
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

interface CategoryMeta {
  name: string;
  slug: string;
  icon: string;
  color: string;
  bgColor: string;
  summary: string;
  tips: string[];
  priceRange: string;
}

const CATEGORY_DATA: CategoryMeta[] = [
  {
    name: "Furniture",
    slug: "furniture",
    icon: "fa-couch",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    summary:
      "Yard sales are one of the best places to find quality furniture at a fraction of retail. From solid wood dressers to vintage mid-century pieces, sellers often price furniture to move fast on sale day.",
    tips: [
      "Arrive early — large furniture goes first",
      "Bring a truck or trailer for same-day pickup",
      "Check drawers, joints, and legs before buying",
      "Negotiate harder on items that are difficult to move",
    ],
    priceRange: "$5 – $200+",
  },
  {
    name: "Electronics",
    slug: "electronics",
    icon: "fa-laptop",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    summary:
      "Electronics at yard sales range from working laptops and gaming consoles to cables and accessories. Test items on-site when possible and ask about age and condition upfront.",
    tips: [
      "Ask to plug in and test before buying",
      "Check for included chargers and accessories",
      "Older electronics can still have great resale value",
      "Look for brand names at generic prices",
    ],
    priceRange: "$2 – $150+",
  },
  {
    name: "Clothing",
    slug: "clothing",
    icon: "fa-shirt",
    color: "text-pink-700",
    bgColor: "bg-pink-50",
    summary:
      "Yard sale clothing ranges from everyday basics to designer finds. Many sellers price clothing by the bag or bundle, making it one of the best value categories for shoppers.",
    tips: [
      "Look for brand labels — designer items get priced like everything else",
      "Check for stains, tears, and missing buttons",
      "Ask if there are bundle deals or bag pricing",
      "Kids clothing is almost always a great deal",
    ],
    priceRange: "$0.50 – $25",
  },
  {
    name: "Toys & Games",
    slug: "toys-games",
    icon: "fa-puzzle-piece",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    summary:
      "Board games, puzzles, action figures, and outdoor toys are yard sale staples. Families regularly sell gently used toys their kids have outgrown at steep discounts.",
    tips: [
      "Check board games for all pieces before buying",
      "Battery-operated toys — ask for a demo",
      "Vintage toys and games can be worth more than the asking price",
      "Buy in bulk for extra savings",
    ],
    priceRange: "$0.50 – $20",
  },
  {
    name: "Tools",
    slug: "tools",
    icon: "fa-wrench",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    summary:
      "Hand tools, power tools, and workshop equipment are among the highest-value finds at yard sales. Quality tools hold their value and are often sold well below market price.",
    tips: [
      "Inspect for rust, cracks, and worn handles",
      "Power tools — ask to plug in and test the motor",
      "Look for complete sets rather than individual pieces",
      "Name brands like DeWalt, Makita, and Craftsman are always worth checking",
    ],
    priceRange: "$1 – $100+",
  },
  {
    name: "Kitchen",
    slug: "kitchen",
    icon: "fa-utensils",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    summary:
      "Kitchen items are among the most common yard sale finds — from small appliances and cookware to dishes and utensils. Cast iron, Pyrex, and name-brand appliances are frequent hidden gems.",
    tips: [
      "Cast iron and Pyrex are always worth grabbing",
      "Check small appliances for power cords",
      "Complete dish sets are more valuable than singles",
      "Vintage kitchen items can have high resale value",
    ],
    priceRange: "$0.50 – $50",
  },
  {
    name: "Sports",
    slug: "sports",
    icon: "fa-football",
    color: "text-green-700",
    bgColor: "bg-green-50",
    summary:
      "Sports equipment at yard sales includes everything from bikes and golf clubs to exercise machines and seasonal gear. Families often sell outgrown equipment at a fraction of retail.",
    tips: [
      "Test bikes for brake and gear function",
      "Golf clubs — check grip condition and shaft flex",
      "Exercise equipment is heavy so sellers price to move",
      "Look for cleats and gear at the start of each season",
    ],
    priceRange: "$2 – $100+",
  },
  {
    name: "Books",
    slug: "books",
    icon: "fa-book",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    summary:
      "Books are always priced to sell at yard sales — often $0.25 to $2 each. Look for first editions, out-of-print titles, and complete series. Textbooks and reference books can also be great finds.",
    tips: [
      "Check spines and pages for water damage",
      "First editions and signed copies are collector gold",
      "Ask for bulk pricing — most sellers will deal",
      "Children's books in good condition have great resale value",
    ],
    priceRange: "$0.25 – $5",
  },
  {
    name: "Antiques",
    slug: "antiques",
    icon: "fa-hourglass-half",
    color: "text-yellow-800",
    bgColor: "bg-yellow-50",
    summary:
      "Antiques at yard sales can range from genuine valuable finds to charming vintage decor. Estate sales are especially rich hunting grounds for antique furniture, glassware, and collectibles.",
    tips: [
      "Look for maker's marks and signatures",
      "Estate sales tend to have higher quality antiques",
      "Research before you buy — phone lookups are free",
      "Condition matters but patina adds character and value",
    ],
    priceRange: "$5 – $500+",
  },
  {
    name: "Garden",
    slug: "garden",
    icon: "fa-seedling",
    color: "text-lime-700",
    bgColor: "bg-lime-50",
    summary:
      "Garden tools, pots, outdoor furniture, and lawn equipment are seasonal yard sale staples. Spring and early summer sales are the best time to find gardening deals.",
    tips: [
      "Check for cracks in ceramic and clay pots",
      "Gas-powered equipment — ask for a cold start demo",
      "Wrought iron furniture is durable and always worth grabbing",
      "Look for plant starts and seed packets too",
    ],
    priceRange: "$1 – $75+",
  },
  {
    name: "Baby & Kids",
    slug: "baby-kids",
    icon: "fa-baby",
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    summary:
      "Baby and kids items are among the best yard sale deals — children outgrow things fast and parents sell gently used gear at huge discounts. Strollers, car seats, cribs, and clothing are always available.",
    tips: [
      "Check car seats for expiration dates and recall status",
      "Clothing lots and bundles are the best value",
      "Test stroller wheels, brakes, and folding mechanisms",
      "Wooden toys and educational items hold up well",
    ],
    priceRange: "$0.50 – $75",
  },
  {
    name: "Vehicles",
    slug: "vehicles",
    icon: "fa-car",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    summary:
      "Occasionally, yard sales feature vehicles — from project cars and motorcycles to ATVs and boats. Estate sales are the most common source. Always verify title and registration before purchasing.",
    tips: [
      "Always ask to see the title before negotiating",
      "Check VIN history online before buying",
      "Bring a knowledgeable friend for mechanical inspection",
      "Negotiate hard — sellers want these gone",
    ],
    priceRange: "$200 – $5,000+",
  },
  {
    name: "Free Stuff",
    slug: "free-stuff",
    icon: "fa-gift",
    color: "text-red-600",
    bgColor: "bg-red-50",
    summary:
      "Many yard sales have a free pile — items the seller wants gone regardless of price. Free stuff ranges from books and clothing to furniture and household items. Always worth checking!",
    tips: [
      "Check the free pile first — best finds go fast",
      "Ask if unlabeled items are negotiable to free",
      "End-of-day visits often yield more free items",
      "Free piles are great for upcycling and craft projects",
    ],
    priceRange: "Free",
  },
];

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { city, region, lat, lng } = useLocation();
  const [trending, setTrending] = useState<any[]>([]);
  const [nearby, setNearby] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const category = CATEGORY_DATA.find((c) => c.slug === slug);

  useEffect(() => {
    if (!category) return;

    async function fetchData() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const [trendingData, statsData] = await Promise.all([
        getCategoryTrending(category!.name, 12),
        getCategoryStats(category!.name),
      ]);

      setTrending(trendingData);
      setStats(statsData);

      if (lat && lng) {
        // Filter trending by proximity for "nearby" tab
        const nearbyData = trendingData.filter((l: any) => {
          if (!l.latitude || !l.longitude) return false;
          const dist = Math.sqrt(
            Math.pow(l.latitude - lat, 2) + Math.pow(l.longitude - lng, 2)
          );
          return dist < 0.72; // ~50 miles
        });
        setNearby(nearbyData);
      }

      setLoading(false);
    }
    fetchData();
  }, [slug, lat, lng]);

  if (!category) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
          <i className="fa-solid fa-tag text-3xl text-gray-300" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h1>
        <p className="text-gray-500 mb-6">This category doesn&apos;t exist yet.</p>
        <Link
          href="/browse"
          className="px-6 py-2.5 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-semibold transition"
        >
          Browse All Sales
        </Link>
      </div>
    );
  }

  const pageUrl = `https://www.yardshoppers.com/category/${category.slug}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Schemas */}
      <JsonLd
        data={generateCollectionPageSchema(
          `${category.name} — Yard Sales`,
          category.summary,
          pageUrl
        )}
      />
      <JsonLd
        data={generateOfferCatalogSchema(category.name, trending)}
      />
      {trending.length > 0 && (
        <JsonLd
          data={generateItemListSchema(
            trending,
            `Trending ${category.name} Yard Sales`,
            `The most popular ${category.name.toLowerCase()} listings on YardShoppers.`
          )}
        />
      )}

      {/* Breadcrumb */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.yardshoppers.com" },
            { "@type": "ListItem", position: 2, name: "Categories", item: "https://www.yardshoppers.com/browse" },
            { "@type": "ListItem", position: 3, name: category.name, item: pageUrl },
          ],
        }}
      />

      {/* Breadcrumb nav */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-ys-800 transition">Home</Link>
        <i className="fa-solid fa-chevron-right text-[10px] text-gray-300" aria-hidden="true" />
        <Link href="/browse" className="hover:text-ys-800 transition">Browse</Link>
        <i className="fa-solid fa-chevron-right text-[10px] text-gray-300" aria-hidden="true" />
        <span className="text-gray-900 font-medium">{category.name}</span>
      </nav>

      {/* Hero */}
      <section className={`${category.bgColor} rounded-3xl p-8 sm:p-10 mb-8`}>
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
            <i className={`fa-solid ${category.icon} text-2xl ${category.color}`} aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              {category.name} at Yard Sales
            </h1>
            <p className="text-gray-600 leading-relaxed mb-4">
              {category.summary}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/browse?category=${encodeURIComponent(category.name)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-semibold text-sm transition-all hover:shadow-lg"
              >
                <i className="fa-solid fa-magnifying-glass text-xs" aria-hidden="true" />
                Browse {category.name}
              </Link>
              <Link
                href="/post"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 hover:border-ys-600 text-gray-700 hover:text-ys-800 rounded-full font-semibold text-sm transition-all"
              >
                <i className="fa-solid fa-plus text-xs" aria-hidden="true" />
                Post a Sale
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      {stats && stats.totalListings > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-gray-900">{stats.totalListings}</p>
            <p className="text-xs text-gray-500 mt-1">Active Listings</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-gray-900">{stats.totalViews.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Total Views</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-ys-800">{category.priceRange}</p>
            <p className="text-xs text-gray-500 mt-1">Typical Price Range</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-gray-900">{stats.priceDropCount}</p>
            <p className="text-xs text-gray-500 mt-1">Price Drops</p>
          </div>
        </div>
      )}

      {/* Shopper tips */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          <i className="fa-solid fa-lightbulb text-amber-500 mr-2" aria-hidden="true" />
          Shopper Tips for {category.name}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {category.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-6 h-6 bg-ys-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-ys-700">{i + 1}</span>
              </div>
              <p className="text-sm text-gray-700">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Local insights */}
      {city && nearby.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            <i className="fa-solid fa-location-dot text-ys-600 mr-2" aria-hidden="true" />
            {category.name} Near {city}{region ? `, ${region}` : ""}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {nearby.slice(0, 6).map((listing) => (
              <ListingCard key={listing.id} listing={listing} currentUserId={currentUserId} />
            ))}
          </div>
        </section>
      )}

      {/* Trending in category */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            <i className="fa-solid fa-fire text-orange-500 mr-2" aria-hidden="true" />
            Trending {category.name}
          </h2>
          <Link
            href={`/browse?category=${encodeURIComponent(category.name)}`}
            className="text-sm text-ys-700 hover:text-ys-900 font-semibold transition"
          >
            View All <i className="fa-solid fa-arrow-right text-xs ml-1" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-2xl mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : trending.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <i className={`fa-solid ${category.icon} text-3xl text-gray-300 mb-3`} aria-hidden="true" />
            <p className="text-gray-500 text-sm mb-4">
              No {category.name.toLowerCase()} listings yet. Be the first to post!
            </p>
            <Link
              href="/post"
              className="inline-flex items-center gap-2 px-5 py-2 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-semibold text-sm transition"
            >
              <i className="fa-solid fa-plus text-xs" aria-hidden="true" />
              Post a Sale
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trending.map((listing) => (
              <div key={listing.id} className="relative">
                {listing.view_count > 0 && (
                  <div className="absolute top-3 right-3 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <i className="fa-solid fa-fire text-[8px]" aria-hidden="true" />
                    {listing.view_count} views
                  </div>
                )}
                <ListingCard listing={listing} currentUserId={currentUserId} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related categories */}
      <section className="bg-gray-50 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Explore Other Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORY_DATA.filter((c) => c.slug !== slug)
            .slice(0, 8)
            .map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="flex items-center gap-3 bg-white border border-gray-100 hover:border-ys-300 rounded-xl px-4 py-3 transition-all hover:shadow-sm group"
              >
                <div className={`w-9 h-9 ${cat.bgColor} rounded-lg flex items-center justify-center shrink-0`}>
                  <i className={`fa-solid ${cat.icon} text-sm ${cat.color}`} aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-ys-800 truncate">
                  {cat.name}
                </span>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
