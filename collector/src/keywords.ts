// ============================================
// PRIMARY KEYWORDS — if found, treat page as a sale listing
// ============================================
export const PRIMARY_KEYWORDS: string[] = [
  'yard sale',
  'garage sale',
  'estate sale',
  'moving sale',
  'rummage sale',
  'tag sale',
  'community sale',
  'neighborhood sale',
  'multi-family sale',
  'multi family sale',
  'block sale',
  'church sale',
  'flea market',
  'swap meet',
];

// ============================================
// SECONDARY KEYWORDS — trigger deeper crawling
// ============================================
export const SECONDARY_KEYWORDS: string[] = [
  'classifieds',
  'events',
  'community events',
  'local events',
  'calendar',
  'weekend',
  'for sale',
  'marketplace',
  'buy sell trade',
  'liquidation',
  'downsizing',
];

// ============================================
// URL PATH FILTERS — only follow URLs containing these
// ============================================
export const ALLOWED_URL_PATHS: string[] = [
  'classifieds',
  'classified',
  'events',
  'community',
  'local',
  'calendar',
  'news',
  'marketplace',
  'ads',
  'for-sale',
  'for_sale',
  'garage-sale',
  'yard-sale',
  'estate-sale',
  'sale',
  'listing',
  'search',
];

// ============================================
// SKIP URL PATTERNS — never follow these
// ============================================
export const SKIP_URL_PATTERNS: RegExp[] = [
  /\/sports?\//i,
  /\/politic/i,
  /\/obituar/i,
  /\/opinion/i,
  /\/editorial/i,
  /\/weather\//i,
  /\/subscribe/i,
  /\/login/i,
  /\/signup/i,
  /\/register/i,
  /\/account/i,
  /\/privacy/i,
  /\/terms/i,
  /\/about\//i,
  /\/faq/i,
  /\/contact\//i,
  /\/careers/i,
  /\/jobs\//i,
  /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|pdf|mp3|mp4)(\?|$)/i,
];

// ============================================
// ADDRESS / DATE / TIME PATTERNS
// ============================================
export const ADDRESS_PATTERN = /\d{1,5}\s+[A-Z][a-zA-Z]+\s+(St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|Ct|Court|Pl|Place|Cir|Circle|Pkwy|Parkway|Ter|Terrace)\b/i;

export const ZIP_PATTERN = /\b\d{5}(-\d{4})?\b/;

export const DATE_PATTERNS: RegExp[] = [
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}\b/i,
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
  /\b\d{4}-\d{2}-\d{2}\b/,
  /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(day)?\b/i,
];

export const TIME_PATTERNS: RegExp[] = [
  /\b\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)\b/,
  /\b\d{1,2}(:\d{2})?\s*-\s*\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)\b/,
];

// ============================================
// DETECTION FUNCTIONS
// ============================================

/**
 * Check if text contains any primary yard-sale keywords
 */
export function hasPrimaryKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return PRIMARY_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Check if text contains any secondary keywords
 */
export function hasSecondaryKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return SECONDARY_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Check if text contains an address pattern
 */
export function hasAddress(text: string): boolean {
  return ADDRESS_PATTERN.test(text);
}

/**
 * Check if text contains a date pattern
 */
export function hasDate(text: string): boolean {
  return DATE_PATTERNS.some(p => p.test(text));
}

/**
 * Check if text contains a time pattern
 */
export function hasTime(text: string): boolean {
  return TIME_PATTERNS.some(p => p.test(text));
}

/**
 * Extract ZIP code from text
 */
export function extractZip(text: string): string | null {
  const match = text.match(ZIP_PATTERN);
  return match ? match[0] : null;
}

/**
 * Extract address from text
 */
export function extractAddress(text: string): string | null {
  const match = text.match(ADDRESS_PATTERN);
  return match ? match[0] : null;
}

/**
 * Extract dates from text
 */
export function extractDates(text: string): string[] {
  const dates: string[] = [];
  for (const pattern of DATE_PATTERNS) {
    const matches = text.match(new RegExp(pattern.source, 'gi'));
    if (matches) dates.push(...matches);
  }
  return [...new Set(dates)];
}

/**
 * Extract time ranges from text
 */
export function extractTimes(text: string): string[] {
  const times: string[] = [];
  for (const pattern of TIME_PATTERNS) {
    const matches = text.match(new RegExp(pattern.source, 'gi'));
    if (matches) times.push(...matches);
  }
  return [...new Set(times)];
}

/**
 * Should this URL be followed during crawling?
 */
export function shouldFollowUrl(url: string): boolean {
  // Skip blocked patterns
  if (SKIP_URL_PATTERNS.some(p => p.test(url))) return false;
  // Allow if path contains any allowed keyword
  const path = url.toLowerCase();
  return ALLOWED_URL_PATHS.some(kw => path.includes(kw));
}

/**
 * Score a page for sale-relevance (0-100)
 * Higher = more likely to contain yard sale listings
 */
export function scorePage(text: string): number {
  let score = 0;
  const lower = text.toLowerCase();

  // Primary keywords: +20 each (max 60)
  let primaryCount = 0;
  for (const kw of PRIMARY_KEYWORDS) {
    if (lower.includes(kw)) primaryCount++;
  }
  score += Math.min(primaryCount * 20, 60);

  // Secondary keywords: +5 each (max 15)
  let secondaryCount = 0;
  for (const kw of SECONDARY_KEYWORDS) {
    if (lower.includes(kw)) secondaryCount++;
  }
  score += Math.min(secondaryCount * 5, 15);

  // Address found: +10
  if (hasAddress(text)) score += 10;

  // Date found: +10
  if (hasDate(text)) score += 10;

  // Time found: +5
  if (hasTime(text)) score += 5;

  return Math.min(score, 100);
}
