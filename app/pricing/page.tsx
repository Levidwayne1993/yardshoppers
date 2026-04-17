import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Boost Your Listing — Featured Yard Sale Listings",
  description:
    "Get more eyes on your yard sale with a boosted listing on YardShoppers. Featured listings appear first in search results and get up to 5x more views.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Boost Your Listing on YardShoppers",
    description:
      "Featured listings get up to 5x more views. Boost your yard sale for just $2.99.",
    url: "https://www.yardshoppers.com/pricing",
    type: "website",
  },
};

const features = [
  {
    icon: "fa-arrow-up",
    title: "Priority Placement",
    description: "Your listing appears at the top of browse results and map views before all standard listings.",
  },
  {
    icon: "fa-eye",
    title: "Up to 5x More Views",
    description: "Boosted listings get significantly more visibility, which means more buyers showing up to your sale.",
  },
  {
    icon: "fa-bolt",
    title: "Highlighted Badge",
    description: "A special badge makes your listing stand out visually so buyers notice it instantly while scrolling.",
  },
  {
    icon: "fa-clock",
    title: "Lasts Until Your Sale Ends",
    description: "Your boost stays active until your sale date passes. No daily limits or hidden expiration.",
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
          Get More Buyers at Your Sale
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Boost your listing to reach more shoppers in your area. One small
          investment, way more foot traffic.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="max-w-md mx-auto mb-14">
        <div className="bg-white border-2 border-ys-600 rounded-2xl p-8 shadow-lg text-center relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ys-600 text-white text-xs font-bold px-4 py-1 rounded-full">
            Most Popular
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <i className="fa-solid fa-rocket text-2xl text-amber-900" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Boosted Listing
          </h2>
          <p className="text-4xl font-extrabold text-ys-800 mb-1">
            $2.99
          </p>
          <p className="text-sm text-gray-500 mb-6">One-time fee per listing</p>
          <ul className="text-left space-y-3 mb-8">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-ys-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <i className={`fa-solid ${feature.icon} text-xs text-ys-700`} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{feature.title}</p>
                  <p className="text-xs text-gray-500">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/post"
            className="block w-full py-3 bg-ys-800 hover:bg-ys-900 text-white rounded-xl font-semibold transition text-center"
          >
            Post &amp; Boost Your Sale
          </Link>
        </div>
      </div>

      {/* Free vs Boosted Comparison */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm mb-14">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Free vs. Boosted
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 pr-4 text-gray-500 font-medium">Feature</th>
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Free Listing</th>
                <th className="text-center py-3 pl-4 text-ys-800 font-bold">Boosted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                ["Listed on YardShoppers", true, true],
                ["Visible on map", true, true],
                ["Upload photos", true, true],
                ["Share link", true, true],
                ["Priority in search results", false, true],
                ["Highlighted badge", false, true],
                ["Top of browse page", false, true],
                ["Up to 5x more views", false, true],
              ].map(([feature, free, boosted], i) => (
                <tr key={i}>
                  <td className="py-3 pr-4 text-gray-700">{feature as string}</td>
                  <td className="py-3 px-4 text-center">
                    {free ? (
                      <i className="fa-solid fa-check text-green-500" aria-hidden="true" />
                    ) : (
                      <i className="fa-solid fa-xmark text-gray-300" aria-hidden="true" />
                    )}
                  </td>
                  <td className="py-3 pl-4 text-center">
                    {boosted ? (
                      <i className="fa-solid fa-check text-ys-600" aria-hidden="true" />
                    ) : (
                      <i className="fa-solid fa-xmark text-gray-300" aria-hidden="true" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-14">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Common Questions
        </h2>
        <div className="space-y-3 max-w-2xl mx-auto">
          {[
            {
              q: "When do I pay for the boost?",
              a: "You can boost your listing after posting it from the listing detail page or your seller dashboard.",
            },
            {
              q: "Can I boost more than one listing?",
              a: "Yes! Each listing can be boosted independently for $2.99 each.",
            },
            {
              q: "Is posting a sale still free?",
              a: "Absolutely. Posting is always free. Boosting is completely optional.",
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept all major credit and debit cards through Stripe.",
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
      </div>

      <div className="text-center">
        <p className="text-gray-500 text-sm">
          Questions?{" "}
          <Link href="/contact" className="text-ys-800 font-semibold hover:underline">
            Contact us
          </Link>{" "}
          — we&apos;re happy to help.
        </p>
      </div>
    </div>
  );
}
