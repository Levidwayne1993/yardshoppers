import { PlaywrightCrawler, Configuration } from 'crawlee';
import type { RawSale, CollectorResult } from '../types.js';
import { normalizeSale } from '../normalizer.js';
import { upsertSales } from '../storage.js';

// ============================================================
//  EstateSales.net Collector — v4
//
//  v3 had three bugs:
//    1. URLs were /sale/{id} → 404. Correct: /{state}/{city}/{zip}/{id}
//    2. Titles were empty — API has no "title" field, need to
//       build from typeName + cityName
//    3. Same sale appeared ~4x per city (featured, coordinates,
//       city view, byIds). Now dedups globally by sale ID.
//    4. Dates are nested {_type, _value} objects, not strings
// ============================================================

const ESTATE_SALES_CITIES = [
  { city: 'Olympia', state: 'WA', zip: '98501' },
  { city: 'Seattle', state: 'WA', zip: '98101' },
  { city: 'Tacoma', state: 'WA', zip: '98402' },
  { city: 'Bellevue', state: 'WA', zip: '98004' },
  { city: 'Spokane', state: 'WA', zip: '99201' },
  { city: 'Vancouver', state: 'WA', zip: '98660' },
  { city: 'Portland', state: 'OR', zip: '97201' },
  { city: 'Eugene', state: 'OR', zip: '97401' },
  { city: 'Salem', state: 'OR', zip: '97301' },
  { city: 'Bend', state: 'OR', zip: '97701' },
  { city: 'Boise', state: 'ID', zip: '83701' },
  { city: 'Nampa', state: 'ID', zip: '83651' },
];

/** Convert API typeName to a clean, readable label */
function getSaleTypeLabel(typeName?: string): string {
  if (!typeName) return 'Estate Sale';

  const map: Record<string, string> = {
    EstateSale: 'Estate Sale',
    EstateSales: 'Estate Sale',
    GarageSale: 'Garage Sale',
    GarageSales: 'Garage Sale',
    YardSale: 'Yard Sale',
    YardSales: 'Yard Sale',
    MovingSale: 'Moving Sale',
    MovingSales: 'Moving Sale',
    OnlineOnlyAuctions: 'Online Auction',
    OnlineOnlyAuction: 'Online Auction',
    TagSale: 'Tag Sale',
    TagSales: 'Tag Sale',
    RummageSale: 'Rummage Sale',
    Downsizing: 'Downsizing Sale',
    Liquidation: 'Liquidation Sale',
  };

  // If we have a mapping, use it. Otherwise, split camelCase.
  return map[typeName] || typeName.replace(/([A-Z])/g, ' $1').trim();
}

/** Extract a date string from the API's nested date objects */
function extractApiDate(dateObj: unknown): string | undefined {
  if (!dateObj) return undefined;
  if (typeof dateObj === 'string') return dateObj;
  if (typeof dateObj === 'object' && dateObj !== null) {
    const obj = dateObj as Record<string, unknown>;
    if (typeof obj._value === 'string') return obj._value;
    if (typeof obj.value === 'string') return obj.value;
  }
  return undefined;
}

/** Build the correct EstateSales.net URL for a sale */
function buildSaleUrl(sale: Record<string, unknown>): string {
  const state = sale.stateCode as string || '';
  const city = (sale.cityName as string || '').replace(/\s+/g, '-');
  const zip = sale.postalCodeNumber as string || '';
  const id = sale.id;

  if (state && city && zip && id) {
    return `https://www.estatesales.net/${state}/${city}/${zip}/${id}`;
  }
  return `https://www.estatesales.net/${state}/${city}/${zip}`;
}

export async function collectEstateSales(): Promise<CollectorResult[]> {
  const results: CollectorResult[] = [];

  // ── Global dedup map keyed by EstateSales sale ID ──────────
  // The same sale appears in ~4 API responses per city
  // (coordinates, featured, city-view, byIds).
  // This map keeps only ONE copy, merging fields if a later
  // response has more data (e.g., mainPicture).
  const salesMap = new Map<number, Record<string, unknown>>();

  const requests = ESTATE_SALES_CITIES.map((loc) => ({
    url: `https://www.estatesales.net/${loc.state}/${loc.city}/${loc.zip}`,
    userData: { city: loc.city, state: loc.state, zip: loc.zip },
  }));

  const config = new Configuration({
    persistStorage: false,
    storageClientOptions: {
      localDataDirectory: './storage/estatesales',
    },
  });

  const crawler = new PlaywrightCrawler(
    {
      maxRequestsPerCrawl: 20,
      requestHandlerTimeoutSecs: 45,
      maxConcurrency: 2,
      navigationTimeoutSecs: 30,
      headless: true,

      // Register the API interceptor BEFORE navigation so we
      // catch every response, including ones that fire during
      // initial page load.
      preNavigationHooks: [
        async ({ page }) => {
          page.on('response', async (response) => {
            const url = response.url();

            // Only process sale-details API responses
            if (!url.includes('/api/sale-details')) return;

            // Skip nationally/regionally "random featured" —
            // they're mostly noise from other states
            if (url.includes('threerandom')) return;

            try {
              const json = await response.json();
              const sales: Record<string, unknown>[] = Array.isArray(json)
                ? json
                : [json];

              for (const sale of sales) {
                const id = sale.id as number | undefined;
                if (!id || typeof id !== 'number') continue;

                // Merge into global map — later responses may
                // carry extra fields (e.g. mainPicture)
                const existing = salesMap.get(id);
                if (existing) {
                  salesMap.set(id, { ...existing, ...sale });
                } else {
                  salesMap.set(id, { ...sale });
                }
              }
            } catch {
              // Not JSON — skip silently
            }
          });
        },
      ],

      async requestHandler({ page, request, log }) {
        const { city, state } = request.userData as {
          city: string;
          state: string;
          zip: string;
        };
        log.info(`Scraping EstateSales.net: ${city}, ${state}`);

        const sizeBefore = salesMap.size;

        // Wait for all API responses to arrive
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(3000);

        const newSales = salesMap.size - sizeBefore;
        const icon = newSales > 0 ? '✅' : '⚠️';
        log.info(`  ${icon} ${city}, ${state}: ${newSales} new unique sales (${salesMap.size} total)`);

        results.push({
          source: 'estatesales',
          region: `${city}, ${state}`,
          salesFound: newSales,
          errors: [],
        });
      },

      async failedRequestHandler({ request, log }) {
        const { city, state } = request.userData as {
          city: string;
          state: string;
        };
        log.error(`Failed to load: ${city}, ${state}`);
        results.push({
          source: 'estatesales',
          region: `${city}, ${state}`,
          salesFound: 0,
          errors: [`Failed to load ${city}, ${state}`],
        });
      },
    },
    config
  );

  await crawler.run(requests);

  // ── Convert deduped map → RawSale[] ─────────────────────────
  console.log(`  🔄 Deduplicated to ${salesMap.size} unique sales`);

  const allSales: RawSale[] = [];

  for (const [, sale] of salesMap) {
    const typeLabel = getSaleTypeLabel(sale.typeName as string | undefined);
    const city = (sale.cityName as string) || 'Unknown';
    const state = (sale.stateCode as string) || '';

    // Build a descriptive title
    const title = `${typeLabel} in ${city}`;

    // Build the correct URL
    const url = buildSaleUrl(sale);

    // Extract dates from nested {_type, _value} objects
    const startDate = extractApiDate(sale.firstLocalStartDate);
    const endDate = extractApiDate(sale.lastLocalEndDate);

    // Extract image if available
    const mainPic = sale.mainPicture as Record<string, unknown> | undefined;
    const imageUrl =
      (mainPic?.url as string) ||
      (sale.mainPictureUrl as string) ||
      (sale.pictureUrl as string) ||
      undefined;

    // Build description from available metadata
    const descParts: string[] = [];
    descParts.push(typeLabel);
    if (sale.saleScheduleName) {
      descParts.push(`Schedule: ${sale.saleScheduleName}`);
    }
    if (city && state) {
      descParts.push(`${city}, ${state}`);
    }

    allSales.push({
      title,
      description: descParts.join(' · '),
      url,
      source: 'estatesales',
      city,
      state,
      zip_code: (sale.postalCodeNumber as string) || undefined,
      latitude: (sale.latitude as number) || undefined,
      longitude: (sale.longitude as number) || undefined,
      start_date: startDate,
      end_date: endDate,
      image_url: imageUrl,
    });
  }

  if (allSales.length > 0) {
    const normalized = allSales.map((sale) => normalizeSale(sale));
    const stored = await upsertSales(normalized);
    console.log(`  ✅ EstateSales.net: ${stored} sales stored in Supabase`);
  } else {
    console.log('  ⚠️  EstateSales.net: 0 sales collected');
  }

  return results;
}
