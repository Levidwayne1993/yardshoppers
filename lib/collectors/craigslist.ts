import { RawExternalListing, CollectorResult } from "@/types/external";

const CRAIGSLIST_REGIONS = [
  { subdomain: "seattle", city: "Seattle", state: "WA" },
  { subdomain: "portland", city: "Portland", state: "OR" },
  { subdomain: "sfbay", city: "San Francisco", state: "CA" },
  { subdomain: "losangeles", city: "Los Angeles", state: "CA" },
  { subdomain: "chicago", city: "Chicago", state: "IL" },
  { subdomain: "newyork", city: "New York", state: "NY" },
  { subdomain: "austin", city: "Austin", state: "TX" },
  { subdomain: "dallas", city: "Dallas", state: "TX" },
  { subdomain: "denver", city: "Denver", state: "CO" },
  { subdomain: "miami", city: "Miami", state: "FL" },
  { subdomain: "atlanta", city: "Atlanta", state: "GA" },
  { subdomain: "boston", city: "Boston", state: "MA" },
  { subdomain: "phoenix", city: "Phoenix", state: "AZ" },
  { subdomain: "minneapolis", city: "Minneapolis", state: "MN" },
  { subdomain: "detroit", city: "Detroit", state: "MI" },
  { subdomain: "olympia", city: "Olympia", state: "WA" },
  { subdomain: "tacoma", city: "Tacoma", state: "WA" },
];

function parseRssItem(
  xml: string,
  region: (typeof CRAIGSLIST_REGIONS)[number]
): RawExternalListing[] {
  const listings: RawExternalListing[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const getTag = (tag: string): string => {
      const tagMatch = itemXml.match(
        new RegExp(`<${tag}><!\

\[CDATA\

\[([\\s\\S]*?)\\]

\\]

><\\/${tag}>`)
      );
      if (tagMatch) return tagMatch[1].trim();
      const simpleMatch = itemXml.match(
        new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`)
      );
      return simpleMatch ? simpleMatch[1].trim() : "";
    };

    const title = getTag("title");
    const link = getTag("link");
    const description = getTag("description");
    const pubDate = getTag("dc:date") || getTag("pubDate");

    if (!title || !link) continue;

    const idMatch = link.match(/\/(\d+)\.html/);
    const sourceId = idMatch ? idMatch[1] : link;

    const priceMatch = title.match(/\$[\d,]+/);

    let saleDate: string | undefined;
    if (pubDate) {
      try {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) {
          saleDate = d.toISOString().split("T")[0];
        }
      } catch {
        // skip invalid date
      }
    }

    const latMatch = itemXml.match(
      /<geo:lat>([\d.-]+)<\/geo:lat>/
    );
    const lngMatch = itemXml.match(
      /<geo:long>([\d.-]+)<\/geo:long>/
    );

    listings.push({
      source_id: `craigslist-${region.subdomain}-${sourceId}`,
      source_url: link,
      title: title.replace(/&#x0024;/g, "$").replace(/<[^>]+>/g, ""),
      description: description.replace(/<[^>]+>/g, "").slice(0, 2000),
      city: region.city,
      state: region.state,
      latitude: latMatch ? parseFloat(latMatch[1]) : undefined,
      longitude: lngMatch ? parseFloat(lngMatch[1]) : undefined,
      price: priceMatch ? priceMatch[0] : undefined,
      sale_date: saleDate,
      categories: inferCategories(title + " " + description),
      raw_data: { region: region.subdomain, pubDate },
    });
  }

  return listings;
}

function inferCategories(text: string): string[] {
  const categories: string[] = [];
  const lower = text.toLowerCase();

  const categoryMap: Record<string, string[]> = {
    Furniture: ["furniture", "couch", "sofa", "table", "chair", "desk", "dresser", "bed", "shelf"],
    Electronics: ["electronics", "tv", "computer", "laptop", "phone", "speaker", "gaming", "console"],
    Clothing: ["clothing", "clothes", "shoes", "jacket", "dress", "shirt", "pants", "jeans"],
    "Toys & Games": ["toys", "games", "lego", "puzzle", "board game", "doll", "action figure"],
    Tools: ["tools", "drill", "saw", "hammer", "wrench", "power tool", "hand tool"],
    Kitchen: ["kitchen", "cookware", "dishes", "pots", "pans", "appliance", "blender"],
    Sports: ["sports", "bike", "bicycle", "golf", "tennis", "fishing", "camping", "hiking"],
    Books: ["books", "book", "novel", "textbook", "magazine", "comic"],
    Antiques: ["antique", "vintage", "retro", "collectible", "collector", "rare", "old"],
    Garden: ["garden", "plant", "lawn", "mower", "outdoor", "patio", "landscaping"],
    "Baby & Kids": ["baby", "kids", "children", "stroller", "crib", "toddler", "infant"],
    Vehicles: ["car", "truck", "motorcycle", "boat", "trailer", "vehicle", "auto"],
    "Free Stuff": ["free", "curb", "curbside", "giveaway"],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      categories.push(category);
    }
  }

  return categories.length > 0 ? categories.slice(0, 3) : [];
}

export async function collectCraigslist(): Promise<CollectorResult> {
  const allListings: RawExternalListing[] = [];
  const errors: string[] = [];

  for (const region of CRAIGSLIST_REGIONS) {
    try {
      const url = `https://${region.subdomain}.craigslist.org/search/gms?format=rss&sort=date`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "YardShoppers/1.0 (https://www.yardshoppers.com)",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        errors.push(`Craigslist ${region.subdomain}: HTTP ${res.status}`);
        continue;
      }

      const xml = await res.text();
      const listings = parseRssItem(xml, region);
      allListings.push(...listings);

      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (err) {
      errors.push(
        `Craigslist ${region.subdomain}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return {
    source: "craigslist",
    listings: allListings,
    errors,
    collected_at: new Date().toISOString(),
  };
}
