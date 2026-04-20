// ============================================================
// geocode-backfill.js — YardShoppers
// Geocodes all external_sales rows missing lat/lng
//
// Uses free OpenStreetMap Nominatim API (no key needed)
// Caches results so duplicate locations only geocode once
// Resumable — re-run safely; skips rows that already have coords
// ============================================================

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const DELAY_MS = 1100;
const BATCH_SIZE = 1000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractCLRegion(url) {
  if (!url) return null;
  const m = url.match(/https?:\/\/([a-z]+)\.craigslist\.org/i);
  return m ? m[1] : null;
}

function buildQueries(row) {
  const { address, state, description, source_url } = row;
  const queries = [];
  const clRegion = extractCLRegion(source_url);

  if (address && address.trim().length > 2) {
    queries.push(`${address.trim()}, ${state}`);
  }

  if (description && description.trim().length > 1 && description.trim().length < 80) {
    const desc = description.trim();
    if (!/sale|garage|huge|multi|estate|moving|yard|everything/i.test(desc)) {
      queries.push(`${desc}, ${state}`);
    }
  }

  if (clRegion && clRegion.length > 2) {
    queries.push(`${clRegion}, ${state}`);
  }

  queries.push(`${state}, United States`);

  const seen = new Set();
  return queries.filter((q) => {
    const key = q.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const cache = new Map();

async function geocodeQuery(query) {
  const cacheKey = query.toLowerCase().trim();
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      countrycodes: "us",
      addressdetails: "1",
    });

    const res = await fetch(`${NOMINATIM}?${params}`, {
      headers: { "User-Agent": "YardShoppers-Geocoder/1.0 (contact@yardshoppers.com)" },
    });

    if (!res.ok) {
      cache.set(cacheKey, null);
      return null;
    }

    const data = await res.json();

    if (data && data.length > 0) {
      const addr = data[0].address || {};
      const city = addr.city || addr.town || addr.village || addr.hamlet || addr.county || "";
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        city,
      };
      cache.set(cacheKey, result);
      return result;
    }
  } catch (err) {}

  cache.set(cacheKey, null);
  return null;
}

async function geocodeRow(row) {
  const queries = buildQueries(row);

  for (const query of queries) {
    const cached = cache.has(query.toLowerCase().trim());
    const result = await geocodeQuery(query);

    if (result) return { ...result, query };
    if (!cached) await sleep(DELAY_MS);
  }

  return null;
}

async function main() {
  console.log("YardShoppers Geocode Backfill");
  console.log("-".repeat(50));

  console.log("Fetching listings with no coordinates...");
  let allRows = [];
  let page = 0;

  while (true) {
    const { data, error } = await supabase
      .from("external_sales")
      .select("id, address, city, state, description, title, source_url")
      .is("latitude", null)
      .range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1);

    if (error) {
      console.error("Supabase fetch error:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    allRows = [...allRows, ...data];
    page++;
    if (data.length < BATCH_SIZE) break;
  }

  console.log(`Found ${allRows.length} listings to geocode\n`);

  if (allRows.length === 0) {
    console.log("All listings already have coordinates!");
    return;
  }

  let success = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i];
    const pct = ((i / allRows.length) * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);

    process.stdout.write(
      `\r[${pct}%] ${i + 1}/${allRows.length} | Done: ${success} | Failed: ${failed} | ${elapsed}s`
    );

    const result = await geocodeRow(row);

    if (result) {
      const updateData = { latitude: result.lat, longitude: result.lng };

      if ((!row.city || row.city.trim() === "") && result.city) {
        updateData.city = result.city;
      }

      const { error } = await supabase
        .from("external_sales")
        .update(updateData)
        .eq("id", row.id);

      if (!error) success++;
      else failed++;
    } else {
      failed++;
    }

    if (i < allRows.length - 1) await sleep(200);
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log(`\n\n${"-".repeat(50)}`);
  console.log(`DONE in ${totalTime} minutes`);
  console.log(`  Geocoded: ${success} / ${allRows.length}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`\nRefresh your route planner to see the pins!`);
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
