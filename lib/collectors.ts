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

export interface CollectorError {
  source: string;
  message: string;
  timestamp: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min = 1000, max = 3000): Promise<void> {
  return delay(Math.floor(Math.random() * (max - min + 1)) + min);
}

// Extract content between XML/HTML tags
function extractTag(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

// Extract CDATA content from XML tags
function extractCdataContent(text: string): string {
  return text
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .trim();
}

// Simple category guesser based on keywords
function guessCategory(
  title: string,
  description?: string
): string | undefined {
  const text = `${title} ${description || ""}`.toLowerCase();
  if (/estate\s*sale/i.test(text)) return "estate-sale";
  if (/garage\s*sale/i.test(text)) return "garage-sale";
  if (/yard\s*sale/i.test(text)) return "yard-sale";
  if (/moving\s*sale/i.test(text)) return "moving-sale";
  if (/multi[- ]?family/i.test(text)) return "multi-family";
  if (/church|charity|fundraiser/i.test(text)) return "charity";
  if (/antique|vintage|collectible/i.test(text)) return "antiques";
  if (/tool|hardware|workshop/i.test(text)) return "tools";
  if (/furniture|couch|sofa|table|chair/i.test(text)) return "furniture";
  if (/baby|kid|children|toy/i.test(text)) return "kids";
  if (/electronic|computer|phone|tv/i.test(text)) return "electronics";
  if (/cloth|fashion|shoe|dress/i.test(text)) return "clothing";
  return undefined;
}

// ──────────────────────────────────────────────
// CRAIGSLIST COLLECTOR
// ──────────────────────────────────────────────

const CRAIGSLIST_REGIONS = [
  { id: "seattle", city: "Seattle", state: "WA" },
  { id: "tacoma", city: "Tacoma", state: "WA" },
  { id: "olympic", city: "Olympia", state: "WA" },
  { id: "portland", city: "Portland", state: "OR" },
];

async function collectCraigslist(): Promise<CollectorResult> {
  const listings: RawExternalListing[] = [];
  const errors: string[] = [];

  for (const region of CRAIGSLIST_REGIONS) {
    try {
      // ⚠ ORIGINAL URL (broken):
      // const url = `https://${region.id}.craigslist.org/search/gms?format=rss`;
      // ✅ FIXED URL (use OpenRSS proxy):
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

      // Parse RSS items
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

        // Extract coordinates from geo tags if present
        const lat = extractTag(itemXml, "geo:lat");
        const lng = extractTag(itemXml, "geo:long");

        // Generate stable source ID from URL
        const sourceId = `cl-${region.id}-${link
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(-20)}`;

        listings.push({
          source_id: sourceId,
          source_url: link,
          title: cleanTitle,
          description: cleanDesc,
          city: region.city,
          state: region.state,
          latitude: lat ? parseFloat(lat) : undefined,
          longitude: lng ? parseFloat(lng) : undefined,
          categories: [guessCategory(cleanTitle, cleanDesc) || "garage-sale"],
        });
      }

      await randomDelay(2000, 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Craigslist ${region.id}: ${msg}`);
    }
  }

  return {
    source: "craigslist",
    listings,
    collected_at: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────
// ESTATE SALES COLLECTOR
// ──────────────────────────────────────────────

const ESTATE_LOCATIONS = [
  { city: "Olympia", state: "Washington", zip: "98501" },
  { city: "Seattle", state: "Washington", zip: "98101" },
  { city: "Portland", state: "Oregon", zip: "97201" },
];

async function collectEstateSales(): Promise<CollectorResult> {
  const listings: RawExternalListing[] = [];
  const errors: string[] = [];

  for (const loc of ESTATE_LOCATIONS) {
    try {
      // ⚠ ORIGINAL URL (broken - 404):
      // const url = `https://www.estatesales.net/find-estate-sales/${loc.state}/${loc.city}/${loc.zip}`;
      // ✅ FIXED URL:
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

      // Look for JSON-LD structured data first (most reliable)
      const jsonLdRegex =
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
      let jsonLdMatch;

      while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
        try {
          const data = JSON.parse(jsonLdMatch[1]);
          const events = Array.isArray(data) ? data : [data];

          for (const event of events) {
            if (event["@type"] !== "Event" &&
                event["@type"] !== "Sale") continue;

            const name = event.name || event.headline || "";
            const eventUrl = event.url || "";
            const desc = event.description || "";
            const startDate = event.startDate || "";
            const endDate = event.endDate || "";

            // Extract location
            const location = event.location || {};
            const address = location.address || {};
            const streetAddress = address.streetAddress || "";
            const city = address.addressLocality || loc.city;
            const state = address.addressRegion || loc.state;

            // Extract coordinates
            const geo = location.geo || {};
            const lat = geo.latitude
              ? parseFloat(geo.latitude)
              : undefined;
            const lng = geo.longitude
              ? parseFloat(geo.longitude)
              : undefined;

            // Extract photos
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

            listings.push({
              source_id: sourceId,
              source_url: eventUrl.startsWith("http")
                ? eventUrl
                : `https://www.estatesales.net${eventUrl}`,
              title: name,
              description: desc,
              city,
              state,
              latitude: lat,
              longitude: lng,
              address: streetAddress,
              sale_date: startDate
                ? startDate.split("T")[0]
                : undefined,
              photo_urls: photos.length > 0 ? photos : undefined,
              categories: ["estate-sale"],
            });
          }
        } catch {
          // JSON-LD parse failed, skip
        }
      }

      // Fallback: parse HTML listing cards if JSON-LD didn't yield results
      if (listings.length === 0) {
        const cardRegex =
          /<a[^>]*href="(\/sale\/[^"]+)"[^>]*>[\s\S]*?<h2[^>]*>([^<]+)<\/h2>/gi;
        let cardMatch;

        while ((cardMatch = cardRegex.exec(html)) !== null) {
          const saleUrl = `https://www.estatesales.net${cardMatch[1]}`;
          const saleTitle = cardMatch[2].trim();

          const sourceId = `es-${cardMatch[1]
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(-25)}`;

          listings.push({
            source_id: sourceId,
            source_url: saleUrl,
            title: saleTitle,
            city: loc.city,
            state: loc.state,
            categories: ["estate-sale"],
          });
        }
      }

      await randomDelay(2000, 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`EstateSales ${loc.city}: ${msg}`);
    }
  }

  return {
    source: "estatesales",
    listings,
    collected_at: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────
// GSALR COLLECTOR
// ──────────────────────────────────────────────
// ⚠ NOTE: GSALR.com blocks all automated access.
// Replace this entire function with a
// GarageSaleFinder.com collector.

const GSALR_SEARCHES = [
  { query: "Olympia", state: "WA" },
  { query: "Seattle", state: "WA" },
  { query: "Portland", state: "OR" },
];

async function collectGsalr(): Promise<CollectorResult> {
  const listings: RawExternalListing[] = [];
  const errors: string[] = [];

  for (const search of GSALR_SEARCHES) {
    try {
      const url =
        `https://gsalr.com/search?q=` +
        `${encodeURIComponent(search.query + " " + search.state)}`;

      const response = await fetch(url, {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        errors.push(`GSALR ${search.query}: HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();

      // Parse listing blocks from GSALR HTML
      const listingRegex =
        /<div class="sale-item"[\s\S]*?<a href="([^"]+)"[\s\S]*?<h\d[^>]*>([^<]+)<\/h\d>/gi;
      let listingMatch;

      while ((listingMatch = listingRegex.exec(html)) !== null) {
        const saleUrl = listingMatch[1].startsWith("http")
          ? listingMatch[1]
          : `https://gsalr.com${listingMatch[1]}`;
        const saleTitle = listingMatch[2].trim();

        const sourceId = `gsalr-${listingMatch[1]
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(-20)}`;

        listings.push({
          source_id: sourceId,
          source_url: saleUrl,
          title: saleTitle,
          city: search.query,
          state: search.state,
          categories: [
            guessCategory(saleTitle) || "garage-sale",
          ],
        });
      }

      await randomDelay(2000, 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`GSALR ${search.query}: ${msg}`);
    }
  }

  return {
    source: "gsalr",
    listings,
    collected_at: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────
// MAIN ENTRY POINT
// ──────────────────────────────────────────────

export async function collectAllSources(): Promise<{
  sales: RawExternalListing[];
  errors: string[];
}> {
  const errors: string[] = [];

  // Run all three collectors in parallel
  const [craigslist, estatesales, gsalr] = await Promise.allSettled([
    collectCraigslist(),
    collectEstateSales(),
    collectGsalr(),
  ]);

  const allListings: RawExternalListing[] = [];

  // Process Craigslist results
  if (craigslist.status === "fulfilled") {
    allListings.push(...craigslist.value.listings);
  } else {
    errors.push(`Craigslist collector failed: ${craigslist.reason}`);
  }

  // Process EstateSales results
  if (estatesales.status === "fulfilled") {
    allListings.push(...estatesales.value.listings);
  } else {
    errors.push(`EstateSales collector failed: ${estatesales.reason}`);
  }

  // Process GSALR results
  if (gsalr.status === "fulfilled") {
    allListings.push(...gsalr.value.listings);
  } else {
    errors.push(`GSALR collector failed: ${gsalr.reason}`);
  }

  return { sales: allListings, errors };
}