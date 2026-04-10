export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: string;
  image?: string;
  imageAlt?: string;
  featured?: boolean;
  tags: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-have-a-successful-yard-sale",
    title: "How to Have a Successful Yard Sale in 2026: The Complete Guide",
    description:
      "Everything you need to know to plan, price, promote, and profit from your yard sale. A step-by-step guide for first-timers and experienced sellers.",
    category: "Selling Guide",
    publishedAt: "2026-04-10",
    readTime: "8 min read",
    featured: true,
    tags: ["yard sale tips", "selling", "pricing", "how to"],
  },
  {
    slug: "best-things-to-buy-at-yard-sales",
    title: "25 Best Things to Buy at Yard Sales (And What to Skip)",
    description:
      "Smart shoppers know yard sales are goldmines — if you know what to look for. Here are the 25 best items to buy and the ones you should always skip.",
    category: "Buying Guide",
    publishedAt: "2026-04-10",
    readTime: "6 min read",
    featured: true,
    tags: ["yard sale finds", "buying", "deals", "tips"],
  },
  {
    slug: "how-to-price-items-for-yard-sale",
    title: "How to Price Items for a Yard Sale: Pricing Guide With Examples",
    description:
      "Not sure how to price your stuff? This yard sale pricing guide covers furniture, electronics, clothing, toys, and more — with real price examples.",
    category: "Selling Guide",
    publishedAt: "2026-04-10",
    readTime: "7 min read",
    featured: true,
    tags: ["pricing", "selling", "yard sale tips"],
  },
  {
    slug: "spring-yard-sale-season-guide",
    title: "Spring Yard Sale Season 2026: When, Where, and How to Find the Best Sales",
    description:
      "Spring is the biggest yard sale season of the year. Learn when sales start in your area, how to find them, and tips for making the most of every stop.",
    category: "Seasonal",
    publishedAt: "2026-04-10",
    readTime: "5 min read",
    tags: ["spring", "seasonal", "yard sale season", "finding sales"],
  },
  {
    slug: "garage-sale-vs-yard-sale-vs-estate-sale",
    title: "Garage Sale vs. Yard Sale vs. Estate Sale: What's the Difference?",
    description:
      "Yard sale, garage sale, tag sale, estate sale — what do they all mean? We break down the differences so you know exactly what to expect as a buyer or seller.",
    category: "Guide",
    publishedAt: "2026-04-10",
    readTime: "4 min read",
    tags: ["garage sale", "estate sale", "yard sale", "differences"],
  },
];

export function getAllPosts(): BlogPost[] {
  return blogPosts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter((post) => post.featured);
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const current = getPostBySlug(currentSlug);
  if (!current) return [];

  return blogPosts
    .filter((post) => post.slug !== currentSlug)
    .filter(
      (post) =>
        post.category === current.category ||
        post.tags.some((tag) => current.tags.includes(tag))
    )
    .slice(0, limit);
}
