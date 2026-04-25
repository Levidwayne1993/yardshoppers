// ============================================================
// FILE: app/yard-sales/page.tsx
// PLACE AT: app/yard-sales/page.tsx  (REPLACE your existing file)
// WHY: Your current file has [city] dynamic-route code that
//      causes a 404 at /yard-sales. This is the proper
//      "View All Cities" index page.
// NOTE: Only imports that ACTUALLY EXIST in lib/cities.ts are
//       used: City (interface) and cities (array).
//       getStates / getCitiesByState DO NOT EXIST — state
//       grouping is derived here from the cities array.
// ============================================================

import Link from 'next/link';
import type { Metadata } from 'next';
import { cities, type City } from '@/lib/cities';

/* ─── SEO Metadata ─── */
export const metadata: Metadata = {
  title: 'Yard Sales by City | YardShoppers',
  description:
    'Browse yard sales and garage sales in over 400 cities across the United States. Find local deals near you on YardShoppers.',
  openGraph: {
    title: 'Yard Sales by City | YardShoppers',
    description:
      'Browse yard sales and garage sales in over 400 cities across the United States. Find local deals near you on YardShoppers.',
    url: 'https://yardshoppers.com/yard-sales',
    siteName: 'YardShoppers',
    type: 'website',
  },
  alternates: {
    canonical: 'https://yardshoppers.com/yard-sales',
  },
};

/* ─── JSON-LD Structured Data ─── */
function JsonLd() {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://yardshoppers.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Yard Sales by City',
        item: 'https://yardshoppers.com/yard-sales',
      },
    ],
  };

  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Yard Sales by City',
    description:
      'Browse yard sales and garage sales in over 400 cities across the United States.',
    url: 'https://yardshoppers.com/yard-sales',
    numberOfItems: cities.length,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collection) }}
      />
    </>
  );
}

/* ─── Helper: group cities by state, sorted alphabetically ─── */
function getStateGroups(): { code: string; name: string; cities: City[] }[] {
  const stateMap = new Map<string, { name: string; cities: City[] }>();

  for (const city of cities) {
    const existing = stateMap.get(city.stateCode);
    if (existing) {
      existing.cities.push(city);
    } else {
      stateMap.set(city.stateCode, {
        name: city.state,
        cities: [city],
      });
    }
  }

  return Array.from(stateMap.entries())
    .map(([code, data]) => ({
      code,
      name: data.name,
      cities: data.cities.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* ─── Page Component ─── */
export default function YardSalesIndexPage() {
  const stateGroups = getStateGroups();

  return (
    <>
      <JsonLd />

      <main className="min-h-screen bg-gray-50">
        {/* ── Hero / Header ── */}
        <section className="bg-ys-green text-white py-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              <i className="fa-solid fa-map-location-dot mr-2" />
              Yard Sales by City
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
              Browse yard sales and garage sales in{' '}
              <span className="font-semibold">{cities.length}+ cities</span>{' '}
              across all 50 states. Click any city to see active listings nearby.
            </p>
          </div>
        </section>

        {/* ── Breadcrumb ── */}
        <nav className="max-w-6xl mx-auto px-4 py-4 text-sm text-gray-500">
          <ol className="flex items-center gap-1 flex-wrap">
            <li>
              <Link href="/" className="hover:text-ys-green transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-800 font-medium">Yard Sales by City</li>
          </ol>
        </nav>

        {/* ── Quick-Jump Alphabet Bar ── */}
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-2 font-medium">
              <i className="fa-solid fa-arrow-down-a-z mr-1" />
              Jump to a state:
            </p>
            <div className="flex flex-wrap gap-2">
              {stateGroups.map((s) => (
                <a
                  key={s.code}
                  href={`#state-${s.code}`}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-ys-green hover:text-white transition-colors"
                >
                  {s.code}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── States + Cities Grid ── */}
        <div className="max-w-6xl mx-auto px-4 pb-16 space-y-10">
          {stateGroups.map((state) => (
            <section
              key={state.code}
              id={`state-${state.code}`}
              className="scroll-mt-24"
            >
              {/* State header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-ys-green/10 text-ys-green">
                  <i className="fa-solid fa-location-dot text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {state.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {state.cities.length}{' '}
                    {state.cities.length === 1 ? 'city' : 'cities'}
                  </p>
                </div>
              </div>

              {/* City cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {state.cities.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/yard-sales/${city.slug}`}
                    className="group flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-ys-green/40 transition-all"
                  >
                    <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-ys-green/10 text-ys-green group-hover:bg-ys-green group-hover:text-white transition-colors">
                      <i className="fa-solid fa-tag text-sm" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-ys-green transition-colors">
                        {city.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Pop. {city.population}
                      </p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-xs text-gray-300 ml-auto group-hover:text-ys-green transition-colors" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <section className="bg-ys-green/5 border-t border-gray-200 py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Don&apos;t see your city?
            </h2>
            <p className="text-gray-600 mb-6">
              We&apos;re adding new cities all the time. You can still browse all
              sales near your location right now.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-ys-green text-white font-semibold rounded-xl shadow hover:bg-ys-green/90 transition-colors"
            >
              <i className="fa-solid fa-magnifying-glass" />
              Browse All Sales
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
