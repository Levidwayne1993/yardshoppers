// ============================================================
// FILE: lib/collectors.ts (YardShoppers project)
// REPLACE the entire file
//
// CHANGES:
// 1. Added ScraperAPI proxy for Craigslist (full page scraping
//    instead of RSS) and EstateSales.net
// 2. Added 2 NEW sources: GarageSaleFinder.com, YardSaleSearch.com
// 3. Kept Nextdoor API unchanged (no proxy needed)
// 4. Smart proxy routing: ScraperAPI where needed, direct where not
//
// ENV VAR REQUIRED: SCRAPER_API_KEY
// ============================================================

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
  return text
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
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
// SCRAPERAPI HELPERS
// ──────────────────────────────────────────────

function getScraperApiKey(): string | null {
  return process.env.SCRAPER_API_KEY || null;
}

/**
 * Fetches a URL through ScraperAPI proxy.
 * Falls back to direct fetch if no API key is set.
 */
async function proxyFetch(url: string, timeoutMs = 30000): Promise<string | null> {
  const apiKey = getScraperApiKey();

  try {
    if (apiKey) {
      // Route through ScraperAPI
      const proxyUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}&render=false`;
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        console.warn(`[ScraperAPI] ${response.status} for ${url}`);
        return null;
      }
      return await response.text();
    } else {
      // No API key — direct fetch with browser headers
      console.warn("[ScraperAPI] No SCRAPER_API_KEY set, using direct fetch");
      const response = await fetch(url, {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) return null;
      return await response.text();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[proxyFetch] Error fetching ${url}: ${msg}`);
    return null;
  }
}

/**
 * Direct fetch (no proxy) — for sites that don't block.
 */
async function directFetch(url: string, timeoutMs = 15000): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// SIMPLE HTML PARSER HELPERS
// ──────────────────────────────────────────────

function extractTextBetween(html: string, startPattern: string, endPattern: string): string[] {
  const results: string[] = [];
  let pos = 0;
  while (true) {
    const startIdx = html.indexOf(startPattern, pos);
    if (startIdx === -1) break;
    const contentStart = startIdx + startPattern.length;
    const endIdx = html.indexOf(endPattern, contentStart);
    if (endIdx === -1) break;
    results.push(html.substring(contentStart, endIdx).trim());
    pos = endIdx + endPattern.length;
  }
  return results;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}

// ──────────────────────────────────────────────
// CRAIGSLIST COLLECTOR (ScraperAPI — full pages)
// ──────────────────────────────────────────────

const CRAIGSLIST_REGIONS = [
  // Pacific Northwest (your home region)
  { id: "seattle", city: "Seattle", state: "WA" },
  { id: "tacoma", city: "Tacoma", state: "WA" },
  { id: "olympic", city: "Olympia", state: "WA" },
  { id: "portland", city: "Portland", state: "OR" },
  // West Coast
  { id: "sfbay", city: "San Francisco", state: "CA" },
  { id: "losangeles", city: "Los Angeles", state: "CA" },
  { id: "sandiego", city: "San Diego", state: "CA" },
  { id: "sacramento", city: "Sacramento", state: "CA" },
  // Mountain / Central
  { id: "denver", city: "Denver", state: "CO" },
  { id: "phoenix", city: "Phoenix", state: "AZ" },
  { id: "austin", city: "Austin", state: "TX" },
  { id: "dallas", city: "Dallas", state: "TX" },
  { id: "houston", city: "Houston", state: "TX" },
  { id: "chicago", city: "Chicago", state: "IL" },
  { id: "minneapolis", city: "Minneapolis", state: "MN" },
  // East Coast
  { id: "newyork", city: "New York", state: "NY" },
  { id: "boston", city: "Boston", state: "MA" },
  { id: "philadelphia", city: "Philadelphia", state: "PA" },
  { id: "atlanta", city: "Atlanta", state: "GA" },
  { id: "miami", city: "Miami", state: "FL" },
  { id: "tampa", city: "Tampa", state: "FL" },
  { id: "orlando", city: "Orlando", state: "FL" },
  { id: "detroit", city: "Detroit", state: "MI" },
  // Additional coverage
  { id: "nashville", city: "Nashville", state: "TN" },
  { id: "charlotte", city: "Charlotte", state: "NC" },
  { id: "raleigh", city: "Raleigh", state: "NC" },
  { id: "stlouis", city: "St Louis", state: "MO" },
  { id: "kansascity", city: "Kansas City", state: "MO" },
  { id: "lasvegas", city: "Las Vegas", state: "NV" },
  { id: "saltlakecity", city: "Salt Lake City", state: "UT" },
];

export async function collectCraigslist(): Promise<CollectorResult> {
  const sales: RawExternalListing[] = [];
  const errors: string[] = [];
  const hasProxy = !!getScraperApiKey();

  for (const region of CRAIGSLIST_REGIONS) {
    try {
      let html: string | null = null;

      if (hasProxy) {
        // ScraperAPI: scrape ACTUAL search pages (50-100+ results per page)
        const url = `https://${region.id}.craigslist.org/search/gms`;
        html = await proxyFetch(url);
      }

      if (html) {
        // Parse actual Craigslist HTML search results
        // Craigslist uses <li class="cl-static-search-result"> or similar
        const listingRegex = /<li[^>]*class="[^"]*cl-static-search-result[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
        let match;

        while ((match = listingRegex.exec(html)) !== null) {
          const itemHtml = match[1];

          // Extract title
          const titleMatch = itemHtml.match(/<div[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
            || itemHtml.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
          const title = titleMatch ? stripHtml(titleMatch[1]) : '';
          if (!title) continue;

          // Extract link
          const linkMatch = itemHtml.match(/href="([^"]+)"/i);
          const link = linkMatch ? linkMatch[1] : '';
          const fullLink = link.startsWith('http') ? link : `https://${region.id}.craigslist.org${link}`;

          // Extract price
          const priceMatch = itemHtml.match(/<div[^>]*class="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
            || itemHtml.match(/\$[\d,]+/);
          const priceText = priceMatch ? stripHtml(typeof priceMatch[1] === 'string' ? priceMatch[1] : priceMatch[0]) : '';

          // Extract location
          const locMatch = itemHtml.match(/<div[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          const locationText = locMatch ? stripHtml(locMatch[1]) : '';

          const sourceId = `cl-${region.id}-${fullLink.replace(/[^a-zA-Z0-9]/g, "").slice(-20)}`;

          sales.push({
            source: "craigslist",
            source_id: sourceId,
            source_url: fullLink,
            title: title,
            description: locationText || undefined,
            city: region.city,
            state: region.state,
            category: guessCategory(title, locationText),
            categories: [guessCategory(title, locationText) || "Garage Sale"],
            raw_data: { region: region.id, proxy: true },
          });
        }

        // Fallback: try <a class="titlestring"> pattern (newer CL layout)
        if (sales.length === 0) {
          const altRegex = /<a[^>]*class="[^"]*titlestring[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
          let altMatch;
          while ((altMatch = altRegex.exec(html)) !== null) {
            const link = altMatch[1];
            const title = stripHtml(altMatch[2]);
            if (!title) continue;
            const fullLink = link.startsWith('http') ? link : `https://${region.id}.craigslist.org${link}`;
            const sourceId = `cl-${region.id}-${fullLink.replace(/[^a-zA-Z0-9]/g, "").slice(-20)}`;
            sales.push({
              source: "craigslist",
              source_id: sourceId,
              source_url: fullLink,
              title,
              city: region.city,
              state: region.state,
              category: guessCategory(title),
              categories: [guessCategory(title) || "Garage Sale"],
              raw_data: { region: region.id, proxy: true },
            });
          }
        }

        console.log(`[Craigslist] ${region.city}: ${sales.length} listings via ScraperAPI`);
      } else {
        // Fallback: OpenRSS (limited but works without proxy)
        const rssUrl = `https://openrss.org/${region.id}.craigslist.org/search/gms`;
        const response = await fetch(rssUrl, {
          headers: BROWSER_HEADERS,
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          errors.push(`Craigslist ${region.id}: HTTP ${response.status}`);
          continue;
        }

        const xml = await response.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
        let rssMatch;

        while ((rssMatch = itemRegex.exec(xml)) !== null) {
          const itemXml = rssMatch[1];
          const title = extractTag(itemXml, "title");
          const link = extractTag(itemXml, "link");
          const description = extractTag(itemXml, "description");

          if (!title || !link) continue;

          const cleanTitle = extractCdataContent(title);
          const cleanDesc = description ? extractCdataContent(description) : undefined;
          const latStr = extractTag(itemXml, "geo:lat");
          const lngStr = extractTag(itemXml, "geo:long");
          const lat = latStr ? parseFloat(latStr) : undefined;
          const lng = lngStr ? parseFloat(lngStr) : undefined;

          const sourceId = `cl-${region.id}-${link.replace(/[^a-zA-Z0-9]/g, "").slice(-20)}`;

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
            raw_data: { region: region.id, proxy: false },
          });
        }
      }

      await randomDelay(1500, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Craigslist ${region.id}: ${msg}`);
    }
  }

  return { source: "craigslist", sales, errors };
}

// ──────────────────────────────────────────────
// ESTATE SALES COLLECTOR (ScraperAPI)
// ──────────────────────────────────────────────

const ESTATE_LOCATIONS = [
  { city: "Olympia", state: "Washington", zip: "98501" },
  { city: "Seattle", state: "Washington", zip: "98101" },
  { city: "Portland", state: "Oregon", zip: "97201" },
  { city: "Los-Angeles", state: "California", zip: "90001" },
  { city: "San-Francisco", state: "California", zip: "94101" },
  { city: "Chicago", state: "Illinois", zip: "60601" },
  { city: "Houston", state: "Texas", zip: "77001" },
  { city: "Dallas", state: "Texas", zip: "75201" },
  { city: "Phoenix", state: "Arizona", zip: "85001" },
  { city: "Atlanta", state: "Georgia", zip: "30301" },
  { city: "Miami", state: "Florida", zip: "33101" },
  { city: "Tampa", state: "Florida", zip: "33601" },
  { city: "Denver", state: "Colorado", zip: "80201" },
  { city: "New-York", state: "New-York", zip: "10001" },
  { city: "Philadelphia", state: "Pennsylvania", zip: "19101" },
  { city: "Boston", state: "Massachusetts", zip: "02101" },
  { city: "Nashville", state: "Tennessee", zip: "37201" },
  { city: "Charlotte", state: "North-Carolina", zip: "28201" },
  { city: "Detroit", state: "Michigan", zip: "48201" },
  { city: "Minneapolis", state: "Minnesota", zip: "55401" },
];

export async function collectEstateSales(): Promise<CollectorResult> {
  const sales: RawExternalListing[] = [];
  const errors: string[] = [];

  for (const loc of ESTATE_LOCATIONS) {
    try {
      const url = `https://www.estatesales.net/${loc.state}/${loc.city}/${loc.zip}`;

      // Use ScraperAPI proxy (EstateSales blocks cloud IPs)
      const html = await proxyFetch(url);

      if (!html) {
        errors.push(`EstateSales ${loc.city}: no response`);
        continue;
      }

      // JSON-LD structured data (most reliable)
      const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
      let jsonLdMatch;
      let foundJsonLd = false;

      while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
        try {
          const data = JSON.parse(jsonLdMatch[1]);
          const events = Array.isArray(data) ? data : [data];

          for (const event of events) {
            if (event["@type"] !== "Event" && event["@type"] !== "Sale")
              continue;

            foundJsonLd = true;
            const name = event.name || event.headline || "";
            const eventUrl = event.url || "";
            const desc = event.description || "";
            const startDate = event.startDate || "";

            const location = event.location || {};
            const address = location.address || {};
            const streetAddress = address.streetAddress || "";
            const city = address.addressLocality || loc.city.replace(/-/g, " ");
            const state = address.addressRegion || loc.state;

            const geo = location.geo || {};
            const geoLat = geo.latitude ? parseFloat(geo.latitude) : undefined;
            const geoLng = geo.longitude ? parseFloat(geo.longitude) : undefined;

            const photos: string[] = [];
            if (event.image) {
              if (Array.isArray(event.image)) photos.push(...event.image);
              else if (typeof event.image === "string") photos.push(event.image);
            }

            const sourceId = `es-${eventUrl.replace(/[^a-zA-Z0-9]/g, "").slice(-25)}`;

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
      if (!foundJsonLd) {
        const cardRegex = /<a[^>]*href="(\/sale\/[^"]+)"[^>]*>[\s\S]*?<h\d[^>]*>([^<]+)<\/h\d>/gi;
        let cardMatch;

        while ((cardMatch = cardRegex.exec(html)) !== null) {
          const saleUrl = `https://www.estatesales.net${cardMatch[1]}`;
          const saleTitle = cardMatch[2].trim();
          const sourceId = `es-${cardMatch[1].replace(/[^a-zA-Z0-9]/g, "").slice(-25)}`;

          sales.push({
            source: "estatesales",
            source_id: sourceId,
            source_url: saleUrl,
            title: saleTitle,
            city: loc.city.replace(/-/g, " "),
            state: loc.state,
            category: "Estate Sale",
            categories: ["Estate Sale"],
          });
        }
      }

      console.log(`[EstateSales] ${loc.city}: ${sales.length} listings`);
      await randomDelay(2000, 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`EstateSales ${loc.city}: ${msg}`);
    }
  }

  return { source: "estatesales", sales, errors };
}

// ──────────────────────────────────────────────
// GARAGESALEFINDER COLLECTOR (NEW — ScraperAPI)
// ──────────────────────────────────────────────

const GSF_STATES = [
  "Washington", "Oregon", "California", "Texas", "Florida",
  "New-York", "Illinois", "Georgia", "Arizona", "Colorado",
  "Pennsylvania", "Ohio", "Michigan", "Tennessee", "North-Carolina",
  "Missouri", "Minnesota", "Indiana", "Virginia", "Massachusetts",
];

export async function collectGarageSaleFinder(): Promise<CollectorResult> {
  const sales: RawExternalListing[] = [];
  const errors: string[] = [];

  for (const state of GSF_STATES) {
    try {
      const url = `https://www.garagesalefinder.com/sale/${state}`;
      const html = await proxyFetch(url);

      if (!html) {
        errors.push(`GarageSaleFinder ${state}: no response`);
        continue;
      }

      // GarageSaleFinder lists sales in structured divs
      // Look for sale listing patterns
      const saleBlockRegex = /<div[^>]*class="[^"]*saleListing[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
      let blockMatch;

      while ((blockMatch = saleBlockRegex.exec(html)) !== null) {
        const block = blockMatch[1];

        const titleMatch = block.match(/<[hH][1-4][^>]*>([\s\S]*?)<\/[hH][1-4]>/i)
          || block.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
        const title = titleMatch ? stripHtml(titleMatch[1]) : '';
        if (!title || title.length < 5) continue;

        const linkMatch = block.match(/href="([^"]+)"/i);
        const link = linkMatch ? linkMatch[1] : '';
        const fullLink = link.startsWith('http') ? link : `https://www.garagesalefinder.com${link}`;

        const addrMatch = block.match(/(?:address|location)[^:]*:\s*([^<]+)/i)
          || block.match(/<span[^>]*class="[^"]*addr[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const address = addrMatch ? stripHtml(addrMatch[1]) : '';

        const dateMatch = block.match(/(?:date|when)[^:]*:\s*([^<]+)/i)
          || block.match(/<span[^>]*class="[^"]*date[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const dateText = dateMatch ? stripHtml(dateMatch[1]) : '';

        const sourceId = `gsf-${fullLink.replace(/[^a-zA-Z0-9]/g, "").slice(-25)}`;

        sales.push({
          source: "garagesalefinder",
          source_id: sourceId,
          source_url: fullLink,
          title,
          description: address || undefined,
          address: address || undefined,
          city: undefined,
          state: state.replace(/-/g, " "),
          sale_date: dateText || undefined,
          category: guessCategory(title),
          categories: [guessCategory(title) || "Garage Sale"],
          raw_data: { state, source_site: "garagesalefinder.com" },
        });
      }

      // Fallback: look for simpler link patterns
      if (sales.filter(s => s.raw_data?.state === state).length === 0) {
        const linkRegex = /<a[^>]*href="(\/sale\/[^"]*\d+[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
        let linkMatch2;
        while ((linkMatch2 = linkRegex.exec(html)) !== null) {
          const link = `https://www.garagesalefinder.com${linkMatch2[1]}`;
          const title = stripHtml(linkMatch2[2]);
          if (!title || title.length < 5) continue;
          const sourceId = `gsf-${linkMatch2[1].replace(/[^a-zA-Z0-9]/g, "").slice(-25)}`;
          sales.push({
            source: "garagesalefinder",
            source_id: sourceId,
            source_url: link,
            title,
            state: state.replace(/-/g, " "),
            category: guessCategory(title),
            categories: [guessCategory(title) || "Garage Sale"],
            raw_data: { state, source_site: "garagesalefinder.com" },
          });
        }
      }

      console.log(`[GarageSaleFinder] ${state}: ${sales.filter(s => s.raw_data?.state === state).length} listings`);
      await randomDelay(2000, 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`GarageSaleFinder ${state}: ${msg}`);
    }
  }

  return { source: "garagesalefinder", sales, errors };
}

// ──────────────────────────────────────────────
// YARDSALESEARCH COLLECTOR (NEW — no proxy needed)
// ──────────────────────────────────────────────

const YSS_CITIES = [
  { city: "Olympia", state: "WA", urlSlug: "Olympia-WA" },
  { city: "Seattle", state: "WA", urlSlug: "Seattle-WA" },
  { city: "Portland", state: "OR", urlSlug: "Portland-OR" },
  { city: "Los Angeles", state: "CA", urlSlug: "Los-Angeles-CA" },
  { city: "San Francisco", state: "CA", urlSlug: "San-Francisco-CA" },
  { city: "Chicago", state: "IL", urlSlug: "Chicago-IL" },
  { city: "Houston", state: "TX", urlSlug: "Houston-TX" },
  { city: "Dallas", state: "TX", urlSlug: "Dallas-TX" },
  { city: "Phoenix", state: "AZ", urlSlug: "Phoenix-AZ" },
  { city: "Atlanta", state: "GA", urlSlug: "Atlanta-GA" },
  { city: "Miami", state: "FL", urlSlug: "Miami-FL" },
  { city: "Denver", state: "CO", urlSlug: "Denver-CO" },
  { city: "New York", state: "NY", urlSlug: "New-York-NY" },
  { city: "Philadelphia", state: "PA", urlSlug: "Philadelphia-PA" },
  { city: "Boston", state: "MA", urlSlug: "Boston-MA" },
];

export async function collectYardSaleSearch(): Promise<CollectorResult> {
  const sales: RawExternalListing[] = [];
  const errors: string[] = [];

  for (const loc of YSS_CITIES) {
    try {
      const url = `https://www.yardsalesearch.com/garage-sales-in-${loc.urlSlug}.html`;

      // YardSaleSearch is a lighter site — try direct first
      let html = await directFetch(url);

      // If blocked, try ScraperAPI
      if (!html && getScraperApiKey()) {
        html = await proxyFetch(url);
      }

      if (!html) {
        errors.push(`YardSaleSearch ${loc.city}: no response`);
        continue;
      }

      // Parse listing cards
      const listingRegex = /<div[^>]*class="[^"]*listing[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
      let listMatch;

      while ((listMatch = listingRegex.exec(html)) !== null) {
        const block = listMatch[1];

        const titleMatch = block.match(/<[hH][1-4][^>]*>([\s\S]*?)<\/[hH][1-4]>/i)
          || block.match(/<strong>([\s\S]*?)<\/strong>/i);
        const title = titleMatch ? stripHtml(titleMatch[1]) : '';
        if (!title || title.length < 5) continue;

        const linkMatch = block.match(/href="([^"]+)"/i);
        const link = linkMatch ? linkMatch[1] : '';
        const fullLink = link.startsWith('http') ? link : `https://www.yardsalesearch.com${link}`;

        const addrMatch = block.match(/(?:\d+\s+[A-Za-z][\w\s]*(?:St|Ave|Rd|Blvd|Dr|Ln|Way|Ct|Pl|Cir)[^<]*)/i);
        const address = addrMatch ? stripHtml(addrMatch[0]) : '';

        const sourceId = `yss-${fullLink.replace(/[^a-zA-Z0-9]/g, "").slice(-25)}`;

        sales.push({
          source: "yardsalesearch",
          source_id: sourceId,
          source_url: fullLink,
          title,
          address: address || undefined,
          city: loc.city,
          state: loc.state,
          category: guessCategory(title),
          categories: [guessCategory(title) || "Yard Sale"],
          raw_data: { city: loc.urlSlug, source_site: "yardsalesearch.com" },
        });
      }

      // Fallback: simpler anchor tag scraping
      if (sales.filter(s => s.raw_data?.city === loc.urlSlug).length === 0) {
        const anchorRegex = /<a[^>]*href="(\/garage-sale[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let anchorMatch;
        while ((anchorMatch = anchorRegex.exec(html)) !== null) {
          const link = `https://www.yardsalesearch.com${anchorMatch[1]}`;
          const title = stripHtml(anchorMatch[2]);
          if (!title || title.length < 5) continue;
          const sourceId = `yss-${anchorMatch[1].replace(/[^a-zA-Z0-9]/g, "").slice(-25)}`;
          sales.push({
            source: "yardsalesearch",
            source_id: sourceId,
            source_url: link,
            title,
            city: loc.city,
            state: loc.state,
            category: guessCategory(title),
            categories: [guessCategory(title) || "Yard Sale"],
            raw_data: { city: loc.urlSlug, source_site: "yardsalesearch.com" },
          });
        }
      }

      console.log(`[YardSaleSearch] ${loc.city}: ${sales.filter(s => s.raw_data?.city === loc.urlSlug).length} listings`);
      await randomDelay(1500, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`YardSaleSearch ${loc.city}: ${msg}`);
    }
  }

  return { source: "yardsalesearch", sales, errors };
}

// ──────────────────────────────────────────────
// NEXTDOOR COLLECTOR (unchanged — uses API)
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
  "yard sale", "garage sale", "estate sale", "moving sale",
  "tag sale", "rummage sale", "community sale",
  "multi family sale", "neighborhood sale",
];

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
  if (data?.results && Array.isArray(data.results)) return data.results as T[];
  if (data?.items && Array.isArray(data.items)) return data.items as T[];
  return [];
}

function fsfItemToListing(item: NextdoorFSFItem): RawExternalListing {
  const createdAt = new Date(item.creation_date_epoch_seconds * 1000);
  return {
    source: "nextdoor",
    source_id: `nextdoor-fsf-${item.id}`,
    source_url: item.url || `https://nextdoor.com/for_sale_and_free/item/${item.id}`,
    title: item.title || "Untitled Listing",
    description: item.body || "",
    city: item.city || "",
    state: item.state || "",
    latitude: item.lat || undefined,
    longitude: item.lon || undefined,
    price: item.price ? parseFloat(item.price.replace(/[^0-9.]/g, "")) || undefined : undefined,
    sale_date: createdAt.toISOString().split("T")[0],
    photo_urls: item.photo_urls || [],
    category: item.category ? guessCategory(item.category + " " + item.title) : guessCategory(item.title),
    categories: item.category ? [item.category] : [],
    collected_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    raw_data: item as unknown as Record<string, unknown>,
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
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    raw_data: post as unknown as Record<string, unknown>,
  };
}

function eventToListing(event: NextdoorEvent): RawExternalListing {
  return {
    source: "nextdoor",
    source_id: `nextdoor-event-${event.id}`,
    source_url: event.url || `https://nextdoor.com/events/${event.id}`,
    title: event.title || "Untitled Event",
    description: event.description || "",
    city: event.city || "",
    state: event.state || "",
    latitude: event.lat || undefined,
    longitude: event.lon || undefined,
    address: event.address || event.venue_name || "",
    sale_date: event.start_date || new Date(event.creation_date_epoch_seconds * 1000).toISOString().split("T")[0],
    sale_time_start: event.start_date || undefined,
    sale_time_end: event.end_date || undefined,
    photo_urls: event.photo_url ? [event.photo_url] : [],
    category: guessCategory(event.title + " " + (event.description || "")),
    categories: [],
    collected_at: new Date().toISOString(),
    expires_at: event.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    raw_data: event as unknown as Record<string, unknown>,
  };
}

export async function collectNextdoor(): Promise<CollectorResult> {
  const sales: RawExternalListing[] = [];
  const errors: string[] = [];

  if (!process.env.NEXTDOOR_API_TOKEN) {
    return {
      source: "nextdoor",
      sales: [],
      errors: ["NEXTDOOR_API_TOKEN is not set — skipping Nextdoor collection"],
    };
  }

  for (const city of NEXTDOOR_CITIES) {
    try {
      await randomDelay(500, 1500);

      // 1. FSF (For Sale & Free) marketplace listings
      try {
        const fsfItems = await nextdoorFetch<NextdoorFSFItem>("search_sale_item", {
          lat: city.lat, lon: city.lng, radius: NEXTDOOR_RADIUS_MILES,
        });
        const yardSaleFSF = fsfItems.filter((item) =>
          isYardSaleRelated(item.title + " " + item.body + " " + (item.category || ""))
        );
        for (const item of yardSaleFSF) sales.push(fsfItemToListing(item));
        console.log(`[Nextdoor FSF] ${city.name}: ${yardSaleFSF.length}/${fsfItems.length} yard-sale items`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Nextdoor FSF ${city.name}: ${msg}`);
      }

      await randomDelay(300, 800);

      // 2. Posts with yard sale keywords
      for (const keyword of ["yard sale", "garage sale", "estate sale"]) {
        try {
          const posts = await nextdoorFetch<NextdoorPost>("search_post", {
            lat: city.lat, lon: city.lng, radius: NEXTDOOR_RADIUS_MILES, query: keyword,
          });
          for (const post of posts) sales.push(postToListing(post));
          console.log(`[Nextdoor Posts] ${city.name} "${keyword}": ${posts.length} posts`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Nextdoor Posts ${city.name} "${keyword}": ${msg}`);
        }
        await randomDelay(200, 600);
      }

      // 3. Events (yard sale / community sale events)
      try {
        const events = await nextdoorFetch<NextdoorEvent>("search_event", {
          lat: city.lat, lon: city.lng, radius: NEXTDOOR_RADIUS_MILES,
        });
        const yardSaleEvents = events.filter((event) =>
          isYardSaleRelated(event.title + " " + (event.description || ""))
        );
        for (const event of yardSaleEvents) sales.push(eventToListing(event));
        console.log(`[Nextdoor Events] ${city.name}: ${yardSaleEvents.length}/${events.length} yard-sale events`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Nextdoor Events ${city.name}: ${msg}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Nextdoor ${city.name} general: ${msg}`);
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const uniqueSales = sales.filter((sale) => {
    if (seen.has(sale.source_id)) return false;
    seen.add(sale.source_id);
    return true;
  });

  console.log(`[Nextdoor] Total unique listings: ${uniqueSales.length} (${errors.length} errors)`);
  return { source: "nextdoor", sales: uniqueSales, errors };
}

// ──────────────────────────────────────────────
// MAIN ENTRY POINT (5 sources now)
// ──────────────────────────────────────────────

export async function collectAllSources(): Promise<{
  results: CollectorResult[];
  totalSales: number;
  totalErrors: number;
}> {
  console.log("[Collectors] ═══════════════════════════════════════════");
  console.log(`[Collectors] ScraperAPI: ${getScraperApiKey() ? "ENABLED" : "DISABLED (no key)"}`);
  console.log("[Collectors] Sources: Craigslist, EstateSales, GarageSaleFinder, YardSaleSearch, Nextdoor");
  console.log("[Collectors] ═══════════════════════════════════════════");

  const settled = await Promise.allSettled([
    collectCraigslist(),
    collectEstateSales(),
    collectGarageSaleFinder(),
    collectYardSaleSearch(),
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
      console.log(`[Collectors] ${outcome.value.source}: ${outcome.value.sales.length} sales, ${outcome.value.errors.length} errors`);
    } else {
      totalErrors += 1;
      results.push({
        source: "unknown",
        sales: [],
        errors: [outcome.reason?.message || "Collector failed"],
      });
    }
  }

  console.log("[Collectors] ═══════════════════════════════════════════");
  console.log(`[Collectors] TOTAL: ${totalSales} sales, ${totalErrors} errors`);
  console.log("[Collectors] ═══════════════════════════════════════════");

  return { results, totalSales, totalErrors };
}
