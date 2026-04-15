import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// ---- Load .env.local ----
function loadEnv() {
  try {
    const envFile = readFileSync(".env.local", "utf-8");
    const vars = {};
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      vars[key] = value;
    }
    return vars;
  } catch {
    console.error("ERROR: Could not read .env.local file");
    console.error("Make sure you run this from C:\\yardshoppers");
    process.exit(1);
  }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// SHARED UTILITIES
// ============================================

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  DNT: "1",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min = 1500, max = 3000) {
  return delay(Math.floor(Math.random() * (max - min) + min));
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function extractCdataContent(text) {
  const cdataMatch = text.match(/<!

\[CDATA

\[([\s\S]*?)\]

\]

>/);
  return cdataMatch
    ? cdataMatch[1].trim()
    : text.replace(/<[^>]*>/g, "").trim();
}

function guessCategory(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (/furniture|couch|sofa|table|chair|desk|dresser|bed|mattress/.test(text))
    return "Furniture";
  if (/electronics?|tv|computer|laptop|phone|tablet|gaming/.test(text))
    return "Electronics";
  if (/cloth|shirt|pants|dress|shoes|jacket|fashion/.test(text))
    return "Clothing";
  if (/tool|drill|saw|hammer|wrench|mower|garden/.test(text)) return "Tools";
  if (/toy|game|lego|puzzle|kid|child|baby/.test(text)) return "Toys & Games";
  if (/book|dvd|cd|vinyl|record|movie|media/.test(text))
    return "Books & Media";
  if (/kitchen|dish|pot|pan|appliance|blender/.test(text)) return "Kitchen";
  if (/sport|bike|bicycle|golf|fishing|camping/.test(text))
    return "Sports & Outdoors";
  if (/car|auto|vehicle|motor|tire|part/.test(text)) return "Automotive";
  if (/antique|vintage|collectible|retro/.test(text)) return "Antiques";
  return "General";
}

// ============================================
// CRAIGSLIST — RSS FEEDS
// ============================================

const CRAIGSLIST_REGIONS = [
  { id: "seattle", city: "Seattle", state: "WA" },
  { id: "tacoma", city: "Tacoma", state: "WA" },
  { id: "olympic", city: "Olympia", state: "WA" },
  { id: "portland", city: "Portland", state: "OR" },
];

async function collectCraigslist() {
  const sales = [];
  const errors = [];

  for (const region of CRAIGSLIST_REGIONS) {
    try {
      await randomDelay(1500, 3000);
      console.log(`  Fetching Craigslist ${region.id}...`);

      const url = `https://${region.id}.craigslist.org/search/gms?format=rss`;
      const response = await fetch(url, {
        headers: {
          ...BROWSER_HEADERS,
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        errors.push(`Craigslist ${region.id}: HTTP ${response.status}`);
        continue;
      }

      const xml = await response.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let itemMatch;

      while ((itemMatch = itemRegex.exec(xml)) !== null) {
        try {
          const item = itemMatch[1];
          const title = extractCdataContent(extractTag(item, "title"));
          const link = extractTag(item, "link");
          const description = extractCdataContent(extractTag(item, "description"));
          const dateStr = extractTag(item, "dc:date") || extractTag(item, "pubDate");

          const encMatch = item.match(/enc:enclosure[^>]*resource="([^"]+)"/i);
          const imageUrl = encMatch ? encMatch[1] : undefined;

          const idMatch = link.match(/\/(\d+)\.html/);
          const sourceId = idMatch
            ? `cl-${region.id}-${idMatch[1]}`
            : `cl-${region.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          let saleDate;
          if (dateStr) {
            try { saleDate = new Date(dateStr).toISOString().split("T")[0]; } catch {}
          }

          const category = guessCategory(title, description);

          sales.push({
            source: "craigslist",
            source_id: sourceId,
            source_url: link,
            title: title || "Garage Sale",
            description: description || null,
            city: region.city,
            state: region.state,
            category,
            categories: [category, "Garage Sales"],
            photo_urls: imageUrl ? [imageUrl] : [],
            sale_date: saleDate || null,
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          });
        } catch {}
      }

      console.log(`  Craigslist ${region.id}: found ${sales.length} items so far`);
    } catch (err) {
      errors.push(`Craigslist ${region.id}: ${err.message || String(err)}`);
    }
  }

  return { sales, errors };
}

// ============================================
// ESTATESALES.NET
// ============================================

const ESTATE_LOCATIONS = [
  { zip: "98501", city: "Olympia", state: "WA" },
  { zip: "98101", city: "Seattle", state: "WA" },
  { zip: "97201", city: "Portland", state: "OR" },
];

async function collectEstateSales() {
  const sales = [];
  const errors = [];

  for (const loc of ESTATE_LOCATIONS) {
    try {
      await randomDelay(1500, 3000);
      console.log(`  Fetching EstateSales.net ${loc.city}...`);

      const url = `https://www.estatesales.net/find-estate-sales/${loc.state}/${loc.city}/${loc.zip}`;
      const response = await fetch(url, {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        errors.push(`EstateSales.net ${loc.city}: HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();

      const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
      let jsonLdMatch;
      let foundJsonLd = false;

      while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
        try {
          const data = JSON.parse(jsonLdMatch[1]);
          const events = Array.isArray(data) ? data : [data];

          for (const event of events) {
            if (event["@type"] === "Event" || event["@type"] === "Sale" || event["@type"] === "SaleEvent") {
              foundJsonLd = true;
              const sourceId = `es-${loc.zip}-${(event.name || "").replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30)}-${Math.random().toString(36).slice(2, 8)}`;

              sales.push({
                source: "estatesales",
                source_id: sourceId,
                source_url: event.url || url,
                title: event.name || "Estate Sale",
                description: event.description || null,
                city: loc.city,
                state: loc.state,
                latitude: event.location?.geo?.latitude || null,
                longitude: event.location?.geo?.longitude || null,
                address: event.location?.address?.streetAddress || null,
                category: "Estate Sales",
                categories: ["Estate Sales"],
                photo_urls: event.image ? [].concat(event.image).slice(0, 5) : [],
                sale_date: event.startDate?.split("T")[0] || null,
                expires_at: event.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              });
            }
          }
        } catch {}
      }

      if (!foundJsonLd) {
        const linkRegex = /href="(\/estate-sales\/\d+[^"]*)"[^>]*>[\s\S]*?([A-Z][^<]{5,80})/gi;
        let linkMatch;

        while ((linkMatch = linkRegex.exec(html)) !== null) {
          const href = linkMatch[1];
          const title = linkMatch[2].trim();
          if (!title || title.length < 5) continue;

          const sourceId = `es-${href.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 60)}`;

          sales.push({
            source: "estatesales",
            source_id: sourceId,
            source_url: `https://www.estatesales.net${href}`,
            title,
            city: loc.city,
            state: loc.state,
            latitude: null,
            longitude: null,
            address: null,
            category: "Estate Sales",
            categories: ["Estate Sales"],
            photo_urls: [],
            sale_date: null,
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      }

      console.log(`  EstateSales.net ${loc.city}: found ${sales.length} items so far`);
    } catch (err) {
      errors.push(`EstateSales.net ${loc.city}: ${err.message || String(err)}`);
    }
  }

  return { sales, errors };
}

// ============================================
// GSALR.COM
// ============================================

const GSALR_SEARCHES = [
  { state: "WA", city: "Olympia" },
  { state: "WA", city: "Seattle" },
  { state: "OR", city: "Portland" },
];

async function collectGsalr() {
  const sales = [];
  const errors = [];

  for (const search of GSALR_SEARCHES) {
    try {
      await randomDelay(1500, 3000);
      console.log(`  Fetching GSALR ${search.city}...`);

      const url = `https://gsalr.com/garage-sales/${search.city.toLowerCase()}-${search.state.toLowerCase()}/`;
      const response = await fetch(url, {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        errors.push(`GSALR ${search.city}: HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();
      const linkRegex = /href="(\/sale\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let linkMatch;

      while ((linkMatch = linkRegex.exec(html)) !== null) {
        try {
          const href = linkMatch[1];
          const content = linkMatch[2];
          const titleMatch = content.match(/<[^>]*>([^<]{5,100})<\//);
          const title = titleMatch
            ? titleMatch[1].trim()
            : content.replace(/<[^>]*>/g, "").trim().slice(0, 100);

          if (!title || title.length < 3) continue;

          const dateMatch = content.match(/(\w+ \d{1,2},?\s*\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/);
          let saleDate;
          if (dateMatch) {
            try { saleDate = new Date(dateMatch[1]).toISOString().split("T")[0]; } catch {}
          }

          const sourceId = `gsalr-${href.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 60)}`;
          const category = guessCategory(title, "");

          sales.push({
            source: "gsalr",
            source_id: sourceId,
            source_url: `https://gsalr.com${href}`,
            title,
            city: search.city,
            state: search.state,
            latitude: null,
            longitude: null,
            address: null,
            category,
            categories: [category, "Garage Sales"],
            photo_urls: [],
            sale_date: saleDate || null,
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          });
        } catch {}
      }

      console.log(`  GSALR ${search.city}: found ${sales.length} items so far`);
    } catch (err) {
      errors.push(`GSALR ${search.city}: ${err.message || String(err)}`);
    }
  }

  return { sales, errors };
}

// ============================================
// NEWSPAPER CLASSIFIEDS — 50 SOURCES
// ============================================

const NEWSPAPER_SOURCES = [
  // --- Batch 1: Major metros ---
  { url: "https://nypost.com/classifieds", name: "NY Post", city: "New York", state: "NY" },
  { url: "https://www.latimes.com/classified", name: "LA Times", city: "Los Angeles", state: "CA" },
  { url: "https://www.chicagotribune.com/classified", name: "Chicago Tribune", city: "Chicago", state: "IL" },
  { url: "https://www.chron.com/classifieds", name: "Houston Chronicle", city: "Houston", state: "TX" },
  { url: "https://www.azcentral.com/local", name: "AZ Central", city: "Phoenix", state: "AZ" },
  { url: "https://www.inquirer.com/classified", name: "Philadelphia Inquirer", city: "Philadelphia", state: "PA" },
  { url: "https://www.expressnews.com/classifieds", name: "San Antonio Express-News", city: "San Antonio", state: "TX" },
  { url: "https://www.sandiegouniontribune.com/classified", name: "San Diego Union-Tribune", city: "San Diego", state: "CA" },
  { url: "https://www.dallasnews.com/classifieds", name: "Dallas Morning News", city: "Dallas", state: "TX" },
  { url: "https://www.mercurynews.com/classifieds", name: "Mercury News", city: "San Jose", state: "CA" },

  // --- Batch 2: Large cities ---
  { url: "https://www.statesman.com/classified", name: "Austin American-Statesman", city: "Austin", state: "TX" },
  { url: "https://www.jacksonville.com/classified", name: "Jacksonville Times-Union", city: "Jacksonville", state: "FL" },
  { url: "https://www.star-telegram.com/classifieds", name: "Fort Worth Star-Telegram", city: "Fort Worth", state: "TX" },
  { url: "https://www.dispatch.com/classified", name: "Columbus Dispatch", city: "Columbus", state: "OH" },
  { url: "https://www.charlotteobserver.com/classifieds", name: "Charlotte Observer", city: "Charlotte", state: "NC" },
  { url: "https://www.sfchronicle.com/classifieds", name: "SF Chronicle", city: "San Francisco", state: "CA" },
  { url: "https://www.indystar.com/classified", name: "Indianapolis Star", city: "Indianapolis", state: "IN" },
  { url: "https://www.seattletimes.com/classifieds", name: "Seattle Times", city: "Seattle", state: "WA" },
  { url: "https://www.denverpost.com/classifieds", name: "Denver Post", city: "Denver", state: "CO" },
  { url: "https://www.washingtonpost.com/classifieds", name: "Washington Post", city: "Washington", state: "DC" },

  // --- Batch 3: Mid-size metros ---
  { url: "https://www.bostonglobe.com/classified", name: "Boston Globe", city: "Boston", state: "MA" },
  { url: "https://www.tennessean.com/classified", name: "The Tennessean", city: "Nashville", state: "TN" },
  { url: "https://www.freep.com/classified", name: "Detroit Free Press", city: "Detroit", state: "MI" },
  { url: "https://www.oklahoman.com/classified", name: "The Oklahoman", city: "Oklahoma City", state: "OK" },
  { url: "https://www.oregonlive.com/classifieds", name: "The Oregonian", city: "Portland", state: "OR" },
  { url: "https://www.reviewjournal.com/classifieds", name: "Las Vegas Review-Journal", city: "Las Vegas", state: "NV" },
  { url: "https://www.commercialappeal.com/classified", name: "Commercial Appeal", city: "Memphis", state: "TN" },
  { url: "https://www.courier-journal.com/classified", name: "Courier Journal", city: "Louisville", state: "KY" },
  { url: "https://www.baltimoresun.com/classified", name: "Baltimore Sun", city: "Baltimore", state: "MD" },
  { url: "https://www.jsonline.com/classified", name: "Milwaukee Journal Sentinel", city: "Milwaukee", state: "WI" },

  // --- Batch 4: Regional metros ---
  { url: "https://www.abqjournal.com/classifieds", name: "Albuquerque Journal", city: "Albuquerque", state: "NM" },
  { url: "https://tucson.com/classifieds", name: "Arizona Daily Star", city: "Tucson", state: "AZ" },
  { url: "https://www.fresnobee.com/classifieds", name: "Fresno Bee", city: "Fresno", state: "CA" },
  { url: "https://www.sacbee.com/classifieds", name: "Sacramento Bee", city: "Sacramento", state: "CA" },
  { url: "https://www.kansascity.com/classifieds", name: "Kansas City Star", city: "Kansas City", state: "MO" },
  { url: "https://www.eastvalleytribune.com/classifieds", name: "East Valley Tribune", city: "Mesa", state: "AZ" },
  { url: "https://www.ajc.com/classifieds", name: "Atlanta Journal-Constitution", city: "Atlanta", state: "GA" },
  { url: "https://www.miamiherald.com/classifieds", name: "Miami Herald", city: "Miami", state: "FL" },
  { url: "https://www.newsobserver.com/classifieds", name: "News & Observer", city: "Raleigh", state: "NC" },
  { url: "https://omaha.com/classifieds", name: "Omaha World-Herald", city: "Omaha", state: "NE" },

  // --- Batch 5: Additional coverage ---
  { url: "https://gazette.com/classifieds", name: "Colorado Springs Gazette", city: "Colorado Springs", state: "CO" },
  { url: "https://www.startribune.com/classifieds", name: "Star Tribune", city: "Minneapolis", state: "MN" },
  { url: "https://tulsaworld.com/classifieds", name: "Tulsa World", city: "Tulsa", state: "OK" },
  { url: "https://www.star-telegram.com/news/local/arlington", name: "Star-Telegram Arlington", city: "Arlington", state: "TX" },
  { url: "https://www.tampabay.com/classifieds", name: "Tampa Bay Times", city: "Tampa", state: "FL" },
  { url: "https://www.nola.com/classifieds", name: "NOLA / Times-Picayune", city: "New Orleans", state: "LA" },
  { url: "https://www.kansas.com/classifieds", name: "Wichita Eagle", city: "Wichita", state: "KS" },
  { url: "https://www.cleveland.com/classifieds", name: "Cleveland Plain Dealer", city: "Cleveland", state: "OH" },
  { url: "https://www.bakersfield.com/classifieds", name: "Bakersfield Californian", city: "Bakersfield", state: "CA" },
  { url: "https://www.staradvertiser.com/classifieds", name: "Honolulu Star-Advertiser", city: "Honolulu", state: "HI" },
];

/**
 * Concurrency limiter — runs up to `poolLimit` async tasks at a time.
 * Returns Promise.allSettled-style results for every item.
 */
async function asyncPool(poolLimit, items, iteratorFn) {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);

    if (executing.size >= poolLimit) {
      await Promise.race(executing);
    }
  }

  return Promise.allSettled(results);
}

/**
 * Scrape a single newspaper classified page.
 * Uses 4 extraction strategies since each paper's site is structured differently:
 *   1. JSON-LD structured data
 *   2. Classified URL patterns
 *   3. HTML card / article structures
 *   4. RSS / Atom feed discovery
 */
async function scrapeNewspaperSource(source) {
  const listings = [];

  const response = await fetch(source.url, {
    headers: {
      ...BROWSER_HEADERS,
      Referer: new URL(source.url).origin,
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  const baseUrl = new URL(source.url).origin;

  // ── Strategy 1: JSON-LD structured data ──
  const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(jsonLdMatch[1]);
      const items = Array.isArray(parsed) ? parsed : (parsed["@graph"] || [parsed]);
      for (const item of items) {
        const type = item["@type"] || "";
        if (/Product|Offer|Event|Sale|ClassifiedAd|ListItem/i.test(type)) {
          const title = item.name || item.headline || item.title || "";
          const link = item.url || "";
          if (!title || title.length < 3) continue;

          listings.push({
            title: title.slice(0, 200),
            link: link.startsWith("http") ? link : `${baseUrl}${link}`,
            description: (item.description || "").slice(0, 500),
            price: item.offers?.price || item.price || null,
            image: typeof item.image === "string" ? item.image : (item.image?.url || null),
            date: item.datePosted || item.datePublished || item.startDate || null,
          });
        }
      }
    } catch {}
  }

  // ── Strategy 2: Classified listing link patterns ──
  if (listings.length === 0) {
    const classifiedLinkRegex =
      /href="((?:\/classifieds?\/|\/listing\/|\/ad\/|\/sell\/|\/for-sale\/|\/garage-sale\/|\/yard-sale\/)[^"]{5,300})"[^>]*>\s*([^<]{5,200})\s*<\/a>/gi;

    let match;
    while ((match = classifiedLinkRegex.exec(html)) !== null) {
      const href = match[1];
      const title = match[2].replace(/<[^>]*>/g, "").trim();

      if (/\.(css|js|png|jpg|gif|svg|ico)(\?|$)/i.test(href)) continue;
      if (/login|signup|sign-in|register|subscribe|account|privacy|terms|contact|about|faq/i.test(href)) continue;
      if (!title || title.length < 4 || title.length > 200) continue;

      const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href.startsWith("/") ? "" : "/"}${href}`;
      if (listings.some((l) => l.link === fullUrl)) continue;

      listings.push({
        title: title.slice(0, 200),
        link: fullUrl,
        description: null,
        price: null,
        image: null,
        date: null,
      });
    }
  }

  // ── Strategy 3: Generic listing cards / article-like structures ──
  if (listings.length === 0) {
    const cardPatterns = [
      /<a[^>]*href="([^"]{10,300})"[^>]*>[\s\S]*?<h[2-4][^>]*>([^<]{5,200})<\/h[2-4]>/gi,
      /<a[^>]*href="([^"]{10,300})"[^>]*data-(?:listing|item|ad|result)[^>]*>[\s\S]*?([A-Z][^<]{5,150})/gi,
      /<article[^>]*>[\s\S]*?<a[^>]*href="([^"]{10,300})"[^>]*>([\s\S]*?)<\/a>/gi,
    ];

    for (const pattern of cardPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const href = match[1];
        let title = match[2].replace(/<[^>]*>/g, "").trim();

        if (/\.(css|js|png|jpg|gif|svg|ico)(\?|$)/i.test(href)) continue;
        if (/login|signup|register|subscribe|account|privacy|terms/i.test(href)) continue;
        if (!title || title.length < 4 || title.length > 200) continue;

        const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href.startsWith("/") ? "" : "/"}${href}`;
        if (listings.some((l) => l.link === fullUrl)) continue;

        listings.push({
          title: title.slice(0, 200),
          link: fullUrl,
          description: null,
          price: null,
          image: null,
          date: null,
        });
      }
      if (listings.length > 0) break;
    }
  }

  // ── Strategy 4: RSS / Atom feed discovery and parsing ──
  if (listings.length === 0) {
    const rssLinkMatch = html.match(
      /<link[^>]*type="application\/(?:rss|atom)\+xml"[^>]*href="([^"]+)"/i
    );
    if (rssLinkMatch) {
      const feedUrl = rssLinkMatch[1].startsWith("http")
        ? rssLinkMatch[1]
        : `${baseUrl}${rssLinkMatch[1]}`;

      try {
        const feedResp = await fetch(feedUrl, {
          headers: {
            ...BROWSER_HEADERS,
            Accept: "application/rss+xml, application/xml, text/xml, */*",
          },
          signal: AbortSignal.timeout(10000),
        });

        if (feedResp.ok) {
          const feedXml = await feedResp.text();
          const itemRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi;
          let feedMatch;

          while ((feedMatch = itemRegex.exec(feedXml)) !== null) {
            const itemXml = feedMatch[1];
            const title = extractCdataContent(extractTag(itemXml, "title") || "");
            const link = extractTag(itemXml, "link") || "";
            const desc = extractCdataContent(
              extractTag(itemXml, "description") || extractTag(itemXml, "summary") || ""
            );
            const pubDate =
              extractTag(itemXml, "pubDate") || extractTag(itemXml, "published") || "";

            if (!title || title.length < 3) continue;

            listings.push({
              title: title.slice(0, 200),
              link: link.startsWith("http") ? link : `${baseUrl}${link}`,
              description: desc.slice(0, 500) || null,
              price: null,
              image: null,
              date: pubDate || null,
            });
          }
        }
      } catch {}
    }
  }

  return listings;
}

/**
 * Collect classified listings from all 50 newspaper sources.
 * Runs up to 5 sources concurrently with random delays between requests.
 */
async function collectNewspaperClassifieds() {
  const sales = [];
  const errors = [];

  console.log(`  Fetching Newspaper Classifieds (${NEWSPAPER_SOURCES.length} sources)...`);

  const results = await asyncPool(5, NEWSPAPER_SOURCES, async (source) => {
    try {
      await randomDelay(2000, 5000);
      console.log(`    Scraping ${source.name}...`);

      const listings = await scrapeNewspaperSource(source);

      const sourceSales = listings.slice(0, 50).map((listing, idx) => {
        const slugName = source.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 20);
        const slugTitle = (listing.title || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 30);
        const sourceId = `news-${slugName}-${slugTitle}-${idx}`;

        let saleDate = null;
        if (listing.date) {
          try {
            saleDate = new Date(listing.date).toISOString().split("T")[0];
          } catch {}
        }

        const category = guessCategory(listing.title || "", listing.description || "");

        return {
          source: "newspaper",
          source_id: sourceId,
          source_url: listing.link || source.url,
          title: listing.title || "Classified Listing",
          description: listing.description || null,
          city: source.city,
          state: source.state,
          latitude: null,
          longitude: null,
          address: null,
          category,
          categories: [category, "Classifieds"],
          photo_urls: listing.image ? [listing.image] : [],
          sale_date: saleDate,
          price: listing.price || null,
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        };
      });

      console.log(`    ${source.name}: found ${sourceSales.length} listings`);
      return { source: source.name, sales: sourceSales, error: null };
    } catch (err) {
      const msg = err.message || String(err);
      console.log(`    ${source.name}: ERROR - ${msg}`);
      return { source: source.name, sales: [], error: `${source.name}: ${msg}` };
    }
  });

  for (const result of results) {
    if (result.status === "fulfilled") {
      sales.push(...result.value.sales);
      if (result.value.error) errors.push(result.value.error);
    } else {
      errors.push(`Newspaper collector: ${result.reason?.message || "Unknown error"}`);
    }
  }

  console.log(
    `  Newspaper Classifieds total: ${sales.length} listings from ${NEWSPAPER_SOURCES.length} sources`
  );
  return { sales, errors };
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log("==========================================");
  console.log(`YardShoppers Collector - ${new Date().toLocaleString()}`);
  console.log("==========================================");
  console.log("");

  let cleaned = 0;
  try {
    const { data } = await supabase.rpc("cleanup_expired_external_sales");
    cleaned = typeof data === "number" ? data : 0;
    console.log(`Cleaned ${cleaned} expired listings`);
  } catch {
    console.log("Cleanup skipped (function may not exist yet)");
  }

  console.log("");
  console.log("Collecting from all sources...");
  console.log("");

  const [craigslist, estateSales, gsalr, newspaper] = await Promise.all([
    collectCraigslist(),
    collectEstateSales(),
    collectGsalr(),
    collectNewspaperClassifieds(),
  ]);

  const allSales = [
    ...craigslist.sales,
    ...estateSales.sales,
    ...gsalr.sales,
    ...newspaper.sales,
  ];
  const allErrors = [
    ...craigslist.errors,
    ...estateSales.errors,
    ...gsalr.errors,
    ...newspaper.errors,
  ];

  console.log("");
  console.log(`Total collected: ${allSales.length}`);
  console.log("");

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < allSales.length; i += 50) {
    const chunk = allSales.slice(i, i + 50).map((sale) => ({
      source: sale.source,
      source_id: sale.source_id,
      source_url: sale.source_url,
      title: sale.title,
      description: sale.description || null,
      city: sale.city || null,
      state: sale.state || null,
      latitude: sale.latitude || null,
      longitude: sale.longitude || null,
      price: sale.price || null,
      sale_date: sale.sale_date || null,
      sale_time_start: sale.sale_time_start || null,
      sale_time_end: sale.sale_time_end || null,
      category: sale.category || null,
      categories: sale.categories || [],
      photo_urls: sale.photo_urls || [],
      address: sale.address || null,
      expires_at: sale.expires_at || null,
      collected_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("external_sales")
      .upsert(chunk, { onConflict: "source_id", ignoreDuplicates: true })
      .select("id");

    if (error) {
      skipped += chunk.length;
      allErrors.push(`DB insert error: ${error.message}`);
    } else {
      inserted += data?.length || 0;
      skipped += chunk.length - (data?.length || 0);
    }
  }

  console.log("==========================================");
  console.log("RESULTS:");
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Cleaned:  ${cleaned}`);
  console.log(`  Errors:   ${allErrors.length}`);

  if (allErrors.length > 0) {
    console.log("");
    console.log("ERRORS:");
    for (const err of allErrors) {
      console.log(`  - ${err}`);
    }
  }

  console.log("==========================================");
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
