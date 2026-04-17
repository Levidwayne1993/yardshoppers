import { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getFeaturedPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Yard Sale & Garage Sale Tips, Guides & News",
  description:
    "Expert tips and guides for yard sale and garage sale buyers and sellers. Learn how to price items, find the best sales near you, and make the most of every deal.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Yard Sale & Garage Sale Tips, Guides & News — YardShoppers",
    description:
      "Expert tips and guides for yard sale and garage sale buyers and sellers.",
    url: "https://www.yardshoppers.com/blog",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "YardShoppers Blog — Yard Sale and Garage Sale Tips",
      },
    ],
  },
};

export default function BlogPage() {
  const allPosts = getAllPosts();
  const featuredPosts = getFeaturedPosts();
  const regularPosts = allPosts.filter((p) => !p.featured);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
          Yard Sale &amp; Garage Sale Tips
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Guides, tips, and inspiration to help you buy smarter and sell faster
          at yard sales, garage sales, and estate sales.
        </p>
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="mb-16">
          <h2 className="text-sm font-semibold text-ys-800 uppercase tracking-wider mb-6">
            Featured Guides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-ys-200 transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-ys-800 bg-ys-100 px-2.5 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-400">{post.readTime}</span>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-ys-800 transition mb-2 leading-snug">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-3">
                  {post.description}
                </p>
                <div className="mt-4 text-sm font-semibold text-ys-800 group-hover:underline">
                  Read guide →
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Posts */}
      {regularPosts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
            More Articles
          </h2>
          <div className="space-y-4">
            {regularPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex items-start gap-5 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-ys-200 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-ys-800 bg-ys-100 px-2.5 py-0.5 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {post.readTime}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <time
                      className="text-xs text-gray-400"
                      dateTime={post.publishedAt}
                    >
                      {new Date(
                        post.publishedAt + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-ys-800 transition mb-1">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {post.description}
                  </p>
                </div>
                <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-gray-50 group-hover:bg-ys-50 rounded-full shrink-0 mt-2 transition">
                  <i
                    className="fa-solid fa-arrow-right text-sm text-gray-400 group-hover:text-ys-700 transition"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <div className="mt-16 bg-gradient-to-br from-ys-50 to-ys-100 border border-ys-200 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Find yard sales and garage sales near you
        </h2>
        <p className="text-sm text-gray-600 mb-5">
          Browse thousands of local sales happening this weekend.
        </p>
        <Link
          href="/browse"
          className="inline-block px-8 py-3 bg-ys-800 hover:bg-ys-900 text-white rounded-full font-semibold transition"
        >
          Browse Sales Near You
        </Link>
      </div>
    </div>
  );
}
