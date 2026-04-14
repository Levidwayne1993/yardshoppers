import { PlaywrightCrawler, Configuration } from 'crawlee';
import type { RawSale, CollectorResult } from '../types.js';
import { GSALR_LOCATIONS } from '../config.js';
import { normalizeSale } from '../normalizer.js';
import { upsertSales } from '../storage.js';

// ============================================================
//  GSALR Collector — v2 (isolated storage, TS fixes)
// ============================================================

export async function collectGsalr(): Promise<CollectorResult[]> {
  const results: CollectorResult[] = [];
  const allSales: RawSale[] = [];

  const requests = GSALR_LOCATIONS.map((loc) => ({
    url: `https://gsalr.com/yard-sales/${loc.state}/${loc.city}/`,
    userData: { ...loc },
  }));

  const config = new Configuration({
    persistStorage: false,
    storageClientOptions: {
      localDataDirectory: './storage/gsalr',
    },
  });

  const crawler = new PlaywrightCrawler(
    {
      maxRequestsPerCrawl: 20,
      requestHandlerTimeoutSecs: 60,
      maxConcurrency: 1,
      navigationTimeoutSecs: 45,
      headless: true,
      browserPoolOptions: {
        useFingerprints: true,
      },

      async requestHandler({ page, request, log }) {
        const { state, city } = request.userData as {
          state: string;
          city: string;
        };

        log.info(`Scraping GSALR: ${city}, ${state}`);

        await page.waitForLoadState('networkidle');

        const bodyText = await page.textContent('body');

        if (
          bodyText?.includes('403') ||
          bodyText?.includes('Access Denied') ||
          bodyText?.includes('Forbidden')
        ) {
          log.warning(`GSALR returned 403 for ${city}, ${state}`);
          results.push({
            source: 'gsalr',
            region: `${city}, ${state}`,
            salesFound: 0,
            errors: ['403 Forbidden - GSALR is blocking automated access'],
          });
          return;
        }

        const locationSales: RawSale[] = [];

        const selectors = [
          '.sale-listing',
          '.listing',
          '.sale-item',
          'article',
          '.yard-sale',
          '[class*="sale"]',
          '.search-result',
        ];

        for (const selector of selectors) {
          const cards = await page.$$(selector);
          if (cards.length === 0) continue;

          log.info(`Found ${cards.length} elements with: ${selector}`);

          for (const card of cards) {
            try {
              const title = await card
                .$eval('h2, h3, h4, .title, a', (el) =>
                  el.textContent?.trim()
                )
                .catch(() => null);

              const link = await card
                .$eval('a', (el) => (el as HTMLAnchorElement).href)
                .catch(() => null);

              const address = await card
                .$eval(
                  '.address, .location, [class*="address"]',
                  (el) => el.textContent?.trim()
                )
                .catch(() => null);

              const dateText = await card
                .$eval('.date, .dates, [class*="date"]', (el) =>
                  el.textContent?.trim()
                )
                .catch(() => null);

              const img = await card
                .$eval('img', (el) => (el as HTMLImageElement).src)
                .catch(() => null);

              if (title || link) {
                locationSales.push({
                  title: title || `Yard Sale in ${city}`,
                  address: address || undefined,
                  city,
                  state,
                  start_date: dateText || undefined,
                  url: link || request.url,
                  image_url: img || undefined,
                  source: 'gsalr',
                });
              }
            } catch {
              // Skip
            }
          }

          if (locationSales.length > 0) break;
        }

        // Fallback: grab all links that look like sale links
        if (locationSales.length === 0) {
          const saleLinks = await page.$$eval(
            'a[href*="sale"], a[href*="yard"]',
            (anchors: Element[]) =>
              anchors
                .filter((a) => {
                  const href = a.getAttribute('href') || '';
                  return (
                    href.length > 0 &&
                    !href.includes('login') &&
                    !href.includes('register')
                  );
                })
                .map((a) => ({
                  title: a.textContent?.trim() || '',
                  url: a.getAttribute('href') || '',
                }))
          );

          for (const link of saleLinks) {
            if (link.title && link.title.length > 5) {
              locationSales.push({
                title: link.title,
                city,
                state,
                url: link.url,
                source: 'gsalr',
              });
            }
          }
        }

        allSales.push(...locationSales);

        results.push({
          source: 'gsalr',
          region: `${city}, ${state}`,
          salesFound: locationSales.length,
          errors:
            locationSales.length === 0
              ? ['No sales found - may still be blocking or page changed']
              : [],
        });
      },

      async failedRequestHandler({ request, log }) {
        const { city, state } = request.userData as {
          city: string;
          state: string;
        };
        log.error(`Failed: ${city}, ${state}`);
        results.push({
          source: 'gsalr',
          region: `${city}, ${state}`,
          salesFound: 0,
          errors: [`Request failed: ${request.url}`],
        });
      },
    },
    config
  );

  await crawler.run(requests);

  if (allSales.length > 0) {
    const normalized = allSales.map((sale) => normalizeSale(sale));
    const stored = await upsertSales(normalized);
    console.log(`  ✅ GSALR: ${stored} sales stored`);
  } else {
    console.log(`  ⚠️  GSALR: 0 sales found (likely still blocked)`);
  }

  return results;
}
