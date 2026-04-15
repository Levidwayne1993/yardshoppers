import { PlaywrightCrawler, Dataset, createPlaywrightRouter } from 'crawlee';
import * as cheerio from 'cheerio';
import type { CitySource, RawListing } from './types.js';
import {
  hasPrimaryKeyword,
  hasSecondaryKeyword,
  shouldFollowUrl,
  scorePage,
  extractAddress,
  extractZip,
  extractDates,
  extractTimes,
} from './keywords.js';

// ============================================
// BROWSER HEADERS
// ============================================
const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  DNT: '1',
};

// ============================================
// CRAWLEE SCRAPER
// ============================================

/**
 * Crawl a batch of Crawlee-assigned sources for one city.
 * Returns an array of RawListing objects.
 */
export async function crawlWithCrawlee(
  sources: CitySource[],
  city: string,
  state: string,
  maxDepth: number = 2
): Promise<{ listings: RawListing[]; errors: string[] }> {
  const allListings: RawListing[] = [];
  const errors: string[] = [];

  // Process sources in batches of 10 to avoid overwhelming
  const BATCH_SIZE = 10;
  for (let i = 0; i < sources.length; i += BATCH_SIZE) {
    const batch = sources.slice(i, i + BATCH_SIZE);
    const startUrls = batch.map((s) => ({
      url: s.url,
      userData: {
        sourceName: s.name,
        sourceCategory: s.category,
        city,
        state,
        depth: 0,
        maxDepth: s.maxDepth ?? maxDepth,
      },
    }));

    const router = createPlaywrightRouter();

    // Default handler for all pages
    router.addDefaultHandler(async ({ request, page, enqueueLinks, log }) => {
      const userData = request.userData as any;
      const currentDepth = userData.depth || 0;
      const currentMaxDepth = userData.maxDepth || maxDepth;

      try {
        // Wait for page content to load
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

        const html = await page.content();
        const pageText = await page.evaluate(() => document.body?.innerText || '');
        const pageTitle = await page.title();

        // Score the page for relevance
        const relevanceScore = scorePage(pageText);

        if (relevanceScore < 10 && currentDepth > 0) {
          log.info(`Skipping low-relevance page (score: ${relevanceScore}): ${request.url}`);
          return;
        }

        // Extract listings from the page
        const $ = cheerio.load(html);
        const pageListings = extractListingsFromPage($, pageText, request.url, userData);

        if (pageListings.length > 0) {
          log.info(`Found ${pageListings.length} listings on ${request.url}`);
          allListings.push(...pageListings);
        }

        // Follow links if within depth limit
        if (currentDepth < currentMaxDepth) {
          await enqueueLinks({
            strategy: 'same-domain',
            transformRequestFunction: (req) => {
              // Only follow URLs matching our allowed patterns
              if (!shouldFollowUrl(req.url)) return false;
              req.userData = {
                ...userData,
                depth: currentDepth + 1,
              };
              return req;
            },
          });
        }
      } catch (err: any) {
        log.warning(`Error processing ${request.url}: ${err.message}`);
        errors.push(`${userData.sourceName}: ${err.message}`);
      }
    });

    try {
      const crawler = new PlaywrightCrawler({
        requestHandler: router,
        maxRequestsPerCrawl: 100,
        maxConcurrency: 5,
        requestHandlerTimeoutSecs: 30,
        navigationTimeoutSecs: 20,
        headless: true,
        launchContext: {
          launchOptions: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          },
        },
        preNavigationHooks: [
          async ({ page }) => {
            await page.setExtraHTTPHeaders(BROWSER_HEADERS);
          },
        ],
        failedRequestHandler: async ({ request, log }) => {
          log.warning(`Request failed: ${request.url}`);
          errors.push(`Failed: ${request.url}`);
        },
      });

      await crawler.run(startUrls);
    } catch (err: any) {
      errors.push(`Crawler batch error: ${err.message}`);
    }
  }

  return { listings: allListings, errors };
}

// ============================================
// PAGE EXTRACTION LOGIC
// ============================================

/**
 * Extract sale listings from a parsed HTML page.
 * Uses multiple strategies to find listings.
 */
function extractListingsFromPage(
  $: cheerio.CheerioAPI,
  pageText: string,
  sourceUrl: string,
  userData: any
): RawListing[] {
  const listings: RawListing[] = [];
  const seen = new Set<string>();

  // Strategy 1: JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '');
      const items = Array.isArray(data) ? data : data['@graph'] || [data];
      for (const item of items) {
        const type = item['@type'] || '';
        if (/Event|Sale|Product|Offer|ClassifiedAd/i.test(type)) {
          const title = item.name || item.headline || '';
          if (!title || title.length < 3) continue;
          const key = `${title}-${item.url || sourceUrl}`;
          if (seen.has(key)) continue;
          seen.add(key);

          listings.push({
            title: title.slice(0, 200),
            description: (item.description || '').slice(0, 1000),
            date: item.startDate || item.datePosted || item.datePublished || undefined,
            address: item.location?.address?.streetAddress || undefined,
            city: userData.city,
            state: userData.state,
            zip: item.location?.address?.postalCode || undefined,
            latitude: item.location?.geo?.latitude || undefined,
            longitude: item.location?.geo?.longitude || undefined,
            photos: item.image ? (Array.isArray(item.image) ? item.image.slice(0, 5) : [item.image]) : [],
            sourceUrl: item.url || sourceUrl,
            sourceName: userData.sourceName,
            sourceCategory: userData.sourceCategory,
            price: item.offers?.price || item.price || undefined,
          });
        }
      }
    } catch {}
  });

  // Strategy 2: Listing cards / articles with sale keywords
  const cardSelectors = [
    'article',
    '.listing',
    '.sale-listing',
    '.event-card',
    '.classified-item',
    '.result-item',
    '.sale-item',
    '[data-listing]',
    '[data-item]',
    '.card',
    '.post',
  ];

  for (const selector of cardSelectors) {
    $(selector).each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (!hasPrimaryKeyword(text)) return;

      const titleEl = $el.find('h1, h2, h3, h4, a[href]').first();
      const title = titleEl.text().trim().slice(0, 200);
      if (!title || title.length < 5) return;

      const linkEl = $el.find('a[href]').first();
      const href = linkEl.attr('href') || '';
      const fullUrl = href.startsWith('http') ? href : new URL(href, sourceUrl).toString();

      const key = `${title}-${fullUrl}`;
      if (seen.has(key)) return;
      seen.add(key);

      const imgEl = $el.find('img').first();
      const imgSrc = imgEl.attr('src') || imgEl.attr('data-src') || '';

      listings.push({
        title,
        description: text.slice(0, 1000),
        date: extractDates(text)[0] || undefined,
        time: extractTimes(text)[0] || undefined,
        address: extractAddress(text) || undefined,
        city: userData.city,
        state: userData.state,
        zip: extractZip(text) || undefined,
        photos: imgSrc ? [imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, sourceUrl).toString()] : [],
        sourceUrl: fullUrl || sourceUrl,
        sourceName: userData.sourceName,
        sourceCategory: userData.sourceCategory,
      });
    });
  }

  // Strategy 3: Links with sale-related text
  if (listings.length === 0) {
    $('a[href]').each((_, el) => {
      const $a = $(el);
      const text = $a.text().trim();
      const href = $a.attr('href') || '';

      if (!hasPrimaryKeyword(text) && !hasPrimaryKeyword(href)) return;
      if (text.length < 5 || text.length > 200) return;
      if (/\.(css|js|png|jpg|gif|svg|ico)(\?|$)/i.test(href)) return;
      if (/login|signup|register|subscribe|account|privacy|terms/i.test(href)) return;

      const fullUrl = href.startsWith('http') ? href : new URL(href, sourceUrl).toString();
      const key = `${text}-${fullUrl}`;
      if (seen.has(key)) return;
      seen.add(key);

      listings.push({
        title: text.slice(0, 200),
        description: undefined,
        city: userData.city,
        state: userData.state,
        sourceUrl: fullUrl,
        sourceName: userData.sourceName,
        sourceCategory: userData.sourceCategory,
      });
    });
  }

  // Strategy 4: RSS/Atom feed links on the page
  // (handled separately by the RSS collector if needed)

  return listings;
}

// ============================================
// RSS FEED COLLECTOR (for Craigslist RSS, etc.)
// ============================================

/**
 * Collect listings from an RSS/Atom feed URL.
 * Used for Craigslist RSS and any other feed-based sources.
 */
export async function collectFromRssFeed(
  feedUrl: string,
  sourceName: string,
  city: string,
  state: string,
  sourceCategory: string
): Promise<{ listings: RawListing[]; errors: string[] }> {
  const listings: RawListing[] = [];
  const errors: string[] = [];

  try {
    const response = await fetch(feedUrl, {
      headers: {
        ...BROWSER_HEADERS,
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
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
        const title = extractCdata(extractXmlTag(item, 'title'));
        const link = extractXmlTag(item, 'link');
        const description = extractCdata(extractXmlTag(item, 'description'));
        const dateStr = extractXmlTag(item, 'dc:date') || extractXmlTag(item, 'pubDate');

        // Extract image from enclosure
        const encMatch = item.match(/enc:enclosure[^>]*resource="([^"]+)"/i);
        const imageUrl = encMatch ? encMatch[1] : undefined;

        if (!title && !description) continue;

        listings.push({
          title: title || 'Sale Listing',
          description: description || undefined,
          date: dateStr || undefined,
          city,
          state,
          photos: imageUrl ? [imageUrl] : [],
          sourceUrl: link || feedUrl,
          sourceName,
          sourceCategory: sourceCategory as any,
        });
      } catch {}
    }
  } catch (err: any) {
    errors.push(`${sourceName}: ${err.message}`);
  }

  return { listings, errors };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractXmlTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extractCdata(text: string): string {
  const cdataRegex = /<!\[CDATA\[([\s\S]*?)\]\]>/;
  const match = text.match(cdataRegex);
  return match ? match[1].trim() : text.replace(/<[^>]*>/g, '').trim();
}
