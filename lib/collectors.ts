import type { RawExternalListing, CollectorResult } from "@/types/external";

// ──────────────────────────────────────────────
// SHARED CONSTANTS & HELPERS
// ──────────────────────────────────────────────

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9," +
    "image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Cache-Control": "max-age=0",
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min = 1000, max = 3000): Promise<void> {
  return delay(Math.floor(Math.random() * (max - min + 1)) + min);
}

function extractTag(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractCdataContent(text: string): string {
  const cdataOpen = "<!" + "[CDATA[";
  const cdataClose = "]" + "]>";
  return text
    .replace(
      new RegExp(cdataOpen.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      ""
    )
    .replace(
      new RegExp(cdataClose.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      ""
    )
    .trim();
}

function guessCategory(
  title: string,
  description?: string
): string | undefined {
  const text = `${title} ${description || ""}`.toLowerCase();
  if (/estate\s*sale/i.test(text)) return "Estate Sale";
  if (/garage\s*sale/i.test(text)) return "Garage Sale";
  if (/yard\s*sale/i.test(text)) return "Yard Sale";
  if (/moving\s*sale/i.test(text)) return "Moving Sale";
  if (/multi[-\s]?family/i.test(text)) return "Multi-Family Sale";
  if (/church|charity|fundraiser/i.test(text)) return "Church / Charity Sale";
  if (/antique|vintage|collectible/i.test(text))
    return "Antiques & Collectibles";
  if (/tool|hardware|workshop/i.test(text)) return "Tools & Hardware";
  if (/furniture|couch|sofa|table|chair/i.test(text)) return "Furniture";
  if (/baby|kid|children|toy/i.test(text)) return "Baby & Kids";
  if (/electronic|computer|phone|tv/i.test(text)) return "Electronics";
  if (/cloth|fashion|shoe|dress/i.test(text)) return "Clothing";
  return undefined;
}

// ──────────────────────────────────────────────
// CRAIGSLIST COLLECTOR
// ──────────────────────────────────────────────

const CRAIGSLIST_REGIONS = [
  // Pacific Northwest (your home region)
  { id: "seattle", city: "Seattle", state: "WA" },
  { id: "tacoma", city: "Tacoma", state: "WA" },
  { id: "olympic", city: "Olympia", state: "WA" },
  { id: "portland", city: "Portland", state: "OR" },
  // Nationwide coverage
  { id: "sfbay", city: "San Francisco", state: "CA" },
  { id: "losangeles", city: "Los Angeles", state: "CA" },
  { id: "sandiego", city: "San Diego", state: "CA" },
  { id: "chicago", city: "Chicago", state: "IL" },
  { id: "newyork", city: "New York", state: "NY" },
  { id: "boston", city: "Boston", state: "MA" },
  { id: "denver", city: "Denver", state: "CO" },
  { id: "austin", city: "Austin", state: "TX" },
  { id: "dallas", city: "Dallas", state: "TX" },
  { id: "houston", city: "Houston", state: "TX" },
  { id: "atlanta", city: "Atlanta", state: "GA" },
  { id: "miami", city: "Miami", state: "FL" },
  { id: "tampa", city: "Tampa", state: "FL" },
  { id: "orlando", city: "Orlando", state: "FL" },
  { id: "phoenix", city: "Phoenix", state: "AZ" },
  { id: "philadelphia", city: "Philadelphia", state: "PA" },
  { id: "detroit", city: "Detroit", state: "MI" },
  { id: "minneapolis", city: "Minneapolis", state: "MN" },
];

export async function collectCraigslist(): Promise<CollectorResult> {
  const sales: RawExternalListing[] = [];
  const errors: string[] = [];

  for (const region of CRAIGSLIST_REGIONS) {
    try {
      const url = `https://openrss.org/${region.id}.craigslist.org/search/gms`;

      const response = await fetch(url, {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        errors.push(`Craigslist ${region.id}: HTTP ${response.status}`);
        continue;
      }

      const xml = await response.text();

      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match;

      while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];

        const title = extractTag(itemXml, "title");
        const link = extractTag(itemXml, "link");
        const description = extractTag(itemXml, "description");

        if (!title || !link) continue;

        const cleanTitle = extractCdataContent(title);
        const cleanDesc = description
          ? extractCdataContent(description)
          : undefined;

        const latStr = extractTag(itemXml, "geo:lat");
        const lngStr = extractTag(itemXml, "geo:long");
        const lat = latStr ? parseFloat(latStr) : undefined;
        const lng = lngStr ? parseFloat(lngStr) : undefined;

        const sourceId = `cl-${region.id}-${link
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(-20)}`;

        sales.push({
          source: "craigslist",
          source_id: sourceId,
          source_url: link,
          title: cleanTitle,
          description: cleanDesc,
          city: region.city,
          state: region.state,
          latitude: lat && !isNaN(lat) ? lat : undefined,
          longitude: lng && !isNaN(lng) ? lng : undefined,
          category: guessCategory(cleanTitle, cleanDesc),
          categories: [guessCategory(cleanTitle, cleanDesc) || "Garage Sale"],
          raw_data: { region: region.id },
        });
      }

      await randomDelay(2000, 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Craigslist ${region.id}: ${msg}`);
    }
  }

  return { source: "craigslist", sales, errors };
}

// ──────────────────────────────────────────────
// ESTATE SALES COLLECTOR
// ──────────────────────────────────────────────

const ESTATE_LOCATIONS = [
  { city: "Olympia", state: "Washington", zip: "98501" },
  { city: "Seattle", state: "Washington", zip: "98101" },
  { city: "Portland", state: "Oregon", zip: "97201" },
  { city: "Los-Angeles", state: "California", zip: "90001" },
  { city: "Chicago", state: "Illinois", zip: "60601" },
  { city: "Houston", state: "Texas", zip: "77001" },
  { city: "Phoenix", state: "Arizona", zip: "85001" },
  { city: "Atlanta", state: "Georgia", zip: "30301" },
  { city: "Miami", state: "Florida", zip: "33101" },
  { city: "Denver", state: "Colorado", zip: "80201" },
  { city: "New-York", state: "New-York", zip: "10001" },
  { city: "Philadelphia", state: "Pennsylvania", zip: "19101" },
];

export async function collectEstateSales(): Promise<CollectorResult> {
  const sales: RawExternalListing[] = [];
  const errors: string[] = [];

  for (const loc of ESTATE_LOCATIONS) {
    try {
      const url = `https://www.estatesales.net/${loc.state}/${loc.city}/${loc.zip}`;

      const response = await fetch(url, {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        errors.push(`EstateSales ${loc.city}: HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();

      // JSON-LD structured data (most reliable)
      const jsonLdRegex =
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
      let jsonLdMatch;

      while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
        try {
          const data = JSON.parse(jsonLdMatch[1]);
          const events = Array.isArray(data) ? data : [data];

          for (const event of events) {
            if (event["@type"] !== "Event" && event["@type"] !== "Sale")
              continue;

            const name = event.name || event.headline || "";
            const eventUrl = event.url || "";
            const desc = event.description || "";
            const startDate = event.startDate || "";

            const location = event.location || {};
            const address = location.address || {};
            const streetAddress = address.streetAddress || "";
            const city = address.addressLocality || loc.city;
            const state = address.addressRegion || loc.state;

            const geo = location.geo || {};
            const geoLat = geo.latitude ? parseFloat(geo.latitude) : undefined;
            const geoLng = geo.longitude
              ? parseFloat(geo.longitude)
              : undefined;

            const photos: string[] = [];
            if (event.image) {
              if (Array.isArray(event.image)) {
                photos.push(...event.image);
              } else if (typeof event.image === "string") {
                photos.push(event.image);
              }
            }

            const sourceId = `es-${eventUrl
              .replace(/[^a-zA-Z0-9]/g, "")
              .slice(-25)}`;

            sales.push({
              source: "estatesales",
              source_id: sourceId,
              source_url: eventUrl.startsWith("http")
                ? eventUrl
                : `https://www.estatesales.net${eventUrl}`,
              title: name,
              description: desc,
              city,
              state,
              latitude: geoLat,
              longitude: geoLng,
              address: streetAddress,
              sale_date: startDate ? startDate.split("T")[0] : undefined,
              photo_urls: photos.length > 0 ? photos : undefined,
              category: "Estate Sale",
              categories: ["Estate Sale"],
              raw_data: event as Record<string, unknown>,
            });
          }
        } catch {
          // JSON-LD parse failed, skip
        }
      }

      // Fallback: parse HTML listing cards
      if (sales.length === 0) {
        const cardRegex =
          /<a[^>]*href="(\/sale\/[^"]+)"[^>]*>[\s\S]*?<h\d[^>]*>([^<]+)<\/h\d>/gi;
        let cardMatch;

        while ((cardMatch = cardRegex.exec(html)) !== null) {
          const saleUrl = `https://www.estatesales.net${cardMatch[1]}`;
          const saleTitle = cardMatch[2].trim();

          const sourceId = `es-${cardMatch[1]
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(-25)}`;

          sales.push({
            source: "estatesales",
            source_id: sourceId,
            source_url: saleUrl,
            title: saleTitle,
            city: loc.city,
            state: loc.state,
            category: "Estate Sale",
            categories: ["Estate Sale"],
          });
        }
      }

      await randomDelay(2000, 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`EstateSales ${loc.city}: ${msg}`);
    }
  }

  return { source: "estatesales", sales, errors };
}

// ──────────────────────────────────────────────
// NEXTDOOR COLLECTOR (replaces dead GSALR)
// ──────────────────────────────────────────────

// Nextdoor Search API types
interface NextdoorFSFItem {
  id: number;
  title: string;
  body: string;
  price: string;
  currency: string;
  photo_urls: string[];
  url: string;
  neighborhood_name: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  creation_date_epoch_seconds: number;
  category: string;
}

interface NextdoorPost {
  id: number;
  title: string;
  body: string;
  latitude: number;
  longitude: number;
  url: string;
  media: string[];
  creation_date_epoch_seconds: number;
  category: string;
  comment_count: number;
  author: {
    name: string;
    neighborhood_name: string;
  };
}

interface NextdoorEvent {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  photo_url: string;
  url: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  creation_date_epoch_seconds: number;
  venue_name: string;
  address: string;
}

const NEXTDOOR_BASE = "https://nextdoor.com/content_api/v2";
const NEXTDOOR_RADIUS_MILES = 25;

const YARD_SALE_KEYWORDS = [
  "yard sale",
  "garage sale",
  "estate sale",
  "moving sale",
  "tag sale",
  "rummage sale",
  "community sale",
  "multi family sale",
  "neighborhood sale",
];

// Cities used for Nextdoor geo-searches (same coverage as Craigslist)
const NEXTDOOR_CITIES = [
  { name: "Olympia", lat: 47.0379, lng: -122.9007 },
  { name: "Seattle", lat: 47.6062, lng: -122.3321 },
  { name: "Tacoma", lat: 47.2529, lng: -122.4443 },
  { name: "Portland", lat: 45.5152, lng: -122.6784 },
  { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { name: "San Diego", lat: 32.7157, lng: -117.1611 },
  { name: "Chicago", lat: 41.8781, lng: -87.6298 },
  { name: "New York", lat: 40.7128, lng: -74.006 },
  { name: "Boston", lat: 42.3601, lng: -71.0589 },
  { name: "Denver", lat: 39.7392, lng: -104.9903 },
  { name: "Austin", lat: 30.2672, lng: -97.7431 },
  { name: "Dallas", lat: 32.7767, lng: -96.797 },
  { name: "Houston", lat: 29.7604, lng: -95.3698 },
  { name: "Atlanta", lat: 33.749, lng: -84.388 },
  { name: "Miami", lat: 25.7617, lng: -80.1918 },
  { name: "Tampa", lat: 27.9506, lng: -82.4572 },
  { name: "Orlando", lat: 28.5383, lng: -81.3792 },
  { name: "Phoenix", lat: 33.4484, lng: -112.074 },
  { name: "Philadelphia", lat: 39.9526, lng: -75.1652 },
  { name: "Detroit", lat: 42.3314, lng: -83.0458 },
  { name: "Minneapolis", lat: 44.9778, lng: -93.265 },
];

function isYardSaleRelated(text: string): boolean {
  const lower = (text || "").toLowerCase();
  return YARD_SALE_KEYWORDS.some((kw) => lower.includes(kw));
}

async function nextdoorFetch<T>(
  endpoint: string,
  params: Record<string, string | number>
): Promise<T[]> {
  const token = process.env.NEXTDOOR_API_TOKEN;
  if (!token) throw new Error("NEXTDOOR_API_TOKEN not set");

  const url = new URL(`${NEXTDOOR_BASE}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...BROWSER_HEADERS,
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `Nextdoor ${endpoint}: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  if (Array.isArray(data)) return data as T[];
  if (data?.results && Array.isArray(data.results))
    return data.results as T[];
  if (data?.items && Array.isArray(data.items)) return data.items as T[];
  return [];
}

function fsfItemToListing(item: NextdoorFSFItem): RawExternalListing {
  const createdAt = new Date(item.creation_date_epoch_seconds * 1000);
  return {
    source: "nextdoor",
    source_id: `nextdoor-fsf-${item.id}`,
    source_url:
      item.url ||
      `https://nextdoor.com/for_sale_and_free/item/${item.id}`,
    title: item.title || "Untitled Listing",
    description: item.body || "",
    city: item.city || "",
    state: item.state || "",
    latitude: item.lat || undefined,
    longitude: item.lon || undefined,
    price: item.price
      ? parseFloat(item.price.replace(/[^0-9.]/g, "")) || undefined
      : undefined,
    sale_date: createdAt.toISOString().split("T")[0],
    photo_urls: item.photo_urls || [],
    category: item.category
      ? guessCategory(item.category + " " + item.title)
      : guessCategory(item.title),
    categories: item.category ? [item.category] : [],
    collected_at: new Date().toISOString(),
    expires_at: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    raw_data: item,
  };
}

function postToListing(post: NextdoorPost): RawExternalListing {
  const createdAt = new Date(post.creation_date_epoch_seconds * 1000);
  return {
    source: "nextdoor",
    source_id: `nextdoor-post-${post.id}`,
    source_url: post.url || `https://nextdoor.com/p/${post.id}`,
    title: post.title || "Untitled Post",
    description: post.body || "",
    city: "",
    state: "",
    latitude: post.latitude || undefined,
    longitude: post.longitude || undefined,
    sale_date: createdAt.toISOString().split("T")[0],
    photo_urls: post.media || [],
    category: guessCategory(post.title + " " + post.body),
    categories: post.category ? [post.category] : [],
    collected_at: new Date().toISOString(),
    expires_at: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    raw_data: post,
  };
}

function eventToListing(event: NextdoorEvent): RawExternalListing {
  return {
    source: "nextdoor",
    source_id: `nextdoor-event-${event.id}`,
    source_url:
      event.url || `https://nextdoor.com/events/${event.id}`,
    title: event.title || "Untitled Event",
    description: event.description || "",
    city: event.city || "",
    state: event.state || "",
    latitude: event.lat || undefined,
    longitude: event.lon || undefined,
    address: event.address || event.venue_name || "",
    sale_date:
      event.start_date ||
      new Date(event.creation_date_epoch_seconds * 1000)
        .toISOString()
        .split("T")[0],
    sale_time_start: event.start_date || undefined,
    sale_time_end: event.end_date || undefined,
    photo_urls: event.photo_url ? [event.photo_url] : [],
    category: guessCategory(
      event.title + " " + (event.description || "")
    ),
    categories: [],
    collected_at: new Date().toISOString(),
    expires_at:
      event.end_date ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    raw_data: event,
  };
}

export async function collectNextdoor(): Promise<CollectorResult> {
  const sales: RawExternalListing[] = [];
  const errors: string[] = [];

  if (!process.env.NEXTDOOR_API_TOKEN) {
    return {
      source: "nextdoor",
      sales: [],
      errors: [
        "NEXTDOOR_API_TOKEN is not set — skipping Nextdoor collection",
      ],
    };
  }

  for (const city of NEXTDOOR_CITIES) {
    try {
      await randomDelay(500, 1500);

      // 1. FSF (For Sale & Free) marketplace listings
      try {
        const fsfItems = await nextdoorFetch<NextdoorFSFItem>(
          "search_sale_item",
          {
            lat: city.lat,
            lon: city.lng,
            radius: NEXTDOOR_RADIUS_MILES,
          }
        );
        const yardSaleFSF = fsfItems.filter((item) =>
          isYardSaleRelated(
            item.title + " " + item.body + " " + (item.category || "")
          )
        );
        for (const item of yardSaleFSF) sales.push(fsfItemToListing(item));
        console.log(
          `[Nextdoor FSF] ${city.name}: ${yardSaleFSF.length}/${fsfItems.length} yard-sale items`
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Nextdoor FSF ${city.name}: ${msg}`);
      }

      await randomDelay(300, 800);

      // 2. Posts with yard sale keywords
      for (const keyword of ["yard sale", "garage sale", "estate sale"]) {
        try {
          const posts = await nextdoorFetch<NextdoorPost>("search_post", {
            lat: city.lat,
            lon: city.lng,
            radius: NEXTDOOR_RADIUS_MILES,
            query: keyword,
          });
          for (const post of posts) sales.push(postToListing(post));
          console.log(
            `[Nextdoor Posts] ${city.name} "${keyword}": ${posts.length} posts`
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Nextdoor Posts ${city.name} "${keyword}": ${msg}`);
        }
        await randomDelay(200, 600);
      }

      // 3. Events (yard sale / community sale events)
      try {
        const events = await nextdoorFetch<NextdoorEvent>("search_event", {
          lat: city.lat,
          lon: city.lng,
          radius: NEXTDOOR_RADIUS_MILES,
        });
        const yardSaleEvents = events.filter((event) =>
          isYardSaleRelated(
            event.title + " " + (event.description || "")
          )
        );
        for (const event of yardSaleEvents)
          sales.push(eventToListing(event));
        console.log(
          `[Nextdoor Events] ${city.name}: ${yardSaleEvents.length}/${events.length} yard-sale events`
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Nextdoor Events ${city.name}: ${msg}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Nextdoor ${city.name} general: ${msg}`);
    }
  }

  // Deduplicate within this collector (overlapping city radii)
  const seen = new Set<string>();
  const uniqueSales = sales.filter((sale) => {
    if (seen.has(sale.source_id)) return false;
    seen.add(sale.source_id);
    return true;
  });

  console.log(
    `[Nextdoor] Total unique listings: ${uniqueSales.length} (${errors.length} errors)`
  );
  return { source: "nextdoor", sales: uniqueSales, errors };
}

// ──────────────────────────────────────────────
// MAIN ENTRY POINT
// ──────────────────────────────────────────────

export async function collectAllSources(): Promise<{
  results: CollectorResult[];
  totalSales: number;
  totalErrors: number;
}> {
  const settled = await Promise.allSettled([
    collectCraigslist(),
    collectEstateSales(),
    collectNextdoor(),
  ]);

  const results: CollectorResult[] = [];
  let totalSales = 0;
  let totalErrors = 0;

  for (const outcome of settled) {
    if (outcome.status === "fulfilled") {
      results.push(outcome.value);
      totalSales += outcome.value.sales.length;
      totalErrors += outcome.value.errors.length;
    } else {
      totalErrors += 1;
      results.push({
        source: "unknown",
        sales: [],
        errors: [outcome.reason?.message || "Collector failed"],
      });
    }
  }

  return { results, totalSales, totalErrors };
}
