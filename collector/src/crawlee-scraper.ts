import { PlaywrightCrawler, Dataset, createPlaywrightRouter, purgeDefaultStorages } from 'crawlee';
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
        const pageText = await page.evaluate(
          () => document.body?.innerText || ''
        );
        const pageTitle = await page.title();

        // Score the page for relevance
        const relevanceScore = scorePage(pageText);
        if (relevanceScore < 10 && currentDepth > 0) {
          log.info(
            `Skipping low-relevance page (score: ${relevanceScore}): ${request.url}`
          );
          return;
        }

        // Extract listings from the page
        const $ = cheerio.load(html);
        const pageListings = extractListingsFromPage(
          $,
          pageText,
          request.url,
          userData
        );

        if (pageListings.length > 0) {
          log.info(
            `Found ${pageListings.length} listings on ${request.url}`
          );
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

    // Purge cached storage so every batch starts fresh
    await purgeDefaultStorages();

    try {
      const crawler = new PlaywrightCrawler({
        requestHandler: router,
        maxRequestsPerCrawl: 500,
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
 * Try to find an address from dedicated HTML elements on the page/card.
 * Many sites put addresses in <address>, .address, .location, etc.
 */
function extractAddressFromElements(
  $el: cheerio.Cheerio<any>,
  $: cheerio.CheerioAPI
): { address: string | undefined; zip: string | undefined } {
  // Common selectors where sites put addresses
  const addressSelectors = [
    'address',
    '.address',
    '.street-address',
    '.sale-address',
    '.listing-address',
    '.event-address',
    '.event-location',
    '.location',
    '.venue',
    '[itemprop="streetAddress"]',
    '[itemprop="address"]',
    '[data-address]',
    '.details-address',
    '.info-address',
    '.sale-location',
    '.listing-location',
  ];

  for (const sel of addressSelectors) {
    const found = $el.find(sel).first();
    if (found.length > 0) {
      const text = found.text().trim();
      if (text.length > 5) {
        const addr = extractAddress(text) || text;
        const zip = extractZip(text) || undefined;
        return { address: addr, zip };
      }
    }
  }

  return { address: undefined, zip: undefined };
}

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

          // JSON-LD often has well-structured address data
          const loc = item.location || {};
          const addr = loc.address || {};
          const streetAddress =
            addr.streetAddress ||
            (typeof addr === 'string' ? addr : undefined);

          listings.push({
            title: title.slice(0, 200),
            description: (item.description || '').slice(0, 1000),
            date:
              item.startDate ||
              item.datePosted ||
              item.datePublished ||
              undefined,
            address: streetAddress || undefined,
            city: addr.addressLocality || userData.city,
            state: addr.addressRegion || userData.state,
            zip: addr.postalCode || undefined,
            latitude: loc.geo?.latitude || undefined,
            longitude: loc.geo?.longitude || undefined,
            photos: item.image
              ? Array.isArray(item.image)
                ? item.image.slice(0, 5)
                : [item.image]
              : [],
            sourceUrl: item.url || sourceUrl,
            sourceName: userData.sourceName,
            sourceCategory: userData.sourceCategory,
            price:
              item.offers?.price || item.price || undefined,
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
      const fullUrl = href.startsWith('http')
        ? href
        : new URL(href, sourceUrl).toString();

      const key = `${title}-${fullUrl}`;
      if (seen.has(key)) return;
      seen.add(key);

      const imgEl = $el.find('img').first();
      const imgSrc =
        imgEl.attr('src') || imgEl.attr('data-src') || '';

      // ── ADDRESS EXTRACTION (enhanced) ──
      // First try dedicated address elements inside the card
      const elemAddr = extractAddressFromElements($el, $);
      // Then fall back to regex on the full card text
      const address = elemAddr.address || extractAddress(text) || undefined;
      const zip = elemAddr.zip || extractZip(text) || undefined;

      listings.push({
        title,
        description: text.slice(0, 1000),
        date: extractDates(text)[0] || undefined,
        time: extractTimes(text)[0] || undefined,
        address,
        city: userData.city,
        state: userData.state,
        zip,
        photos: imgSrc
          ? [
              imgSrc.startsWith('http')
                ? imgSrc
                : new URL(imgSrc, sourceUrl).toString(),
            ]
          : [],
        sourceUrl: fullUrl || sourceUrl,
        sourceName: userData.sourceName,
        sourceCategory: userData.sourceCategory,
      });
    });
  }

  // Strategy 3: Links with sale-related text
  // NOW ALSO extracts address/zip/description from parent context
  if (listings.length === 0) {
    $('a[href]').each((_, el) => {
      const $a = $(el);
      const text = $a.text().trim();
      const href = $a.attr('href') || '';

      if (!hasPrimaryKeyword(text) && !hasPrimaryKeyword(href)) return;
      if (text.length < 5 || text.length > 200) return;
      if (/\.(css|js|png|jpg|gif|svg|ico)(\?|$)/i.test(href)) return;
      if (
        /login|signup|register|subscribe|account|privacy|terms/i.test(
          href
        )
      )
        return;

      const fullUrl = href.startsWith('http')
        ? href
        : new URL(href, sourceUrl).toString();

      const key = `${text}-${fullUrl}`;
      if (seen.has(key)) return;
      seen.add(key);

      // ── NEW: Get context from parent elements ──
      // Walk up to the nearest container to find address/description
      const $parent = $a.closest('li, div, tr, article, section, .listing, .card, .post, .item');
      const parentText = $parent.length > 0 ? $parent.text().trim() : '';
      const contextText = parentText.length > text.length ? parentText : text;

      // Try to extract address from the surrounding context
      const address = extractAddress(contextText) || undefined;
      const zip = extractZip(contextText) || undefined;
      const dates = extractDates(contextText);
      const times = extractTimes(contextText);

      // Get any image near the link
      const nearImg = $parent.find('img').first();
      const nearImgSrc = nearImg.attr('src') || nearImg.attr('data-src') || '';

      // Build a description from context (excluding just the title)
      const desc = contextText.length > text.length + 10
        ? contextText.slice(0, 1000)
        : undefined;

      listings.push({
        title: text.slice(0, 200),
        description: desc,
        date: dates[0] || undefined,
        time: times[0] || undefined,
        address,
        city: userData.city,
        state: userData.state,
        zip,
        photos: nearImgSrc
          ? [
              nearImgSrc.startsWith('http')
                ? nearImgSrc
                : new URL(nearImgSrc, sourceUrl).toString(),
            ]
          : [],
        sourceUrl: fullUrl,
        sourceName: userData.sourceName,
        sourceCategory: userData.sourceCategory,
      });
    });
  }

  // Strategy 4: Detail page — single listing on a dedicated page
  // If no cards or links matched, try to extract from the full page
  // This catches detail pages on yardsales.net, estatesale.com, etc.
  if (listings.length === 0 && hasPrimaryKeyword(pageText)) {
    const pageTitle = $('h1').first().text().trim() || $('title').text().trim();
    if (pageTitle && pageTitle.length >= 5) {
      const key = `${pageTitle}-${sourceUrl}`;
      if (!seen.has(key)) {
        seen.add(key);

        // Try to find address from dedicated elements on the page
        const bodyEl = $('body');
        const elemAddr = extractAddressFromElements(bodyEl, $);
        const address = elemAddr.address || extractAddress(pageText) || undefined;
        const zip = elemAddr.zip || extractZip(pageText) || undefined;

        // Get the main description
        const descEl = $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') ||
          '';
        const description = descEl || pageText.slice(0, 1000);

        // Get images
        const ogImage = $('meta[property="og:image"]').attr('content');
        const photos: string[] = [];
        if (ogImage) photos.push(ogImage);
        $('img[src]').each((_, img) => {
          const src = $(img).attr('src') || '';
          if (
            src.length > 10 &&
            !/(logo|icon|avatar|badge|button|banner|ad)/i.test(src) &&
            photos.length < 5
          ) {
            photos.push(
              src.startsWith('http') ? src : new URL(src, sourceUrl).toString()
            );
          }
        });

        // Get coordinates from meta or data attributes
        const latMeta = $('[itemprop="latitude"]').attr('content') ||
          $('meta[property="place:location:latitude"]').attr('content');
        const lngMeta = $('[itemprop="longitude"]').attr('content') ||
          $('meta[property="place:location:longitude"]').attr('content');

        listings.push({
          title: pageTitle.slice(0, 200),
          description: description.slice(0, 1000),
          date: extractDates(pageText)[0] || undefined,
          time: extractTimes(pageText)[0] || undefined,
          address,
          city: userData.city,
          state: userData.state,
          zip,
          latitude: latMeta ? parseFloat(latMeta) : undefined,
          longitude: lngMeta ? parseFloat(lngMeta) : undefined,
          photos,
          sourceUrl,
          sourceName: userData.sourceName,
          sourceCategory: userData.sourceCategory,
        });
      }
    }
  }

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
        const title = extractCdata(extractXmlTag(item, 'title'));
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

        if (!title && !description) continue;

        // Extract address from description content
        const combinedText = `${title || ''} ${description || ''}`;
        const address = extractAddress(combinedText) || undefined;
        const zip = extractZip(combinedText) || undefined;

        listings.push({
          title: title || 'Sale Listing',
          description: description || undefined,
          date: dateStr || undefined,
          address,
          zip,
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
