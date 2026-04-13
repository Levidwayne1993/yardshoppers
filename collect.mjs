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

  const [craigslist, estateSales, gsalr] = await Promise.all([
    collectCraigslist(),
    collectEstateSales(),
    collectGsalr(),
  ]);

  const allSales = [...craigslist.sales, ...estateSales.sales, ...gsalr.sales];
  const allErrors = [...craigslist.errors, ...estateSales.errors, ...gsalr.errors];

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
