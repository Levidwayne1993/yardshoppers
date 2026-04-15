// FILE: collector/src/main.ts
// Main orchestrator — replaces the old collect.mjs logic
// Runs: load configs → crawl → normalize → deduplicate → insert

import 'dotenv/config';
import { CITY_CONFIGS } from './city-config.js';
import { crawlWithCrawlee } from './crawlee-scraper.js';
import { crawlWithScraperAI } from './scraperai-scraper.js';
import { normalizeAll } from './normalizer.js';
import {
  batchUpsert,
  cleanupExpired,
  getTotalListingCount,
  getCountsByCity,
} from './db-client.js';
import type {
  CityConfig,
  CitySource,
  RawListing,
  NormalizedSale,
} from './types.js';

// ============================================
// CLI ARGUMENT PARSING
// ============================================

interface CliOptions {
  crawleeOnly: boolean;
  scraperaiOnly: boolean;
  cityFilter: string | null;
  dryRun: boolean;
  verbose: boolean;
  skipCleanup: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    crawleeOnly: false,
    scraperaiOnly: false,
    cityFilter: null,
    dryRun: false,
    verbose: false,
    skipCleanup: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--crawlee-only':
        options.crawleeOnly = true;
        break;
      case '--scraperai-only':
        options.scraperaiOnly = true;
        break;
      case '--city':
        options.cityFilter = args[++i] || null;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--skip-cleanup':
        options.skipCleanup = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
YardShoppers Collector — Unified Scraper System

Usage:
  npx tsx src/main.ts [options]

Options:
  --crawlee-only      Run only Crawlee-assigned sources (skip ScraperAI)
  --scraperai-only    Run only ScraperAI-assigned sources (skip Crawlee)
  --city <name>       Run only a specific city (e.g., --city seattle)
  --dry-run           Crawl and normalize but don't insert into DB
  --verbose           Show detailed logging
  --skip-cleanup      Skip expired listing cleanup
  --help              Show this help message

Examples:
  npx tsx src/main.ts                          # Full run, all cities
  npx tsx src/main.ts --city seattle           # Only Seattle
  npx tsx src/main.ts --crawlee-only           # Only Crawlee sources
  npx tsx src/main.ts --dry-run --city denver  # Test Denver without DB writes
`);
}

// ============================================
// STATS TRACKER
// ============================================

interface RunStats {
  startTime: string;
  endTime: string;
  durationMs: number;
  citiesProcessed: string[];
  totalSources: number;
  sourcesProcessed: number;
  sourcesFailed: number;
  rawListingsFound: number;
  normalizedListings: number;
  duplicatesRemoved: number;
  insertedToDb: number;
  expiredCleaned: number;
  errors: string[];
}

function createStats(): RunStats {
  return {
    startTime: new Date().toISOString(),
    endTime: '',
    durationMs: 0,
    citiesProcessed: [],
    totalSources: 0,
    sourcesProcessed: 0,
    sourcesFailed: 0,
    rawListingsFound: 0,
    normalizedListings: 0,
    duplicatesRemoved: 0,
    insertedToDb: 0,
    expiredCleaned: 0,
    errors: [],
  };
}

// ============================================
// DEDUPLICATION
// ============================================

function deduplicateListings(listings: NormalizedSale[]): NormalizedSale[] {
  const seen = new Set<string>();
  const unique: NormalizedSale[] = [];

  for (const listing of listings) {
    if (!seen.has(listing.source_id)) {
      seen.add(listing.source_id);
      unique.push(listing);
    }
  }

  return unique;
}

// ============================================
// PROCESS A SINGLE CITY
// ============================================

async function processCity(
  cityConfig: CityConfig,
  options: CliOptions,
  stats: RunStats
): Promise<NormalizedSale[]> {
  const { city, state, sources } = cityConfig;
  const cityLabel = `${city}, ${state}`;

  console.log(`\n=============================================`);
  console.log(` Processing: ${cityLabel}`);
  console.log(` Total sources: ${sources.length}`);
  console.log(`=============================================`);

  // Split sources by crawler type
  const crawleeSources = sources.filter((s) => s.crawler === 'crawlee');
  const scraperaiSources = sources.filter((s) => s.crawler === 'scraperai');

  console.log(`  Crawlee sources: ${crawleeSources.length}`);
  console.log(`  ScraperAI sources: ${scraperaiSources.length}`);

  const allRawListings: RawListing[] = [];
  const allErrors: string[] = [];

  // --- Run Crawlee sources ---
  if (crawleeSources.length > 0 && !options.scraperaiOnly) {
    console.log(`\n  Running Crawlee for ${cityLabel}...`);
    try {
      const result = await crawlWithCrawlee(crawleeSources, city, state);
      allRawListings.push(...result.listings);
      allErrors.push(...result.errors);
      stats.sourcesProcessed += crawleeSources.length;
      console.log(`  Crawlee found: ${result.listings.length} listings`);
      if (result.errors.length > 0) {
        console.log(`  Crawlee errors: ${result.errors.length}`);
        stats.sourcesFailed += result.errors.length;
      }
    } catch (err: any) {
      const errMsg = `Crawlee failed for ${cityLabel}: ${err.message}`;
      console.error(`  ${errMsg}`);
      allErrors.push(errMsg);
      stats.sourcesFailed += crawleeSources.length;
    }
  }

  // --- Run ScraperAI sources ---
  if (scraperaiSources.length > 0 && !options.crawleeOnly) {
    console.log(`\n  Running ScraperAI for ${cityLabel}...`);
    try {
      const result = await crawlWithScraperAI(scraperaiSources, city, state);
      allRawListings.push(...result.listings);
      allErrors.push(...result.errors);
      stats.sourcesProcessed += scraperaiSources.length;
      console.log(`  ScraperAI found: ${result.listings.length} listings`);
      if (result.errors.length > 0) {
        console.log(`  ScraperAI errors: ${result.errors.length}`);
        stats.sourcesFailed += result.errors.length;
      }
    } catch (err: any) {
      const errMsg = `ScraperAI failed for ${cityLabel}: ${err.message}`;
      console.error(`  ${errMsg}`);
      allErrors.push(errMsg);
      stats.sourcesFailed += scraperaiSources.length;
    }
  }

  // Track raw listings found
  stats.rawListingsFound += allRawListings.length;
  stats.errors.push(...allErrors);

  // --- Normalize ---
  console.log(`\n  Normalizing ${allRawListings.length} raw listings...`);
  const normalized = normalizeAll(allRawListings, city, state);
  stats.normalizedListings += normalized.length;
  console.log(`  Normalized: ${normalized.length} listings`);

  // --- Deduplicate ---
  const deduped = deduplicateListings(normalized);
  const dupeCount = normalized.length - deduped.length;
  stats.duplicatesRemoved += dupeCount;
  if (dupeCount > 0) {
    console.log(`  Duplicates removed: ${dupeCount}`);
  }
  console.log(`  Final unique listings: ${deduped.length}`);

  // Track city as processed
  stats.citiesProcessed.push(cityLabel);

  return deduped;
}

// ============================================
// MAIN ORCHESTRATOR
// ============================================

async function main(): Promise<void> {
  const startTime = Date.now();
  const options = parseArgs();
  const stats = createStats();

  console.log('================================================');
  console.log(' YardShoppers Collector v2.0');
  console.log(` Started: ${stats.startTime}`);
  console.log('================================================');

  if (options.dryRun) {
    console.log(' ** DRY RUN MODE — no DB writes **');
  }
  if (options.crawleeOnly) {
    console.log(' ** CRAWLEE ONLY MODE **');
  }
  if (options.scraperaiOnly) {
    console.log(' ** SCRAPERAI ONLY MODE **');
  }

  // 1. Select cities to process
  let citiesToProcess: CityConfig[] = CITY_CONFIGS;

  if (options.cityFilter) {
    const filterLower = options.cityFilter.toLowerCase();
    citiesToProcess = CITY_CONFIGS.filter(
      (c) =>
        c.city.toLowerCase() === filterLower ||
        c.city.toLowerCase().includes(filterLower)
    );

    if (citiesToProcess.length === 0) {
      console.error(`\n No city found matching: "${options.cityFilter}"`);
      console.log(' Available cities:');
      CITY_CONFIGS.forEach((c) => console.log(`   - ${c.city}, ${c.state}`));
      process.exit(1);
    }

    console.log(`\n Filtering to: ${citiesToProcess.map((c) => c.city).join(', ')}`);
  }

  // Count total sources
  stats.totalSources = citiesToProcess.reduce(
    (sum, c) => sum + c.sources.length,
    0
  );

  console.log(`\n Cities: ${citiesToProcess.length}`);
  console.log(` Total sources: ${stats.totalSources}`);

  // 2. Process each city
  const allListings: NormalizedSale[] = [];

  for (const cityConfig of citiesToProcess) {
    try {
      const cityListings = await processCity(cityConfig, options, stats);
      allListings.push(...cityListings);
    } catch (err: any) {
      const errMsg = `Fatal error processing ${cityConfig.city}: ${err.message}`;
      console.error(`\n ${errMsg}`);
      stats.errors.push(errMsg);
    }
  }

  // 3. Final cross-city deduplication
  console.log('\n=============================================');
  console.log(' Cross-city deduplication...');
  console.log('=============================================');

  const finalDeduped = deduplicateListings(allListings);
  const crossCityDupes = allListings.length - finalDeduped.length;

  if (crossCityDupes > 0) {
    console.log(` Cross-city duplicates removed: ${crossCityDupes}`);
    stats.duplicatesRemoved += crossCityDupes;
  }

  console.log(` Final listing count: ${finalDeduped.length}`);

  // 4. Insert into database
  if (!options.dryRun && finalDeduped.length > 0) {
    console.log('\n=============================================');
    console.log(' Inserting into database...');
    console.log('=============================================');

    try {
      const { inserted, errors: dbErrors } = await batchUpsert(finalDeduped);
      stats.insertedToDb = inserted;

      if (dbErrors.length > 0) {
        console.log(` DB errors: ${dbErrors.length}`);
        stats.errors.push(...dbErrors);
      }

      console.log(` Inserted/updated: ${inserted} listings`);
    } catch (err: any) {
      const errMsg = `Database insert failed: ${err.message}`;
      console.error(` ${errMsg}`);
      stats.errors.push(errMsg);
    }
  } else if (options.dryRun) {
    console.log(`\n [DRY RUN] Would have inserted ${finalDeduped.length} listings`);
  }

  // 5. Cleanup expired listings
  if (!options.dryRun && !options.skipCleanup) {
    console.log('\n=============================================');
    console.log(' Cleaning up expired listings...');
    console.log('=============================================');

    try {
      const { deleted, error: cleanupError } = await cleanupExpired();
      stats.expiredCleaned = deleted;

      if (cleanupError) {
        console.error(` Cleanup error: ${cleanupError}`);
        stats.errors.push(`Cleanup: ${cleanupError}`);
      } else {
        console.log(` Expired listings removed: ${deleted}`);
      }
    } catch (err: any) {
      console.error(` Cleanup failed: ${err.message}`);
      stats.errors.push(`Cleanup: ${err.message}`);
    }
  }

  // 6. DB totals
  if (!options.dryRun) {
    try {
      const totalCount = await getTotalListingCount();
      console.log(`\n Total listings in DB: ${totalCount}`);

      const countResults = await getCountsByCity();
      const countsArray = Array.isArray(countResults) ? countResults : Object.entries(countResults).map(([city, count]) => ({ city, count }));
      if (countsArray.length > 0) {
        console.log('\n Listings by city:');
        for (const row of countsArray) {
          const rowData = row as Record<string, any>;
          console.log(`   ${rowData.city ?? 'Unknown'}, ${rowData.state ?? '??'}: ${rowData.count ?? 0}`);
        }
      }
    } catch (err: any) {
      console.log(` Could not fetch DB totals: ${err.message}`);
    }
  }

  // 7. Final stats
  const endTime = Date.now();
  stats.endTime = new Date().toISOString();
  stats.durationMs = endTime - startTime;

  console.log('\n================================================');
  console.log(' COLLECTION COMPLETE — SUMMARY');
  console.log('================================================');
  console.log(` Cities processed:      ${stats.citiesProcessed.length}`);
  console.log(` Total sources:         ${stats.totalSources}`);
  console.log(` Sources processed:     ${stats.sourcesProcessed}`);
  console.log(` Sources failed:        ${stats.sourcesFailed}`);
  console.log(` Raw listings found:    ${stats.rawListingsFound}`);
  console.log(` After normalization:   ${stats.normalizedListings}`);
  console.log(` Duplicates removed:    ${stats.duplicatesRemoved}`);
  console.log(` Inserted to DB:        ${stats.insertedToDb}`);
  console.log(` Expired cleaned:       ${stats.expiredCleaned}`);
  console.log(` Errors:                ${stats.errors.length}`);
  console.log(` Duration:              ${(stats.durationMs / 1000).toFixed(1)}s`);
  console.log('================================================\n');

  // Exit with error code if there were failures
  if (stats.errors.length > 0) {
    console.log(`\n Completed with ${stats.errors.length} error(s).`);
    if (options.verbose) {
      console.log(' Error details:');
      stats.errors.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
    }
    process.exit(1);
  }

  console.log(` Done! All ${stats.citiesProcessed.length} cities processed successfully.`);
  process.exit(0);
}

// ============================================
// RUN
// ============================================

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
