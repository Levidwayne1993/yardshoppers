import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Yard Sale Tips — How to Have a Successful Sale",
  description:
    "Expert tips for hosting a yard sale that actually makes money. Learn pricing strategies, display ideas, signage tips, and the best times to sell.",
  alternates: { canonical: "/tips" },
  openGraph: {
    title: "Yard Sale Tips — How to Have a Successful Sale",
    description:
      "Expert tips for hosting a yard sale that actually makes money.",
    url: "https://www.yardshoppers.com/tips",
    type: "article",
  },
};

const tips = [
  {
    icon: "fa-calendar-check",
    title: "Pick the Right Date",
    description:
      "Saturday mornings are prime time. Avoid holiday weekends when people are traveling. Spring and early fall get the most foot traffic.",
  },
  {
    icon: "fa-tags",
    title: "Price Everything",
    description:
      "Sticker every single item. Shoppers skip things without prices. Use round numbers — $1, $5, $10 — and be ready to negotiate.",
  },
  {
    icon: "fa-camera",
    title: "Take Great Photos",
    description:
      "Good photos sell listings. Shoot in natural light, show your best items up close, and take a wide shot of your full setup.",
  },
  {
    icon: "fa-signs-post",
    title: "Make Signs That Pop",
    description:
      "Big, bold letters on bright poster board. Include your address and an arrow. Place signs at major intersections within a mile.",
  },
  {
    icon: "fa-table-cells-large",
    title: "Display Like a Store",
    description:
      "Use tables — not the ground. Group similar items together. Hang clothing on a rack. Make it easy to browse and touch.",
  },
  {
    icon: "fa-clock",
    title: "Start Early, End on Time",
    description:
      "Serious buyers show up at 7–8 AM. Post your start time and stick to it. Plan to wrap up by early afternoon.",
  },
  {
    icon: "fa-money-bill-wave",
    title: "Have Change Ready",
    description:
      "Start with at least $50 in small bills and coins. Consider accepting Venmo or Cash App for bigger items.",
  },
  {
    icon: "fa-bullhorn",
    title: "Promote Online",
    description:
      "Post your sale on YardShoppers, Facebook Marketplace, Craigslist, and Nextdoor. The more places, the more buyers.",
  },
  {
    icon: "fa-arrow-down-wide-short",
    title: "Drop Prices After Noon",
    description:
      "Cut prices by 50% after lunch. Your goal is to sell everything — not take it back inside. Consider a 'fill a bag for $5' deal.",
  },
  {
    icon: "fa-hand-holding-heart",
    title: "Donate What's Left",
    description:
      "Schedule a donation pickup for the same afternoon. Goodwill, Salvation Army, and local charities will often come to you.",
  },
];

export default function TipsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How to Have a Successful Yard Sale",
            description:
              "A step-by-step guide to hosting a yard sale that attracts buyers and makes the most money.",
            step: tips.map((tip, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: tip.title,
              text: tip.description,
            })),
          }),
        }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Yard Sale Tips That Actually Work
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Whether it&apos;s your first sale or your fiftieth, these proven
            tips will help you attract more buyers and make more money.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-14">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-ys-100 rounded-xl flex items-center justify-center shrink-0">
                  <i
                    className={`fa-solid ${tip.icon} text-ys-700`}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 mb-1">
                    {i + 1}. {tip.title}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {tip.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-ys-50 to-ys-100 border border-ys-200 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Ready to post your sale?
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            List your yard sale for free and reach thousands of local buyers.
          </p>
          <Link
            href="/post"
            className="inline-block px-8 py-3 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-semibold transition"
          >
            Post Your Sale — Free
          </Link>
        </div>
      </div>
    </>
  );
}
