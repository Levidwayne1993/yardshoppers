import { ExternalSale } from "@/types/external";

// ============================================
// SHARED UTILITIES
// ============================================

const BROWSER_HEADERS: Record<string, string> = {
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min = 1000, max = 3000): Promise<void> {
  return delay(Math.floor(Math.random() * (max - min) + min));
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");

  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function extractCdataContent(text: string): string {
  const cdataMatch = text.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);


  return cdataMatch
    ? cdataMatch[1].trim()
    : text.replace(/<[^>]*>/g, "").trim();
}

function guessCategory(title: string, description: string): string {
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

async function collectCraigslist(): Promise<{
  sales: ExternalSale[];
  errors: string[];
}> {
  const sales: ExternalSale[] = [];
  const errors: string[] = [];

  for (const region of CRAIGSLIST_REGIONS) {
    try {
      await randomDelay(1500, 3000);

      const url = `https://${region.id}.craigslist.org/search/gms?format=rss`;
      const response = await fetch(url, {
        headers: {
          ...BROWSER_HEADERS,
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(10000),
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
          const description = extractCdataContent(
            extractTag(item, "description")
          );
          const dateStr =
            extractTag(item, "dc:date") || extractTag(item, "pubDate");

          const encMatch = item.match(
            /enc:enclosure[^>]*resource="([^"]+)"/i
          );
          const imageUrl = encMatch ? encMatch[1] : undefined;

          const idMatch = link.match(/\/(\d+)\.html/);
          const sourceId = idMatch
            ? `cl-${region.id}-${idMatch[1]}`
            : `cl-${region.id}-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`;

          let saleDate: string | undefined;
          if (dateStr) {
            try {
              saleDate = new Date(dateStr).toISOString().split("T")[0];
            } catch {
              /* ignore */
            }
          }

          const category = guessCategory(title, description);

          sales.push({
            source: "craigslist",
            source_id: sourceId,
            source_url: link,
            title: title || "Garage Sale",
            description: description || undefined,
            city: region.city,
            state: region.state,
            category,
            categories: [category, "Garage Sales"],
            photo_urls: imageUrl ? [imageUrl] : [],
            sale_date: saleDate,
            expires_at: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
          });
        } catch {
          /* skip item */
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Craigslist ${region.id}: ${msg}`);
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

async function collectEstateSales(): Promise<{
  sales: ExternalSale[];
  errors: string[];
}> {
  const sales: ExternalSale[] = [];
  const errors: string[] = [];

  for (const loc of ESTATE_LOCATIONS) {
    try {
      await randomDelay(1500, 3000);

      const url = `https://www.estatesales.net/find-estate-sales/${loc.state}/${loc.city}/${loc.zip}`;
      const response = await fetch(url, {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        errors.push(`EstateSales.net ${loc.city}: HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();

      // Try JSON-LD structured data first
      const jsonLdRegex =
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
      let jsonLdMatch;
      let foundJsonLd = false;

      while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
        try {
          const data = JSON.parse(jsonLdMatch[1]);
          const events = Array.isArray(data) ? data : [data];

          for (const event of events) {
            if (
              event["@type"] === "Event" ||
              event["@type"] === "Sale" ||
              event["@type"] === "SaleEvent"
            ) {
              foundJsonLd = true;
              const sourceId = `es-${loc.zip}-${(event.name || "")
                .replace(/[^a-zA-Z0-9]/g, "-")
                .slice(0, 30)}-${Math.random().toString(36).slice(2, 8)}`;

              sales.push({
                source: "estatesales",
                source_id: sourceId,
                source_url: event.url || url,
                title: event.name || "Estate Sale",
                description: event.description || undefined,
                city: loc.city,
                state: loc.state,
                latitude: event.location?.geo?.latitude,
                longitude: event.location?.geo?.longitude,
                address: event.location?.address?.streetAddress,
                category: "Estate Sales",
                categories: ["Estate Sales"],
                photo_urls: event.image
                  ? ([] as string[]).concat(event.image).slice(0, 5)
                  : [],
                sale_date: event.startDate?.split("T")[0],
                expires_at:
                  event.endDate ||
                  new Date(
                    Date.now() + 14 * 24 * 60 * 60 * 1000
                  ).toISOString(),
              });
            }
          }
        } catch {
          /* skip parse error */
        }
      }

      // Fallback: parse listing links from HTML
      if (!foundJsonLd) {
        const linkRegex =
          /href="(\/estate-sales\/\d+[^"]*)"[^>]*>[\s\S]*?([A-Z][^<]{5,80})/gi;
        let linkMatch;

        while ((linkMatch = linkRegex.exec(html)) !== null) {
          const href = linkMatch[1];
          const title = linkMatch[2].trim();
          if (!title || title.length < 5) continue;

          const sourceId = `es-${href
            .replace(/[^a-zA-Z0-9]/g, "-")
            .slice(0, 60)}`;

          sales.push({
            source: "estatesales",
            source_id: sourceId,
            source_url: `https://www.estatesales.net${href}`,
            title,
            city: loc.city,
            state: loc.state,
            category: "Estate Sales",
            categories: ["Estate Sales"],
            photo_urls: [],
            expires_at: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
          });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`EstateSales.net ${loc.city}: ${msg}`);
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

async function collectGsalr(): Promise<{
  sales: ExternalSale[];
  errors: string[];
}> {
  const sales: ExternalSale[] = [];
  const errors: string[] = [];

  for (const search of GSALR_SEARCHES) {
    try {
      await randomDelay(1500, 3000);

      const url = `https://gsalr.com/garage-sales/${search.city.toLowerCase()}-${search.state.toLowerCase()}/`;
      const response = await fetch(url, {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        errors.push(`GSALR ${search.city}: HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();

      const linkRegex =
        /href="(\/sale\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let linkMatch;

      while ((linkMatch = linkRegex.exec(html)) !== null) {
        try {
          const href = linkMatch[1];
          const content = linkMatch[2];
          const titleMatch = content.match(/<[^>]*>([^<]{5,100})<\//);
          const title = titleMatch
            ? titleMatch[1].trim()
            : content
                .replace(/<[^>]*>/g, "")
                .trim()
                .slice(0, 100);

          if (!title || title.length < 3) continue;

          const dateMatch = content.match(
            /(\w+ \d{1,2},?\s*\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/
          );
          let saleDate: string | undefined;
          if (dateMatch) {
            try {
              saleDate = new Date(dateMatch[1]).toISOString().split("T")[0];
            } catch {
              /* ignore */
            }
          }

          const sourceId = `gsalr-${href
            .replace(/[^a-zA-Z0-9]/g, "-")
            .slice(0, 60)}`;
          const category = guessCategory(title, "");

          sales.push({
            source: "gsalr",
            source_id: sourceId,
            source_url: `https://gsalr.com${href}`,
            title,
            city: search.city,
            state: search.state,
            category,
            categories: [category, "Garage Sales"],
            photo_urls: [],
            expires_at: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
          });
        } catch {
          /* skip */
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`GSALR ${search.city}: ${msg}`);
    }
  }

  return { sales, errors };
}

// ============================================
// MAIN EXPORT — RUN ALL COLLECTORS
// ============================================

export async function collectAllSources(): Promise<{
  sales: ExternalSale[];
  errors: string[];
}> {
  const [craigslist, estateSales, gsalr] = await Promise.all([
    collectCraigslist(),
    collectEstateSales(),
    collectGsalr(),
  ]);

  return {
    sales: [
      ...craigslist.sales,
      ...estateSales.sales,
      ...gsalr.sales,
    ],
    errors: [
      ...craigslist.errors,
      ...estateSales.errors,
      ...gsalr.errors,
    ],
  };
}
