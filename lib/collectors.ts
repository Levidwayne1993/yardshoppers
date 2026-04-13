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
  return text.replace(new RegExp(cdataOpen.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "").replace(new RegExp(cdataClose.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "").trim();
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
  if (/antique|vintage|collectible/i.test(text)) return "Antiques & Collectibles";
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
// GSALR COLLECTOR
// ──────────────────────────────────────────────
// GSALR.com blocks all automated access.
// This returns empty until a replacement source
// (e.g. GarageSaleFinder.com) is implemented.

export async function collectGsalr(): Promise<CollectorResult> {
  return {
    source: "gsalr",
    sales: [],
    errors: ["GSALR: Source currently unavailable (blocked by site)"],
  };
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
    collectGsalr(),
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
