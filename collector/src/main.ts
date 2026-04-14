import 'dotenv/config';
import { rm } from 'fs/promises';
import { collectEstateSales } from './sources/estatesales.js';
import { collectGsalr } from './sources/gsalr.js';
import { cleanupOldSales } from './storage.js';
import type { CollectorResult } from './types.js';

async function purgeStorage() {
  try {
    await rm('./storage', { recursive: true, force: true });
  } catch {
    // Directory might not exist yet
  }
}

async function main() {
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════');
  console.log('  🏷️  YardShoppers Collector');
  console.log(`  📅 ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════\n');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
  }

  await purgeStorage();

  const allResults: CollectorResult[] = [];

  // ── 1. EstateSales.net ─────────────────────────
  console.log('🔍 [1/2] Collecting from EstateSales.net...');
  try {
    const esResults = await collectEstateSales();
    allResults.push(...esResults);
  } catch (err) {
    console.error('❌ EstateSales collector crashed:', err);
    allResults.push({
      source: 'estatesales',
      region: 'all',
      salesFound: 0,
      errors: [`Collector crashed: ${err}`],
    });
  }

  // ── 2. GSALR ───────────────────────────────────
  console.log('\n🔍 [2/2] Collecting from GSALR...');
  try {
    const gsResults = await collectGsalr();
    allResults.push(...gsResults);
  } catch (err) {
    console.error('❌ GSALR collector crashed:', err);
    allResults.push({
      source: 'gsalr',
      region: 'all',
      salesFound: 0,
      errors: [`Collector crashed: ${err}`],
    });
  }

  // ── 3. Cleanup ─────────────────────────────────
  console.log('\n🧹 Cleaning up sales older than 30 days...');
  try {
    const deleted = await cleanupOldSales();
    console.log(`  🗑️  Removed ${deleted} expired sales`);
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
  }

  await purgeStorage();

  // ── Summary ────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalSales = allResults.reduce((sum, r) => sum + r.salesFound, 0);
  const totalErrors = allResults.filter((r) => r.errors.length > 0);

  console.log('\n═══════════════════════════════════════════');
  console.log('  📊 Collection Summary');
  console.log('═══════════════════════════════════════════');
  console.log(`  Total sales collected: ${totalSales}`);
  console.log(`  Regions with errors:   ${totalErrors.length}`);
  console.log(`  Time elapsed:          ${elapsed}s`);

  if (totalErrors.length > 0) {
    console.log('\n⚠️  Error details:');
    for (const r of totalErrors) {
      for (const err of r.errors) {
        console.log(`  - [${r.source}/${r.region}] ${err}`);
      }
    }
  }

  console.log('\n  ✨ Collection complete!\n');
}

main().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
