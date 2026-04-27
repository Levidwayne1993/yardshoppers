import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how YardShoppers helps you find, save, and visit yard sales near you — or post your own for free in under 2 minutes.",
  alternates: {
    canonical: "/how-it-works",
  },
  openGraph: {
    type: "website",
    url: "https://www.yardshoppers.com/how-it-works",
    title: "How YardShoppers Works",
    description:
      "Find yard sales near you, plan your route, and never miss a deal. Or post your own sale for free.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "How YardShoppers Works",
      },
    ],
  },
};

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
        How YardShoppers Works
      </h1>
      <p className="text-gray-500 mb-12">
        Whether you&apos;re hunting for deals or selling your stuff, we make it
        simple.
      </p>

      {/* ── FOR BUYERS ── */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-ys-100 text-ys-700 text-sm">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          </span>
          For Buyers
        </h2>

        <div className="space-y-8">
          {[
            {
              step: "1",
              title: "Search",
              desc: "Enter your city or let us detect your location. Filter by radius, date, and category to find exactly what you\u2019re looking for \u2014 furniture, electronics, free stuff, and more.",
              icon: "fa-location-dot",
              color: "bg-ys-100 text-ys-700",
            },
            {
              step: "2",
              title: "Save",
              desc: "Tap the heart on any listing to save it. Build your list of must-visit sales and come back to them anytime from your Saved Sales page.",
              icon: "fa-heart",
              color: "bg-rose-100 text-rose-600",
            },
            {
              step: "3",
              title: "Plan Your Route",
              desc: "Open the Route Planner to map out the most efficient path between your saved sales. Hit multiple yard sales in one trip without backtracking.",
              icon: "fa-route",
              color: "bg-blue-100 text-blue-600",
            },
            {
              step: "4",
              title: "Visit & Score Deals",
              desc: "Get directions, show up early, and grab the best finds before anyone else. Check listing details and photos ahead of time so you know what to expect.",
              icon: "fa-bag-shopping",
              color: "bg-amber-100 text-amber-600",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="relative">
                <div
                  className={`w-10 h-10 ${item.color.split(" ")[0]} rounded-xl flex items-center justify-center shrink-0`}
                >
                  <i
                    className={`fa-solid ${item.icon} text-sm ${item.color.split(" ")[1]}`}
                    aria-hidden="true"
                  />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-ys-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.step}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mt-1">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-200 mb-14" />

      {/* ── FOR SELLERS ── */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-600 text-sm">
            <i className="fa-solid fa-tag" aria-hidden="true" />
          </span>
          For Sellers
        </h2>

        <div className="space-y-8">
          {[
            {
              step: "1",
              title: "Create Your Listing",
              desc: "Sign up for free, then tap \u201CPost a Sale.\u201D Add your title, address, date, time, categories, description, and photos. It takes less than 2 minutes.",
              icon: "fa-pen-to-square",
              color: "bg-green-100 text-green-600",
            },
            {
              step: "2",
              title: "Reach Local Buyers",
              desc: "Your sale instantly appears to shoppers searching your area. They can see your photos, get directions, and save your sale to their route.",
              icon: "fa-users",
              color: "bg-purple-100 text-purple-600",
            },
            {
              step: "3",
              title: "Boost for More Eyes (Optional)",
              desc: "Want more visibility? Boost your listing to get up to 25x more views, priority placement in search results, and a featured pin on the Route Planner map.",
              icon: "fa-rocket",
              color: "bg-amber-100 text-amber-600",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="relative">
                <div
                  className={`w-10 h-10 ${item.color.split(" ")[0]} rounded-xl flex items-center justify-center shrink-0`}
                >
                  <i
                    className={`fa-solid ${item.icon} text-sm ${item.color.split(" ")[1]}`}
                    aria-hidden="true"
                  />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-ys-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.step}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mt-1">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Common Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "Is YardShoppers free?",
              a: "Yes \u2014 browsing, saving, and posting yard sales is 100% free. Optional boosts are available if you want extra visibility.",
            },
            {
              q: "Do I need an account to browse?",
              a: "No. You can browse and search without an account. You\u2019ll need one to save listings, message sellers, or post a sale.",
            },
            {
              q: "How does the Route Planner work?",
              a: "Select the sales you want to visit, and the Route Planner maps the most efficient driving route between them. It works on desktop and mobile.",
            },
            {
              q: "What can I sell?",
              a: "Anything you\u2019d sell at a yard sale, garage sale, or estate sale \u2014 furniture, electronics, clothing, tools, toys, antiques, and more.",
            },
          ].map((faq) => (
            <div
              key={faq.q}
              className="p-4 bg-gray-50 border border-gray-200 rounded-xl"
            >
              <h3 className="font-bold text-gray-900 text-sm">{faq.q}</h3>
              <p className="text-sm text-gray-600 mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="p-6 bg-ys-50 border border-ys-100 rounded-2xl text-center">
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
  );
}
