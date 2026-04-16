import { PlaywrightCrawler, createPlaywrightRouter } from 'crawlee';
import type { CitySource, RawListing } from './types.js';
import {
  hasPrimaryKeyword,
  extractAddress,
  extractZip,
  extractDates,
  extractTimes,
} from './keywords.js';

// ============================================
// BROWSER CONFIG FOR BOT-RESISTANT SITES
// ============================================
const STEALTH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-blink-features=AutomationControlled',
  '--disable-features=IsolateOrigins,site-per-process',
];

const STEALTH_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  DNT: '1',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min = 2000, max = 5000): Promise<void> {
  return delay(Math.floor(Math.random() * (max - min) + min));
}

// ============================================
// MAIN SCRAPERAI ENTRY POINT
// ============================================

/**
 * Process ScraperAI-assigned sources for one city.
 * Handles Craigslist, Facebook, Nextdoor, EstateSales.net with
 * full browser automation and stealth measures.
 */
export async function crawlWithScraperAI(
  sources: CitySource[],
  city: string,
  state: string
): Promise<{ listings: RawListing[]; errors: string[] }> {
  const allListings: RawListing[] = [];
  const errors: string[] = [];

  // Group sources by type for specialized handling
  const craigslistSources = sources.filter(
    (s) => s.category === 'craigslist'
  );
  const facebookSources = sources.filter(
    (s) => s.category === 'facebook'
  );
  const estateSalesNetSources = sources.filter(
    (s) =>
      s.category === 'estate-sale' &&
      s.url.includes('estatesales.net')
  );
  const otherSources = sources.filter(
    (s) =>
      s.category !== 'craigslist' &&
      s.category !== 'facebook' &&
      !(
        s.category === 'estate-sale' &&
        s.url.includes('estatesales.net')
      )
  );

  // 1. Craigslist — use RSS feeds (most reliable)
  for (const source of craigslistSources) {
    try {
      await randomDelay(1500, 3000);
      const rssUrl = source.url.includes('?')
        ? source.url + '&format=rss'
        : source.url + '?format=rss';
      const result = await collectCraigslistRss(
        rssUrl,
        source.name,
        city,
        state
      );
      allListings.push(...result.listings);
      errors.push(...result.errors);
    } catch (err: any) {
      errors.push(`${source.name}: ${err.message}`);
    }
  }

  // 2. Facebook Events — skip (requires login, always returns 0)
  for (const source of facebookSources) {
    console.log(`  Skipping ${source.name} (Facebook requires login)`);
    continue;
  }

  // 3. EstateSales.net — JSON-LD + browser fallback
  for (const source of estateSalesNetSources) {
    try {
      await randomDelay(2000, 4000);
      const result = await scrapeEstateSalesNet(
        source,
        city,
        state
      );
      allListings.push(...result.listings);
      errors.push(...result.errors);
    } catch (err: any) {
      errors.push(`${source.name}: ${err.message}`);
    }
  }

  // 4. Other JS-heavy sites — generic browser scrape
  for (const source of otherSources) {
    try {
      await randomDelay(2000, 4000);
      const result = await scrapeGenericWithBrowser(
        source,
        city,
        state
      );
      allListings.push(...result.listings);
      errors.push(...result.errors);
    } catch (err: any) {
      errors.push(`${source.name}: ${err.message}`);
    }
  }

  return { listings: allListings, errors };
}

// ============================================
// CRAIGSLIST RSS COLLECTOR
// ============================================
async function collectCraigslistRss(
  rssUrl: string,
  sourceName: string,
  city: string,
  state: string
): Promise<{ listings: RawListing[]; errors: string[] }> {
  const listings: RawListing[] = [];
  const errors: string[] = [];

  try {
    console.log(`  Fetching ${sourceName} RSS...`);

    const response = await fetch(rssUrl, {
      headers: {
        ...STEALTH_HEADERS,
        Accept:
          'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      errors.push(`${sourceName}: HTTP ${response.status}`);
      return { listings, errors };
    }

    const xml = await response.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      try {
        const item = match[1];
        const title = extractCdata(
          extractXmlTag(item, 'title')
        );
        const link = extractXmlTag(item, 'link');
        const description = extractCdata(
          extractXmlTag(item, 'description')
        );
        const dateStr =
          extractXmlTag(item, 'dc:date') ||
          extractXmlTag(item, 'pubDate');

        // Extract image from enclosure
        const encMatch = item.match(
          /enc:enclosure[^>]*resource="([^"]+)"/i
        );
        const imageUrl = encMatch ? encMatch[1] : undefined;

        // Extract geo coordinates
        const latMatch = item.match(
          /<geo:lat>([^<]+)<\/geo:lat>/i
        );
        const lngMatch = item.match(
          /<geo:long>([^<]+)<\/geo:long>/i
        );

        if (!title && !description) continue;

        listings.push({
          title: title || 'Garage Sale',
          description: description || undefined,
          date: dateStr || undefined,
          city,
          state,
          latitude: latMatch
            ? parseFloat(latMatch[1])
            : undefined,
          longitude: lngMatch
            ? parseFloat(lngMatch[1])
            : undefined,
          address:
            extractAddress(description || '') || undefined,
          zip: extractZip(description || '') || undefined,
          photos: imageUrl ? [imageUrl] : [],
          sourceUrl: link || rssUrl,
          sourceName,
          sourceCategory: 'craigslist',
        });
      } catch {}
    }

    console.log(
      `  ${sourceName}: found ${listings.length} items`
    );
  } catch (err: any) {
    errors.push(`${sourceName}: ${err.message}`);
  }

  return { listings, errors };
}

// ============================================
// ESTATESALES.NET SCRAPER
// ============================================
async function scrapeEstateSalesNet(
  source: CitySource,
  city: string,
  state: string
): Promise<{ listings: RawListing[]; errors: string[] }> {
  const listings: RawListing[] = [];
  const errors: string[] = [];

  try {
    console.log(`  Fetching ${source.name}...`);

    // Try simple fetch first (JSON-LD)
    const response = await fetch(source.url, {
      headers: STEALTH_HEADERS,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      errors.push(`${source.name}: HTTP ${response.status}`);
      return { listings, errors };
    }

    const html = await response.text();

    // Extract JSON-LD structured data
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
            event['@type'] === 'Event' ||
            event['@type'] === 'Sale' ||
            event['@type'] === 'SaleEvent'
          ) {
            foundJsonLd = true;
            listings.push({
              title: event.name || 'Estate Sale',
              description: event.description || undefined,
              date: event.startDate || undefined,
              address:
                event.location?.address?.streetAddress ||
                undefined,
              city,
              state,
              zip:
                event.location?.address?.postalCode ||
                undefined,
              latitude:
                event.location?.geo?.latitude || undefined,
              longitude:
                event.location?.geo?.longitude || undefined,
              photos: event.image
                ? Array.isArray(event.image)
                  ? event.image.slice(0, 5)
                  : [event.image]
                : [],
              sourceUrl: event.url || source.url,
              sourceName: source.name,
              sourceCategory: 'estate-sale',
            });
          }
        }
      } catch {}
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

        listings.push({
          title,
          city,
          state,
          sourceUrl: `https://www.estatesales.net${href}`,
          sourceName: source.name,
          sourceCategory: 'estate-sale',
        });
      }
    }

    console.log(
      `  ${source.name}: found ${listings.length} items`
    );
  } catch (err: any) {
    errors.push(`${source.name}: ${err.message}`);
  }

  return { listings, errors };
}

// ============================================
// GENERIC BROWSER SCRAPER (fallback)
// ============================================
async function scrapeGenericWithBrowser(
  source: CitySource,
  city: string,
  state: string
): Promise<{ listings: RawListing[]; errors: string[] }> {
  const listings: RawListing[] = [];
  const errors: string[] = [];

  try {
    console.log(`  Scraping ${source.name} (browser)...`);

    const router = createPlaywrightRouter();

    router.addDefaultHandler(async ({ page, log }) => {
      try {
        await page.waitForLoadState('domcontentloaded', {
          timeout: 15000,
        });
        await delay(2000);

        const pageText = await page.evaluate(
          () => document.body?.innerText || ''
        );

        // Only process if page has relevant content
        if (!hasPrimaryKeyword(pageText)) {
          log.info(
            `${source.name}: no relevant content found`
          );
          return;
        }

        // Extract all links with sale-related text
        const links = await page.evaluate(() => {
          const results: any[] = [];
          document
            .querySelectorAll('a[href]')
            .forEach((a) => {
              const text = a.textContent?.trim() || '';
              const href =
                (a as HTMLAnchorElement).href || '';
              if (text.length >= 5 && text.length <= 200) {
                results.push({ text, href });
              }
            });
          return results;
        });

        for (const link of links) {
          if (!hasPrimaryKeyword(link.text)) continue;

          listings.push({
            title: link.text.slice(0, 200),
            city,
            state,
            sourceUrl: link.href || source.url,
            sourceName: source.name,
            sourceCategory: source.category,
          });
        }

        log.info(
          `${source.name}: found ${listings.length} items`
        );
      } catch (err: any) {
        log.warning(`${source.name}: ${err.message}`);
        errors.push(`${source.name}: ${err.message}`);
      }
    });

    const crawler = new PlaywrightCrawler({
      requestHandler: router,
      maxRequestsPerCrawl: 1,
      headless: true,
      navigationTimeoutSecs: 20,
      requestHandlerTimeoutSecs: 30,
      launchContext: {
        launchOptions: {
          args: STEALTH_ARGS,
        },
      },
      preNavigationHooks: [
        async ({ page }) => {
          await page.setExtraHTTPHeaders(STEALTH_HEADERS);
          await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {
              get: () => false,
            });
          });
        },
      ],
    });

    await crawler.run([{ url: source.url }]);
  } catch (err: any) {
    errors.push(`${source.name}: ${err.message}`);
  }

  return { listings, errors };
}

// ============================================
// XML HELPERS
// ============================================
function extractXmlTag(xml: string, tag: string): string {
  const regex = new RegExp(
    `<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    'i'
  );
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extractCdata(text: string): string {
  const cdataRegex = /<!\[CDATA\[([\s\S]*?)\]\]>/;
  const match = text.match(cdataRegex);
  return match
    ? match[1].trim()
    : text.replace(/<[^>]*>/g, '').trim();
}
