import { createHash } from 'crypto';
import type { RawSale, NormalizedSale } from './types.js';
import { CRAIGSLIST_CITY_STATES } from './config.js';

// ============================================================
//  Normalizer — cleans raw scraped data into a consistent
//  format before storing in Supabase.
//  Column names match what browse/page.tsx queries.
// ============================================================

function generateSourceId(sale: RawSale): string {
  const raw = `${sale.source}|${sale.url}|${sale.title}`.toLowerCase().trim();
  return createHash('md5').update(raw).digest('hex');
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeState(
  state?: string,
  source?: string,
  clRegion?: string
): string | null {
  if (source === 'craigslist' && clRegion) {
    const mapped = CRAIGSLIST_CITY_STATES[clRegion.toLowerCase()];
    if (mapped) return mapped;
  }

  if (!state) return null;

  const cleaned = state.trim().toUpperCase();
  if (cleaned.length === 2) return cleaned;

  const stateMap: Record<string, string> = {
    'WASHINGTON': 'WA', 'OREGON': 'OR', 'IDAHO': 'ID',
    'CALIFORNIA': 'CA', 'MONTANA': 'MT', 'NEVADA': 'NV',
    'UTAH': 'UT', 'ARIZONA': 'AZ', 'COLORADO': 'CO',
    'ALASKA': 'AK', 'HAWAII': 'HI', 'WYOMING': 'WY',
    'NEBRASKA': 'NE', 'KANSAS': 'KS', 'OKLAHOMA': 'OK',
    'TEXAS': 'TX', 'MINNESOTA': 'MN', 'IOWA': 'IA',
    'MISSOURI': 'MO', 'ARKANSAS': 'AR', 'LOUISIANA': 'LA',
    'WISCONSIN': 'WI', 'ILLINOIS': 'IL', 'MICHIGAN': 'MI',
    'INDIANA': 'IN', 'OHIO': 'OH', 'KENTUCKY': 'KY',
    'TENNESSEE': 'TN', 'MISSISSIPPI': 'MS', 'ALABAMA': 'AL',
    'GEORGIA': 'GA', 'FLORIDA': 'FL', 'SOUTH CAROLINA': 'SC',
    'NORTH CAROLINA': 'NC', 'VIRGINIA': 'VA', 'WEST VIRGINIA': 'WV',
    'MARYLAND': 'MD', 'DELAWARE': 'DE', 'NEW JERSEY': 'NJ',
    'PENNSYLVANIA': 'PA', 'NEW YORK': 'NY', 'CONNECTICUT': 'CT',
    'RHODE ISLAND': 'RI', 'MASSACHUSETTS': 'MA', 'VERMONT': 'VT',
    'NEW HAMPSHIRE': 'NH', 'MAINE': 'ME', 'NORTH DAKOTA': 'ND',
    'SOUTH DAKOTA': 'SD', 'NEW MEXICO': 'NM',
  };

  return stateMap[cleaned] || null;
}

function extractZip(address?: string): string | null {
  if (!address) return null;
  const match = address.match(/\b(\d{5})(-\d{4})?\b/);
  return match ? match[1] : null;
}

function parseDate(dateStr?: string | number | unknown): string | null {
  if (dateStr === null || dateStr === undefined) return null;

  if (typeof dateStr === 'number') {
    const ms = dateStr > 1e12 ? dateStr : dateStr * 1000;
    const parsed = new Date(ms);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return null;
  }

  if (typeof dateStr !== 'string') {
    try {
      const str = String(dateStr);
      if (str === '[object Object]') return null;
      return parseDate(str);
    } catch {
      return null;
    }
  }

  const cleaned = dateStr.trim();
  if (cleaned.length === 0) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    return cleaned.split('T')[0];
  }

  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Build the photo_urls array from whatever the scraper found.
 * The browse page maps this to listing_photos[].photo_url
 */
function buildPhotoUrls(raw: RawSale): string[] {
  const urls: string[] = [];

  if (raw.image_urls && Array.isArray(raw.image_urls)) {
    for (const u of raw.image_urls) {
      if (u && typeof u === 'string' && u.startsWith('http')) {
        urls.push(u);
      }
    }
  }

  if (raw.image_url && typeof raw.image_url === 'string' && raw.image_url.startsWith('http')) {
    if (!urls.includes(raw.image_url)) {
      urls.push(raw.image_url);
    }
  }

  return urls;
}

/**
 * Main normalization function.
 * Output column names match what browse/page.tsx queries.
 */
export function normalizeSale(raw: RawSale, clRegion?: string): NormalizedSale {
  const title = stripHtml(raw.title).substring(0, 500);
  const description = raw.description
    ? stripHtml(raw.description).substring(0, 5000)
    : null;

  const state = normalizeState(raw.state, raw.source, clRegion);
  const zipFromField = raw.zip_code || null;
  const zipFromAddress = extractZip(raw.address);

  return {
    source_id: generateSourceId(raw),
    source: raw.source,
    title,
    description,
    address: raw.address?.trim() || null,
    city: raw.city?.trim() || null,
    state,
    zip_code: zipFromField || zipFromAddress,
    latitude: raw.latitude || null,
    longitude: raw.longitude || null,
    price: raw.price?.trim() || null,
    sale_date: parseDate(raw.start_date as string | number | undefined),
    sale_time_start: raw.start_time?.trim() || null,
    sale_time_end: raw.end_time?.trim() || null,
    category: raw.category || null,
    categories: raw.categories || null,
    photo_urls: buildPhotoUrls(raw),
    source_url: raw.url,
  };
}
