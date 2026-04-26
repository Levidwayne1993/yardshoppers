import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  getAllCities,
  getCityBySlug,
  getNearestCities,
} from "@/lib/cities";

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  const cities = getAllCities();
  return cities.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return {};

  const title = `Yard Sales & Garage Sales in ${city.name}, ${city.stateCode} — Find Sales Near You`;
  const description = `Find yard sales and garage sales happening in ${city.name}, ${city.stateCode} this weekend. Browse listings, see photos, and plan your route to the best sales near you.`;

  return {
    title,
    description,
    alternates: { canonical: `/yard-sales/${city.slug}` },
    openGraph: {
      title,
      description,
      url: `https://www.yardshoppers.com/yard-sales/${city.slug}`,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `Yard Sales and Garage Sales in ${city.name}, ${city.stateCode}`,
        },
      ],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

async function getListingsForCity(cityName: string, stateCode: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const today = new Date().toISOString().split("T")[0];

    // Query user-posted listings
    const { data: userListings } = await supabase
      .from("listings")
      .select("*")
      .or(`city.ilike.%${cityName}%,address.ilike.%${cityName}%`)
      .gte("sale_date", today)
      .order("sale_date", { ascending: true })
      .limit(100);

    // Query external/aggregated listings (scraped sales)
    const { data: extListings } = await supabase
      .from("external_sales")
      .select("*")
      .or(`city.ilike.%${cityName}%,address.ilike.%${cityName}%`)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("collected_at", { ascending: false })
      .limit(100);

    // Normalize external listings to match user listing shape
    const normalizedExt = (extListings || []).map((ext) => ({
      id: ext.id,
      title: ext.title,
      description: ext.description,
      address: ext.address,
      city: ext.city,
      state: ext.state,
      sale_date: ext.sale_date,
      sale_time_start: ext.sale_time_start,
      sale_time_end: ext.sale_time_end,
      category: ext.category,
      categories: ext.categories,
      latitude: ext.latitude,
      longitude: ext.longitude,
      photo_urls: ext.photo_urls,
      source_url: ext.source_url,
      is_external: true,
    }));

    // Merge: user-posted first, then external
    const merged = [...(userListings || []), ...normalizedExt];
    return merged;
  } catch {
    return [];
  }
}

export default async function CityPage({ params }: Props) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  const listings = await getListingsForCity(city.name, city.stateCode);
  const nearbyCities = getNearestCities(city.lat, city.lng, 6, city.slug);

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Yard Sales & Garage Sales in ${city.name}, ${city.stateCode}`,
    description: `Find yard sales and garage sales in ${city.name}, ${city.stateCode}. Browse local listings with photos, dates, and directions.`,
    url: `https://www.yardshoppers.com/yard-sales/${city.slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "YardShoppers",
      url: "https://www.yardshoppers.com",
    },
    about: {
      "@type": "City",
      name: city.name,
      containedInPlace: {
        "@type": "State",
        name: city.state,
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.yardshoppers.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Yard Sales by City",
        item: "https://www.yardshoppers.com/yard-sales",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${city.name}, ${city.stateCode}`,
        item: `https://www.yardshoppers.com/yard-sales/${city.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-gray-500 mb-8"
        >
          <Link href="/" className="hover:text-ys-800 transition">
            Home
          </Link>
          <i
            className="fa-solid fa-chevron-right text-[10px] text-gray-300"
            aria-hidden="true"
          />
          <Link href="/yard-sales" className="hover:text-ys-800 transition">
            Yard Sales by City
          </Link>
          <i
            className="fa-solid fa-chevron-right text-[10px] text-gray-300"
            aria-hidden="true"
          />
          <span className="text-gray-900 font-medium">
            {city.name}, {city.stateCode}
          </span>
        </nav>

        {/* Hero Section */}
        <header className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Yard Sales &amp; Garage Sales in {city.name},{" "}
            {city.stateCode}
          </h1>
          <p className="text-lg text-gray-500 max-w-3xl">
            {city.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link
              href={`/browse?location=${encodeURIComponent(city.name + ", " + city.stateCode)}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-semibold transition"
            >
              <i
                className="fa-solid fa-map-marker-alt"
                aria-hidden="true"
              />
              Browse Sales in {city.name}
            </Link>
            <Link
              href="/post"
              className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-ys-800 text-ys-800 hover:bg-ys-800 hover:text-white rounded-full font-semibold transition"
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
              Post a Sale in {city.name}
            </Link>
          </div>
        </header>

        {/* Active Listings */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {listings.length > 0
              ? `Upcoming Yard Sales in ${city.name}`
              : `No Sales Listed Yet in ${city.name}`}
          </h2>

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing: Record<string, any>) => (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-ys-200 transition-all"
                >
                  <h3 className="font-bold text-gray-900 group-hover:text-ys-800 transition mb-1 line-clamp-1">
                    {listing.title}
                  </h3>
                  {listing.sale_date && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                      <i
                        className="fa-regular fa-calendar text-xs"
                        aria-hidden="true"
                      />
                      <time dateTime={listing.sale_date}>
                        {new Date(
                          listing.sale_date + "T00:00:00"
                        ).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                  )}
                  {listing.address && (
                    <p className="text-sm text-gray-400 line-clamp-1">
                      <i
                        className="fa-solid fa-location-dot mr-1"
                        aria-hidden="true"
                      />
                      {listing.address}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-ys-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i
                  className="fa-solid fa-map-pin text-xl text-ys-700"
                  aria-hidden="true"
                />
              </div>
              <p className="text-gray-600 mb-2">
                No yard sales or garage sales are currently listed in{" "}
                {city.name}.
              </p>
              <p className="text-sm text-gray-400 mb-5">
                Be the first to post a sale and reach local buyers!
              </p>
              <Link
                href="/post"
                className="inline-block px-6 py-2.5 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-semibold transition"
              >
                Post a Free Listing
              </Link>
            </div>
          )}
        </section>

        {/* Local Tips Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Yard Sale &amp; Garage Sale Tips for {city.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-ys-100 rounded-xl flex items-center justify-center mb-3">
                <i
                  className="fa-solid fa-magnifying-glass text-ys-700"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Finding Sales</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Browse{" "}
                <Link
                  href={`/browse?location=${encodeURIComponent(city.name + ", " + city.stateCode)}`}
                  className="text-ys-800 hover:underline font-medium"
                >
                  yard sales in {city.name}
                </Link>{" "}
                on YardShoppers. Check Facebook Marketplace, Craigslist, and
                Nextdoor for additional listings. Drive through popular
                neighborhoods on Saturday mornings &mdash; many sales
                aren&apos;t posted online.
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-ys-100 rounded-xl flex items-center justify-center mb-3">
                <i
                  className="fa-solid fa-route text-ys-700"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Plan Your Route</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Use the{" "}
                <Link
                  href="/route-planner"
                  className="text-ys-800 hover:underline font-medium"
                >
                  YardShoppers Route Planner
                </Link>{" "}
                to map out multiple garage sales in {city.name} and hit them all
                in one morning. Start early &mdash; the best finds go fast.
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-ys-100 rounded-xl flex items-center justify-center mb-3">
                <i
                  className="fa-solid fa-tags text-ys-700"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                Selling in {city.name}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                <Link
                  href="/post"
                  className="text-ys-800 hover:underline font-medium"
                >
                  Post your yard sale
                </Link>{" "}
                for free on YardShoppers to reach {city.name} buyers. Add
                photos, set your date, and share the link on social media for
                maximum visibility.
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-ys-100 rounded-xl flex items-center justify-center mb-3">
                <i
                  className="fa-solid fa-book-open text-ys-700"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Read Our Guides</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                New to yard sales? Check out our{" "}
                <Link
                  href="/blog/how-to-have-a-successful-yard-sale"
                  className="text-ys-800 hover:underline font-medium"
                >
                  complete yard sale guide
                </Link>{" "}
                and{" "}
                <Link
                  href="/blog/how-to-price-items-for-yard-sale"
                  className="text-ys-800 hover:underline font-medium"
                >
                  pricing guide
                </Link>{" "}
                for expert tips.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {city.name} Yard Sale &amp; Garage Sale FAQs
          </h2>
          <div className="space-y-3">
            {[
              {
                q: `How do I find yard sales in ${city.name}?`,
                a: `The easiest way to find yard sales and garage sales in ${city.name}, ${city.stateCode} is to browse YardShoppers. You can search by date, category, and location. You can also check Facebook Marketplace, Craigslist, and Nextdoor, or drive through neighborhoods on Saturday mornings.`,
              },
              {
                q: `When is yard sale season in ${city.name}?`,
                a: `In ${city.name}, ${city.stateCode}, yard sale season typically runs from ${
                  city.stateCode === "AZ" || city.stateCode === "NV"
                    ? "October through April when the weather is cooler"
                    : city.stateCode === "FL"
                    ? "year-round thanks to the warm climate, with fall and spring being the busiest"
                    : city.stateCode === "CA"
                    ? "year-round, with spring and fall weekends being the most popular"
                    : "April through October, with spring and early fall weekends being the busiest"
                }. Saturday mornings from 7–8 AM are the most popular start times.`,
              },
              {
                q: `Is it free to post a yard sale in ${city.name} on YardShoppers?`,
                a: `Yes! Posting a yard sale or garage sale on YardShoppers is 100% free. You can optionally boost your listing for more visibility starting at $2.99. Just go to the Post a Sale page, add your details and photos, and your listing will be live in minutes.`,
              },
              {
                q: `Do I need a permit for a yard sale in ${city.name}?`,
                a: `Yard sale permit requirements vary by city. Some cities in ${city.state} require a free permit or limit the number of sales per year. Check with the ${city.name} city clerk or local government website for current regulations.`,
              },
            ].map((item, i) => (
              <details
                key={i}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm cursor-pointer"
              >
                <summary className="font-semibold text-gray-800">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm text-gray-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Nearby Cities */}
        {nearbyCities.length > 0 && (
          <section className="mb-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Yard Sales in Nearby Cities
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {nearbyCities.map((nearby) => (
                <Link
                  key={nearby.slug}
                  href={`/yard-sales/${nearby.slug}`}
                  className="group bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-ys-200 transition-all text-center"
                >
                  <div className="w-9 h-9 bg-ys-50 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-ys-100 transition">
                    <i
                      className="fa-solid fa-location-dot text-sm text-ys-700"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-ys-800 transition text-sm">
                    {nearby.name}, {nearby.stateCode}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {nearby.population} people
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <div className="bg-gradient-to-br from-ys-50 to-ys-100 border border-ys-200 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Host a yard sale or garage sale in {city.name}
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            List your sale for free and reach thousands of buyers in{" "}
            {city.name}, {city.stateCode}.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/post"
              className="px-6 py-2.5 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-semibold transition"
            >
              Post Your Sale &mdash; Free
            </Link>
            <Link
              href="/browse"
              className="px-6 py-2.5 border-2 border-ys-800 text-ys-800 hover:bg-ys-800 hover:text-white rounded-full font-semibold transition"
            >
              Browse All Sales
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
