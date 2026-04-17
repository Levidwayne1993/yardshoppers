import { createHash } from 'crypto';
import type { RawListing, NormalizedSale } from './types.js';
import {
  extractAddress,
  extractZip,
  extractDates,
  extractTimes,
} from './keywords.js';

// ============================================
// JUNK / NAVIGATION TITLE FILTER
// ============================================

/**
 * Titles that are website navigation elements, not real listings.
 * Case-insensitive exact match after trimming.
 */
const JUNK_TITLES_EXACT = new Set([
  'find yard sales',
  'find garage sales',
  'find estate sales',
  'find garage sales by map',
  'find garage sales by city and state',
  'find garage sales by zip code',
  'find yard sales by map',
  'find yard sales by city and state',
  'find yard sales by zip code',
  'post a yard sale',
  'post a garage sale',
  'post your yard sale',
  'post your garage sale',
  'list your garage sale',
  'list your yard sale',
  'list your garage sale for free',
  'list your yard sale for free',
  'garage sale tips',
  'yard sale tips',
  'estate sale tips',
  'garage sale guide',
  'yard sale guide',
  'how to have a garage sale',
  'how to have a yard sale',
  'garage sale pricing guide',
  'yard sale pricing guide',
  'about us',
  'contact us',
  'privacy policy',
  'terms of service',
  'terms and conditions',
  'sign up',
  'sign in',
  'log in',
  'login',
  'register',
  'create account',
  'my account',
  'my listings',
  'my sales',
  'advertise with us',
  'advertise',
  'faq',
  'help',
  'blog',
  'home',
  'search',
  'alert me about new yard sales in this area!',
  'alert me about new yard sales in this area',
  'alert me about new garage sales in this area',
  'get alerts',
  'set alerts',
  'subscribe',
  'newsletter',
  'download our app',
  'get the app',
  'mobile app',
]);

/**
 * Patterns that indicate a navigation/menu item, not a real listing.
 */
const JUNK_PATTERNS = [
  /^find\s+(yard|garage|estate)\s+sales?\b/i,
  /^post\s+(a|your)\s+(yard|garage|estate)\s+sale/i,
  /^list\s+your\s+(yard|garage|estate)\s+sale/i,
  /^(yard|garage|estate)\s+sale\s+(tips|guide|advice|help)/i,
  /^how\s+to\s+(have|run|organize|host)\s+a/i,
  /^(about|contact|privacy|terms|faq|help|blog|home|search)$/i,
  /^(sign|log)\s*(up|in|out)$/i,
  /^(create|my)\s+(account|listings?|sales?)$/i,
  /^alert\s+me\b/i,
  /^subscribe\b/i,
  /^get\s+(alerts?|the\s+app|started)/i,
  /^download\b/i,
  /^advertise\b/i,
  /^pricing\s+(guide|tips)/i,
  /^view\s+all\b/i,
  /^see\s+(all|more)\b/i,
  /^load\s+more\b/i,
  /^show\s+more\b/i,
  /^read\s+more\b/i,
  /^learn\s+more\b/i,
  /^click\s+here\b/i,
  /^more\s+info\b/i,
  /^back\s+to\b/i,
  /^go\s+to\b/i,
  /^next\s+page\b/i,
  /^previous\s+page\b/i,
  /^\d+$/,  // Just a number (pagination)
];

/**
 * Check if a title is junk (navigation, menu item, etc.)
 * Returns true if the title should be REJECTED.
 */
function isJunkTitle(title: string): boolean {
  const normalized = title.toLowerCase().trim();

  // Exact match check
  if (JUNK_TITLES_EXACT.has(normalized)) return true;

  // Pattern match check
  for (const pattern of JUNK_PATTERNS) {
    if (pattern.test(normalized)) return true;
  }

  // Too short after cleanup — probably a button label
  if (normalized.length < 8) return true;

  // All caps and short — likely a nav button
  if (title === title.toUpperCase() && normalized.length < 30) {
    // Check if it's a real listing title in all caps (some people do this)
    // Real listings usually have addresses or sale-type words WITH detail
    if (!/\d/.test(title)) return true; // No numbers = probably nav
  }

  return false;
}

// ============================================
// CATEGORY DETECTION
// ============================================

const CATEGORY_PATTERNS: { pattern: RegExp; category: string }[] = [
  { pattern: /estate\s*sale/i, category: 'Estate Sale' },
  { pattern: /garage\s*sale/i, category: 'Garage Sale' },
  { pattern: /yard\s*sale/i, category: 'Yard Sale' },
  { pattern: /moving\s*sale/i, category: 'Moving Sale' },
  { pattern: /rummage\s*sale/i, category: 'Rummage Sale' },
  { pattern: /tag\s*sale/i, category: 'Tag Sale' },
  { pattern: /church\s*sale/i, category: 'Church Sale' },
  { pattern: /community\s*sale/i, category: 'Community Sale' },
  { pattern: /neighborhood\s*sale/i, category: 'Neighborhood Sale' },
  { pattern: /multi[\s-]*family\s*sale/i, category: 'Multi-Family Sale' },
  { pattern: /block\s*sale/i, category: 'Block Sale' },
  { pattern: /flea\s*market/i, category: 'Flea Market' },
  { pattern: /swap\s*meet/i, category: 'Swap Meet' },
  { pattern: /liquidation/i, category: 'Liquidation Sale' },
  { pattern: /downsizing/i, category: 'Downsizing Sale' },
  { pattern: /barn\s*sale/i, category: 'Barn Sale' },
  { pattern: /storage\s*sale/i, category: 'Storage Sale' },
  { pattern: /clearance/i, category: 'Clearance Sale' },
];

/**
 * Guess the sale category from text content.
 * Returns the first matching category or 'Garage Sale' as default.
 */
function guessCategory(text: string): string {
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return 'Garage Sale';
}

/**
 * Guess all applicable categories from text content.
 * Returns an array of matching categories.
 */
function guessCategories(text: string): string[] {
  const cats: string[] = [];
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(text)) cats.push(category);
  }
  return cats.length > 0 ? cats : ['Garage Sale'];
}

// ============================================
// SOURCE ID GENERATION (deterministic dedup key)
// ============================================

/**
 * Generate a deterministic source_id for deduplication.
 * Hash of source + URL + title ensures no duplicates.
 */
function generateSourceId(
  source: string,
  url: string,
  title: string
): string {
  const raw = `${source}|${url}|${title}`.toLowerCase().trim();
  return createHash('md5').update(raw).digest('hex');
}

// ============================================
// DATE/TIME PARSING
// ============================================

/**
 * Parse a date string into ISO date format (YYYY-MM-DD).
 * Handles various formats: ISO, US date, relative dates, etc.
 */
function parseDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;

  // ISO format
  const isoMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  // US date format: MM/DD/YYYY or M/D/YYYY
  const usMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (usMatch) {
    const month = usMatch[1].padStart(2, '0');
    const day = usMatch[2].padStart(2, '0');
    const year = usMatch[3].length === 2 ? `20${usMatch[3]}` : usMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Month name format: "April 15, 2026" or "Apr 15 2026"
  const monthNames: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  };

  const monthMatch = dateStr.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?/i
  );
  if (monthMatch) {
    const month = monthNames[monthMatch[1].toLowerCase()];
    const day = monthMatch[2].padStart(2, '0');
    const year = monthMatch[3] || new Date().getFullYear().toString();
    return `${year}-${month}-${day}`;
  }

  // Try native Date parsing as last resort
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {}

  return null;
}

/**
 * Parse time string into HH:MM format (24hr).
 */
function parseTime(timeStr: string | undefined): string | null {
  if (!timeStr) return null;

  // Match "8am", "8:00 AM", "13:00", etc.
  const timeMatch = timeStr.match(
    /(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?/i
  );
  if (!timeMatch) return null;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
  const period = (timeMatch[3] || '').toLowerCase().replace(/\./g, '');

  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Parse a time range like "8am-3pm" into start and end times.
 */
function parseTimeRange(
  text: string
): { start: string | null; end: string | null } {
  const rangeMatch = text.match(
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?)\s*[-–—to]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?)/i
  );
  if (rangeMatch) {
    return {
      start: parseTime(rangeMatch[1]),
      end: parseTime(rangeMatch[2]),
    };
  }
  return { start: null, end: null };
}

// ============================================
// PRICE EXTRACTION
// ============================================

function extractPrice(text: string | undefined): string | null {
  if (!text) return null;
  const priceMatch = text.match(/\$\s?(\d+(?:[.,]\d{2})?)/);
  return priceMatch ? priceMatch[1].replace(',', '') : null;
}

// ============================================
// PHOTO URL NORMALIZATION
// ============================================

function normalizePhotoUrls(
  photos: string[] | undefined,
  baseUrl: string
): string[] {
  if (!photos || photos.length === 0) return [];
  return photos
    .filter((url) => url && url.length > 5)
    .map((url) => {
      if (url.startsWith('http')) return url;
      if (url.startsWith('//')) return `https:${url}`;
      try {
        return new URL(url, baseUrl).toString();
      } catch {
        return url;
      }
    })
    .filter((url) => url.startsWith('http'))
    .slice(0, 10); // Max 10 photos per listing
}

// ============================================
// MAIN NORMALIZER
// ============================================

/**
 * Normalize a RawListing into a NormalizedSale that matches
 * the external_sales Supabase table schema exactly.
 */
export function normalizeListing(raw: RawListing): NormalizedSale | null {
  // Skip listings with no title
  if (!raw.title || raw.title.trim().length < 3) return null;

  const title = raw.title
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);

  // ── JUNK FILTER ── reject navigation elements, menu items, etc.
  if (isJunkTitle(title)) return null;

  const description = raw.description
    ? raw.description.replace(/\s+/g, ' ').trim().slice(0, 2000)
    : null;

  const combinedText = `${title} ${description || ''}`;

  // Source info
  const source = raw.sourceName || 'Unknown';
  const sourceUrl = raw.sourceUrl || '';
  const sourceId = generateSourceId(source, sourceUrl, title);

  // Address extraction (from raw field or parsed from text)
  const address = raw.address || extractAddress(combinedText) || null;
  const zip = raw.zip || extractZip(combinedText) || null;

  // ── ADDRESS REQUIRED ──
  // Reject listings without a real street address.
  // A real street address starts with a number (e.g., "2607 114th Ave SW").
  // Listings with just city/state are useless on our site — users can't
  // get directions, and there's no seller to contact.
  if (!address || !/^\d+\s+\S/.test(address.trim())) return null;

  // Date parsing
  const rawDates = raw.date
    ? [raw.date]
    : extractDates(combinedText);
  const saleDate = parseDate(rawDates[0]) || null;

  // Time parsing
  const timeRange = parseTimeRange(combinedText);
  const rawTimes = extractTimes(combinedText);
  let saleTimeStart = timeRange.start || parseTime(raw.time) || parseTime(rawTimes[0]) || null;
  let saleTimeEnd = timeRange.end || parseTime(rawTimes[1]) || null;

  // Category detection
  const category = guessCategory(combinedText);
  const categories = guessCategories(combinedText);

  // Price extraction
  const price = extractPrice(raw.price?.toString()) || extractPrice(combinedText) || null;

  // Photo URLs
  const photoUrls = normalizePhotoUrls(raw.photos, sourceUrl);

  // Expiration: 14 days from now
  const expiresAt = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Collected timestamp
  const collectedAt = new Date().toISOString();

  // Coordinates
  const latitude =
    typeof raw.latitude === 'number' && !isNaN(raw.latitude)
      ? raw.latitude
      : null;
  const longitude =
    typeof raw.longitude === 'number' && !isNaN(raw.longitude)
      ? raw.longitude
      : null;

  return {
    source,
    source_id: sourceId,
    source_url: sourceUrl,
    title,
    description,
    city: raw.city || null,
    state: raw.state || null,
    latitude,
    longitude,
    price,
    sale_date: saleDate,
    sale_time_start: saleTimeStart,
    sale_time_end: saleTimeEnd,
    category,
    categories,
    photo_urls: photoUrls,
    address,
    zip,
    expires_at: expiresAt,
    collected_at: collectedAt,
  };
}

/**
 * Normalize a batch of RawListings, filtering out invalid ones.
 */
export function normalizeAll(rawListings: RawListing[], city: string, state: string): NormalizedSale[] {
  const normalized: NormalizedSale[] = [];
  const seenIds = new Set<string>();

  for (const raw of rawListings) {
    const sale = normalizeListing(raw);
    if (!sale) continue;

    // In-memory dedup by source_id
    if (seenIds.has(sale.source_id)) continue;
    seenIds.add(sale.source_id);

    normalized.push(sale);
  }

  return normalized;
}
