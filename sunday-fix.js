// ============================================================
// sunday-fix.js — YardShoppers Emergency P0 Fix
// STEP 1: Purge expired/ended/stale listings
// STEP 2: Fast batch geocode by unique city+state (10-15 min)
// STEP 3: Street-level geocode for rows with full addresses
//
// RUN: node sunday-fix.js
// REQUIRES: .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// ============================================================

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const DELAY_MS = 1100; // Nominatim requires ~1 req/sec
const BATCH = 500;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ══════════════════════════════════════════════════════════════
// STEP 1: CLEANUP — purge expired, ended, stale, and duplicate listings
// ══════════════════════════════════════════════════════════════
async function cleanup() {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 1: CLEANUP");
  console.log("═══════════════════════════════════════════════\n");

  // Count before
  const { count: before } = await supabase
    .from("external_sales")
    .select("*", { count: "exact", head: true });
  console.log(`  📊 Listings before cleanup: ${before}\n`);

  // 1A: Delete where expires_at is in the past
  const { data: expiredData, error: e1 } = await supabase
    .from("external_sales")
    .delete()
    .lt("expires_at", now)
    .not("expires_at", "is", null)
    .select("id", { count: "exact" });
  const expiredCount = expiredData ? expiredData.length : 0;
  if (e1) console.error(`  ❌ Expired cleanup error: ${e1.message}`);
  else console.log(`  ✅ Removed ${expiredCount} expired listings (expires_at < now)`);

  // 1B: Delete where sale_date is before today (sale already happened yesterday or earlier)
  const { data: endedData, error: e2 } = await supabase
    .from("external_sales")
    .delete()
    .lt("sale_date", today)
    .not("sale_date", "is", null)
    .select("id", { count: "exact" });
  const endedCount = endedData ? endedData.length : 0;
  if (e2) console.error(`  ❌ Ended cleanup error: ${e2.message}`);
  else console.log(`  ✅ Removed ${endedCount} ended listings (sale_date < today)`);

  // 1C: Delete stale listings with no expiry and no sale_date older than 14 days
  const { data: staleData, error: e3 } = await supabase
    .from("external_sales")
    .delete()
    .is("expires_at", null)
    .is("sale_date", null)
    .lt("collected_at", twoWeeksAgo)
    .select("id", { count: "exact" });
  const staleCount = staleData ? staleData.length : 0;
  if (e3) console.error(`  ❌ Stale cleanup error: ${e3.message}`);
  else console.log(`  ✅ Removed ${staleCount} stale listings (no date, >14 days old)`);

  // Count after
  const { count: after } = await supabase
    .from("external_sales")
    .select("*", { count: "exact", head: true });

  const total = expiredCount + endedCount + staleCount;
  console.log(`\n  📊 Listings after cleanup: ${after} (removed ${total})\n`);
  return after;
}

// ══════════════════════════════════════════════════════════════
// STEP 2: FAST BATCH GEOCODE — by unique city+state combos
// Instead of geocoding 7,660 rows individually (2+ hours),
// we geocode ~300-500 unique city+state combos (~8-10 min)
// and apply coords to ALL matching rows in bulk
// ══════════════════════════════════════════════════════════════
const geoCache = new Map();

async function geocodeQuery(query) {
  const key = query.toLowerCase().trim();
  if (geoCache.has(key)) return geoCache.get(key);

  try {
    const params = new URLSearchParams({
      q: query, format: "json", limit: "1",
      countrycodes: "us", addressdetails: "1",
    });
    const res = await fetch(`${NOMINATIM}?${params}`, {
      headers: { "User-Agent": "YardShoppers-Geocoder/2.0 (contact@yardshoppers.com)" },
    });
    if (!res.ok) { geoCache.set(key, null); return null; }
    const data = await res.json();
    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
      geoCache.set(key, result);
      return result;
    }
  } catch (err) {}
  geoCache.set(key, null);
  return null;
}

async function batchGeocode() {
  console.log("═══════════════════════════════════════════════");
  console.log("  STEP 2: FAST BATCH GEOCODE (city+state)");
  console.log("═══════════════════════════════════════════════\n");

  // Get total count of rows without coords
  const { count: totalNull } = await supabase
    .from("external_sales")
    .select("*", { count: "exact", head: true })
    .is("latitude", null);
  console.log(`  📊 Listings without coordinates: ${totalNull}\n`);

  if (!totalNull || totalNull === 0) {
    console.log("  ✅ All listings already have coordinates!\n");
    return;
  }

  // Fetch ALL rows without coords (we just need city, state, address, id)
  let allRows = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("external_sales")
      .select("id, city, state, address, source_url")
      .is("latitude", null)
      .range(page * BATCH, (page + 1) * BATCH - 1);
    if (error) { console.error("  ❌ Fetch error:", error.message); break; }
    if (!data || data.length === 0) break;
    allRows = [...allRows, ...data];
    page++;
    if (data.length < BATCH) break;
  }

  console.log(`  📊 Fetched ${allRows.length} rows to geocode\n`);

  // ── PHASE 1: Group by city+state and geocode unique combos ──
  const cityStateMap = new Map(); // "city|state" → [row_ids]
  for (const row of allRows) {
    const city = (row.city || "").trim();
    const state = (row.state || "").trim();
    if (!state) continue;
    const key = `${city}|${state}`;
    if (!cityStateMap.has(key)) cityStateMap.set(key, []);
    cityStateMap.get(key).push(row.id);
  }

  const combos = [...cityStateMap.entries()];
  console.log(`  🎯 Phase 1: ${combos.length} unique city+state combos to geocode`);
  console.log(`  ⏱️  Estimated time: ${Math.ceil(combos.length * 1.2 / 60)} minutes\n`);

  let geocoded = 0;
  let failed = 0;
  let rowsUpdated = 0;
  const startTime = Date.now();

  for (let i = 0; i < combos.length; i++) {
    const [key, ids] = combos[i];
    const [city, state] = key.split("|");
    const pct = ((i / combos.length) * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);

    process.stdout.write(
      `\r  [${pct}%] ${i + 1}/${combos.length} | Geocoded: ${geocoded} | Rows: ${rowsUpdated} | Failed: ${failed} | ${elapsed}s`
    );

    // Build query: "City, State" or just "State, United States"
    const query = city ? `${city}, ${state}, United States` : `${state}, United States`;
    const cached = geoCache.has(query.toLowerCase().trim());
    const result = await geocodeQuery(query);

    if (result) {
      // Bulk update ALL rows with this city+state
      // Supabase .in() has a limit, chunk the IDs
      const CHUNK = 200;
      for (let j = 0; j < ids.length; j += CHUNK) {
        const chunk = ids.slice(j, j + CHUNK);
        const { error } = await supabase
          .from("external_sales")
          .update({ latitude: result.lat, longitude: result.lng })
          .in("id", chunk);
        if (error) {
          console.error(`\n  ❌ Bulk update error: ${error.message}`);
        } else {
          rowsUpdated += chunk.length;
        }
      }
      geocoded++;
    } else {
      failed++;
    }

    if (!cached) await sleep(DELAY_MS);
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n\n  ✅ Phase 1 complete in ${totalTime} minutes`);
  console.log(`  📊 Geocoded ${geocoded}/${combos.length} city+state combos`);
  console.log(`  📊 Updated ${rowsUpdated} rows with coordinates`);
  console.log(`  📊 Failed: ${failed}\n`);

  // ── PHASE 2: Street-level geocode for rows with full addresses ──
  // This provides more precise pins for the route planner
  console.log("  🎯 Phase 2: Street-level geocode (rows with full addresses)...\n");

  // Fetch rows that now HAVE city-level coords but also have a real street address
  const streetRegex = /^\d+\s+\w/; // starts with a number = likely street address
  let streetRows = [];
  page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("external_sales")
      .select("id, address, city, state")
      .not("latitude", "is", null) // already has city-level coords
      .not("address", "is", null)
      .range(page * BATCH, (page + 1) * BATCH - 1);
    if (error) break;
    if (!data || data.length === 0) break;
    // Filter to rows with real street addresses
    const withStreet = data.filter(r => r.address && streetRegex.test(r.address.trim()));
    streetRows = [...streetRows, ...withStreet];
    page++;
    if (data.length < BATCH) break;
  }

  console.log(`  📊 ${streetRows.length} rows have street addresses for precision geocoding`);

  if (streetRows.length > 2000) {
    console.log(`  ⚠️  Too many for right now — capping at first 2000 for speed`);
    streetRows = streetRows.slice(0, 2000);
  }

  if (streetRows.length > 0) {
    const estMinutes = Math.ceil(streetRows.length * 1.2 / 60);
    console.log(`  ⏱️  Estimated time: ${estMinutes} minutes\n`);

    let streetGeo = 0;
    let streetFail = 0;
    const streetStart = Date.now();

    for (let i = 0; i < streetRows.length; i++) {
      const row = streetRows[i];
      const pct = ((i / streetRows.length) * 100).toFixed(1);
      const elapsed = ((Date.now() - streetStart) / 1000).toFixed(0);

      process.stdout.write(
        `\r  [${pct}%] ${i + 1}/${streetRows.length} | Geocoded: ${streetGeo} | Failed: ${streetFail} | ${elapsed}s`
      );

      const query = `${row.address.trim()}, ${row.city || ""}, ${row.state}`;
      const cached = geoCache.has(query.toLowerCase().trim());
      const result = await geocodeQuery(query);

      if (result) {
        const { error } = await supabase
          .from("external_sales")
          .update({ latitude: result.lat, longitude: result.lng })
          .eq("id", row.id);
        if (!error) streetGeo++;
        else streetFail++;
      } else {
        streetFail++;
      }

      if (!cached) await sleep(DELAY_MS);
    }

    const streetTime = ((Date.now() - streetStart) / 1000 / 60).toFixed(1);
    console.log(`\n\n  ✅ Phase 2 complete in ${streetTime} minutes`);
    console.log(`  📊 Street-geocoded: ${streetGeo}/${streetRows.length}`);
    console.log(`  📊 Failed: ${streetFail}\n`);
  }

  // Final stats
  const { count: stillNull } = await supabase
    .from("external_sales")
    .select("*", { count: "exact", head: true })
    .is("latitude", null);

  const { count: hasCoords } = await supabase
    .from("external_sales")
    .select("*", { count: "exact", head: true })
    .not("latitude", "is", null);

  console.log("═══════════════════════════════════════════════");
  console.log("  FINAL STATS");
  console.log("═══════════════════════════════════════════════");
  console.log(`  ✅ With coordinates:    ${hasCoords}`);
  console.log(`  ⚠️  Still missing:      ${stillNull}`);
  console.log(`  📊 Total listings:      ${(hasCoords || 0) + (stillNull || 0)}`);
  console.log("═══════════════════════════════════════════════\n");
  console.log("  🎉 Refresh yardshoppers.com — distance sorting should work now!\n");
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
async function main() {
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║  YARDSHOPPERS SUNDAY FIX — P0 EMERGENCY      ║");
  console.log("║  Cleanup expired + geocode for distance sort  ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  await cleanup();
  await batchGeocode();
}

main().catch(err => { console.error("\n💀 Fatal:", err); process.exit(1); });
