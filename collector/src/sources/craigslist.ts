import { PlaywrightCrawler, Configuration } from 'crawlee';
import { XMLParser } from 'fast-xml-parser';
import type { RawSale, CollectorResult, CraigslistRssItem } from '../types.js';
import { CRAIGSLIST_REGIONS, CRAIGSLIST_CITY_STATES } from '../config.js';
import { normalizeSale } from '../normalizer.js';
import { upsertSales } from '../storage.js';

// ============================================================
//  Craigslist Collector — v3 (Playwright + isolated storage)
//
//  v2 used native fetch() but Craigslist blocked all requests.
//  v3 goes back to Playwright since it WORKED for GSALR.
//  The original v1 failure was caused by storage collision
//  between crawlers, not Playwright itself.
// ============================================================

export async function collectCraigslist(): Promise<CollectorResult[]> {
  const results: CollectorResult[] = [];
  const allSales: RawSale[] = [];

  const requests = CRAIGSLIST_REGIONS.map((region) => ({
    url: `https://${region}.craigslist.org/search/gms?format=rss`,
    userData: { region },
  }));

  const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  // Isolated storage — prevents collision with other crawlers
  const config = new Configuration({
    persistStorage: false,
    storageClientOptions: {
      localDataDirectory: './storage/craigslist',
    },
  });

  const crawler = new PlaywrightCrawler(
    {
      maxRequestsPerCrawl: 50,
      requestHandlerTimeoutSecs: 30,
      maxConcurrency: 2,
      navigationTimeoutSecs: 20,
      headless: true,
      browserPoolOptions: {
        useFingerprints: true,
      },

      async requestHandler({ page, request, log }) {
        const region = request.userData.region as string;
        log.info(`Scraping Craigslist: ${region}`);

        await page.waitForLoadState('domcontentloaded');

        const content = await page.content();

        // Check if blocked
        if (
          content.includes('blocked') ||
          content.includes('unusual traffic') ||
          content.includes('captcha') ||
          content.includes('This IP has been automatically blocked')
        ) {
          log.warning(`Blocked by Craigslist: ${region}`);
          results.push({
            source: 'craigslist',
            region,
            salesFound: 0,
            errors: ['Blocked by Craigslist anti-bot'],
          });
          return;
        }

        // Try to get the XML via in-page fetch (most reliable
        // method since Playwright wraps XML in HTML)
        let rssText = '';
        try {
          rssText = await page.evaluate(async (url: string) => {
            const res = await fetch(url);
            return await res.text();
          }, request.url);
        } catch {
          // Fallback to page content
          rssText = await page.evaluate(() => {
            const pre = document.querySelector('pre');
            if (pre) return pre.textContent || '';
            return document.body.innerText || document.body.textContent || '';
          });
        }

        if (
          !rssText ||
          (!rssText.includes('<item') && !rssText.includes('<entry'))
        ) {
          log.warning(`No RSS data found for ${region}`);
          results.push({
            source: 'craigslist',
            region,
            salesFound: 0,
            errors: ['No RSS/XML content in response'],
          });
          return;
        }

        // Parse the RSS XML
        let items: CraigslistRssItem[] = [];
        try {
          const parsed = xmlParser.parse(rssText);
          const channel =
            parsed?.['rdf:RDF'] || parsed?.rss?.channel || parsed;

          const rawItems =
            channel?.item || channel?.items?.item || [];

          items = Array.isArray(rawItems) ? rawItems : [rawItems];
        } catch (parseErr) {
          log.error(`XML parse error for ${region}: ${parseErr}`);
          results.push({
            source: 'craigslist',
            region,
            salesFound: 0,
            errors: [`XML parse error: ${parseErr}`],
          });
          return;
        }

        // Convert to RawSale objects
        const regionSales: RawSale[] = [];
        const state = CRAIGSLIST_CITY_STATES[region] || null;

        for (const item of items) {
          if (!item.title && !item.link) continue;

          regionSales.push({
            title: item.title || `Yard Sale in ${region}`,
            description: item.description || undefined,
            url: item.link || `https://${region}.craigslist.org/search/gms`,
            source: 'craigslist',
            city: region,
            state: state || undefined,
            start_date: item['dc:date'] || undefined,
            image_url: item['enc:enclosure']?.['@_resource'] || undefined,
          });
        }

        allSales.push(...regionSales);

        const icon = regionSales.length > 0 ? '✅' : '⚠️';
        log.info(`${icon} ${region}: ${regionSales.length} sales found`);

        results.push({
          source: 'craigslist',
          region,
          salesFound: regionSales.length,
          errors: [],
        });
      },

      async failedRequestHandler({ request, log }) {
        const region = request.userData.region as string;
        log.error(`Failed to load: ${region}`);
        results.push({
          source: 'craigslist',
          region,
          salesFound: 0,
          errors: [`Request completely failed: ${request.url}`],
        });
      },
    },
    config
  );

  await crawler.run(requests);

  if (allSales.length > 0) {
    const normalized = allSales.map((sale) => {
      const region = CRAIGSLIST_REGIONS.find((r) =>
        sale.url.includes(`${r}.craigslist.org`)
      );
      return normalizeSale(sale, region);
    });

    const stored = await upsertSales(normalized);
    console.log(`  ✅ Craigslist: ${stored} sales stored in Supabase`);
  } else {
    console.log('  ⚠️  Craigslist: 0 sales collected across all regions');
  }

  return results;
}
