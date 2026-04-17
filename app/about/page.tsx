import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "YardShoppers is the easiest way to find and post yard sales, garage sales, and estate sales in your neighborhood. Learn about our mission to help communities buy local and reduce waste.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    type: "website",
    url: "https://www.yardshoppers.com/about",
    title: "About YardShoppers",
    description:
      "Learn about our mission to connect yard sale buyers and sellers in every neighborhood.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "About YardShoppers" }],
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
        About YardShoppers
      </h1>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-600 leading-relaxed">
        <p>
          YardShoppers started with a simple idea: yard sales shouldn&apos;t be
          hard to find. Every weekend, thousands of sales pop up across
          neighborhoods — packed with furniture, electronics, vintage finds, and
          hidden gems — but most of them never get discovered.
        </p>

        <p>
          We built YardShoppers to change that. Whether you&apos;re a seasoned
          treasure hunter or just looking to grab a great deal down the street,
          our platform makes it easy to browse, save, and plan your route to the
          best sales near you.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">
          Our Mission
        </h2>
        <p>
          We&apos;re on a mission to keep great stuff out of landfills and money
          in your pocket. Every item resold at a yard sale is one less thing
          thrown away — and one more win for your wallet and the planet.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">
          For Buyers
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Browse yard sales by location, category, and date</li>
          <li>Save your favorite listings and get notified about new sales nearby</li>
          <li>Plan multi-stop routes to hit every sale in one trip</li>
          <li>View photos and details before you drive</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">
          For Sellers
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Post your sale for free in under 2 minutes</li>
          <li>Upload photos, set your date and time, and list categories</li>
          <li>Reach thousands of local shoppers without printing a single sign</li>
          <li>Boost your listing for more visibility</li>
        </ul>

        <div className="mt-12 p-6 bg-ys-50 border border-ys-100 rounded-2xl text-center">
          <p className="text-lg font-bold text-gray-900 mb-2">
            Ready to get started?
          </p>
          <p className="text-sm text-gray-600 mb-5">
            Join thousands of buyers and sellers in your neighborhood.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/browse"
              className="px-6 py-2.5 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-semibold transition"
            >
              Browse Sales
            </Link>
            <Link
              href="/post"
              className="px-6 py-2.5 border-2 border-ys-800 text-ys-800 hover:bg-ys-800 hover:text-white rounded-full font-semibold transition"
            >
              Post a Sale
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
