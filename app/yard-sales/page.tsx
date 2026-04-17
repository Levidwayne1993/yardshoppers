import { Metadata } from "next";
import Link from "next/link";
import { getAllCities, getStates } from "@/lib/cities";

export const metadata: Metadata = {
  title: "Yard Sales & Garage Sales by City — Find Sales Near You",
  description:
    "Browse yard sales and garage sales by city. Find local sales happening this weekend in your area. Covering 36+ cities across the United States.",
  alternates: { canonical: "/yard-sales" },
  openGraph: {
    title: "Yard Sales & Garage Sales by City — YardShoppers",
    description:
      "Browse yard sales and garage sales by city. Find local sales near you this weekend.",
    url: "https://www.yardshoppers.com/yard-sales",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Find Yard Sales and Garage Sales by City — YardShoppers",
      },
    ],
  },
};

export default function YardSalesCityIndex() {
  const allCities = getAllCities();
  const states = getStates();

  const citiesByState: Record<string, typeof allCities> = {};
  allCities.forEach((city) => {
    if (!citiesByState[city.stateCode]) {
      citiesByState[city.stateCode] = [];
    }
    citiesByState[city.stateCode].push(city);
  });

  return (
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
        <span className="text-gray-900 font-medium">Yard Sales by City</span>
      </nav>

      {/* Hero */}
      <header className="text-center mb-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
          Yard Sales &amp; Garage Sales by City
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Find yard sales, garage sales, and estate sales happening near you.
          Browse by city to discover local sales this weekend.
        </p>
      </header>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-14">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-2xl font-extrabold text-ys-800">
            {allCities.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Cities Covered</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-2xl font-extrabold text-ys-800">
            {states.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">States</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-2xl font-extrabold text-ys-800">Free</p>
          <p className="text-sm text-gray-500 mt-1">To List a Sale</p>
        </div>
      </div>

      {/* State Jump Links */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Jump to State
        </h2>
        <div className="flex flex-wrap gap-2">
          {states.map((state) => (
            <a
              key={state.code}
              href={`#${state.code}`}
              className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-ys-100 hover:text-ys-800 text-gray-700 rounded-full font-medium transition"
            >
              {state.name}
            </a>
          ))}
        </div>
      </div>

      {/* Cities by State */}
      <div className="space-y-12">
        {states.map((state) => (
          <section key={state.code} id={state.code}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-ys-100 rounded-lg flex items-center justify-center">
                <i
                  className="fa-solid fa-location-dot text-sm text-ys-700"
                  aria-hidden="true"
                />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {state.name}
              </h2>
              <span className="text-sm text-gray-400">
                {citiesByState[state.code].length}{" "}
                {citiesByState[state.code].length === 1 ? "city" : "cities"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {citiesByState[state.code].map((city) => (
                <Link
                  key={city.slug}
                  href={`/yard-sales/${city.slug}`}
                  className="group bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-ys-200 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-ys-800 transition">
                        {city.name}, {city.stateCode}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Pop. {city.population}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-gray-50 group-hover:bg-ys-50 rounded-full flex items-center justify-center shrink-0 transition">
                      <i
                        className="fa-solid fa-arrow-right text-xs text-gray-400 group-hover:text-ys-700 transition"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {city.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* SEO Content Section */}
      <section className="mt-16 mb-12">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            How to Find Yard Sales &amp; Garage Sales Near You
          </h2>
          <div className="prose prose-gray prose-sm max-w-none">
            <p>
              YardShoppers makes it easy to find yard sales, garage sales,
              estate sales, and tag sales in cities across the United States.
              Simply select your city above to see upcoming sales in your
              area, complete with photos, dates, and directions.
            </p>
            <h3>Tips for Finding the Best Sales</h3>
            <ul>
              <li>
                <strong>Start early:</strong> The best deals at yard sales and
                garage sales go fast. Arrive at 7–8 AM for the best selection.
              </li>
              <li>
                <strong>Plan a route:</strong> Use our{" "}
                <Link
                  href="/route-planner"
                  className="text-ys-800 hover:underline"
                >
                  Route Planner
                </Link>{" "}
                to hit multiple sales in one morning.
              </li>
              <li>
                <strong>Bring cash:</strong> Most yard sale sellers prefer
                small bills. Bring at least $40 in ones and fives.
              </li>
              <li>
                <strong>Check back often:</strong> New sales are posted daily,
                especially on Wednesday through Friday for upcoming weekend
                sales.
              </li>
            </ul>
            <h3>Hosting a Sale?</h3>
            <p>
              <Link
                href="/post"
                className="text-ys-800 hover:underline font-medium"
              >
                Post your yard sale or garage sale for free
              </Link>{" "}
              on YardShoppers and reach thousands of local buyers. Add photos,
              set your sale date, and share your listing link on social media
              for maximum visibility. Check out our{" "}
              <Link
                href="/blog/how-to-have-a-successful-yard-sale"
                className="text-ys-800 hover:underline font-medium"
              >
                complete yard sale guide
              </Link>{" "}
              for expert tips on pricing, setup, and promotion.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-br from-ys-50 to-ys-100 border border-ys-200 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Don&apos;t see your city?
        </h2>
        <p className="text-sm text-gray-600 mb-5">
          YardShoppers covers yard sales and garage sales nationwide. Browse
          all listings or post a sale in any location.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/browse"
            className="px-6 py-2.5 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-semibold transition"
          >
            Browse All Sales
          </Link>
          <Link
            href="/post"
            className="px-6 py-2.5 border-2 border-ys-800 text-ys-800 hover:bg-ys-800 hover:text-white rounded-full font-semibold transition"
          >
            Post a Sale — Free
          </Link>
        </div>
      </div>
    </div>
  );
}
