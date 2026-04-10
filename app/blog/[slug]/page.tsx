import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog";
import BlogPostContent from "./BlogPostContent";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url: `https://www.yardshoppers.com/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: ["YardShoppers"],
      tags: post.tags,
      images: [
        {
          url: post.image || "/og-image.png",
          width: 1200,
          height: 630,
          alt: post.imageAlt || post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = getRelatedPosts(slug, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      "@type": "Organization",
      name: "YardShoppers",
      url: "https://www.yardshoppers.com",
    },
    publisher: {
      "@type": "Organization",
      name: "YardShoppers",
      url: "https://www.yardshoppers.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.yardshoppers.com/og-image.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.yardshoppers.com/blog/${post.slug}`,
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
        name: "Blog",
        item: "https://www.yardshoppers.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://www.yardshoppers.com/blog/${post.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
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
          <Link href="/blog" className="hover:text-ys-800 transition">
            Blog
          </Link>
          <i
            className="fa-solid fa-chevron-right text-[10px] text-gray-300"
            aria-hidden="true"
          />
          <span className="text-gray-900 font-medium truncate max-w-[250px]">
            {post.title}
          </span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-ys-800 bg-ys-100 px-3 py-1 rounded-full">
              {post.category}
            </span>
            <span className="text-sm text-gray-400">{post.readTime}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-gray-500">{post.description}</p>
          <div className="flex items-center gap-3 mt-5 text-sm text-gray-400">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt + "T00:00:00").toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric", year: "numeric" }
              )}
            </time>
            <span>·</span>
            <span>By YardShoppers Team</span>
          </div>
        </header>

        {/* Article Body */}
        <BlogPostContent slug={post.slug} />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-ys-50 to-ys-100 border border-ys-200 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Find yard sales &amp; garage sales near you
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            Browse thousands of local sales happening this weekend.
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
              Post a Sale — Free
            </Link>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-ys-200 transition-all"
                >
                  <span className="text-xs font-semibold text-ys-800 bg-ys-100 px-2 py-0.5 rounded-full">
                    {related.category}
                  </span>
                  <h3 className="font-semibold text-gray-900 group-hover:text-ys-800 transition mt-2 mb-1 text-sm leading-snug">
                    {related.title}
                  </h3>
                  <p className="text-xs text-gray-400">{related.readTime}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
