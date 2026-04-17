// FILE: collector/src/test-batch2.ts
// Quick test — runs ONLY batch 2+3 sources (newspapers, TV, community, radio, hyperlocal)
// for Sacramento only. Lightweight RAM usage.

import 'dotenv/config';
import { CITY_CONFIGS } from './city-config.js';
import { crawlWithCrawlee } from './crawlee-scraper.js';

const BATCH2_CATEGORIES = [
  'newspaper',
  'tv-station',
  'community-board',
  'public-radio',
  'hyperlocal',
];

async function testBatch2() {
  console.log('=============================================');
  console.log(' BATCH 2+3 TEST — Newspapers, TV, Community');
  console.log(' Sacramento only');
  console.log('=============================================\n');

  const sacramento = CITY_CONFIGS.find(
    (c) => c.city.toLowerCase() === 'sacramento'
  );

  if (!sacramento) {
    console.error('Sacramento not found in city configs!');
    process.exit(1);
  }

  const batch2Sources = sacramento.sources.filter(
    (s) => s.crawler === 'crawlee' && BATCH2_CATEGORIES.includes(s.category)
  );

  console.log(`Found ${batch2Sources.length} batch 2+3 sources:\n`);
  for (const src of batch2Sources) {
    console.log(`  [${src.category}] ${src.name}`);
    console.log(`    ${src.url}`);
  }

  console.log(`\nStarting crawl...\n`);

  const startTime = Date.now();

  try {
    const result = await crawlWithCrawlee(
      batch2Sources,
      sacramento.city,
      sacramento.state
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n=============================================');
    console.log(' BATCH 2+3 TEST RESULTS');
    console.log('=============================================');
    console.log(`  Sources tested:    ${batch2Sources.length}`);
    console.log(`  Listings found:    ${result.listings.length}`);
    console.log(`  Errors:            ${result.errors.length}`);
    console.log(`  Duration:          ${elapsed}s`);
    console.log('=============================================\n');

    const byCat: Record<string, number> = {};
    for (const listing of result.listings) {
      const cat = listing.sourceName || 'unknown';
      byCat[cat] = (byCat[cat] || 0) + 1;
    }

    if (Object.keys(byCat).length > 0) {
      console.log('  Listings by source:');
      for (const [source, count] of Object.entries(byCat)) {
        console.log(`    ${source}: ${count}`);
      }
    }

    if (result.errors.length > 0) {
      console.log('\n  Errors:');
      for (const err of result.errors) {
        console.log(`    - ${err}`);
      }
    }

    if (result.listings.length > 0) {
      console.log('\n  Sample listings:');
      for (const listing of result.listings.slice(0, 5)) {
        console.log(`    Title: ${listing.title || 'N/A'}`);
        console.log(`    URL:   ${listing.sourceUrl || 'N/A'}`);
        console.log(`    ---`);
      }
    }
  } catch (err: any) {
    console.error(`\nCrawl failed: ${err.message}`);
  }

  console.log('\nDone!');
  process.exit(0);
}

testBatch2().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
