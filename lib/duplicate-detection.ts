// ============================================================
// lib/duplicate-detection.ts
// Smart Duplicate Detection Engine for YardShoppers Bulk Import
// ============================================================

// ---- Types ----

export interface ParsedListing {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  sale_date: string;
  start_time: string;
  end_time: string;
  category: string;
  image_url: string;
  rowIndex: number;
}

export interface DuplicateMatch {
  existingId: string;
  existingTitle: string;
  existingDescription: string;
  existingAddress: string;
  existingCity: string;
  existingState: string;
  existingSaleDate: string;
  probability: number;
  breakdown: {
    addressScore: number;
    dateMatch: boolean;
    titleScore: number;
    descriptionScore: number;
    keywordOverlap: number;
  };
  reasons: string[];
}

export interface DuplicateCheckResult {
  rowIndex: number;
  listing: ParsedListing;
  status: 'clear' | 'flagged';
  matches: DuplicateMatch[];
  highestProbability: number;
}

export interface IntraBatchDuplicate {
  rowIndexA: number;
  rowIndexB: number;
  probability: number;
  breakdown: {
    addressScore: number;
    dateMatch: boolean;
    titleScore: number;
    descriptionScore: number;
    keywordOverlap: number;
  };
  reasons: string[];
}

// ---- Stop Words ----
// Common English + yard-sale-generic words that should NOT count as distinguishing keywords

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could',
  'of', 'in', 'to', 'for', 'with', 'on', 'at', 'by', 'from', 'as',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'out', 'off', 'up', 'down', 'over', 'under',
  'this', 'that', 'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we', 'our',
  'you', 'your', 'he', 'she', 'they', 'them', 'their', 'his', 'her',
  'and', 'but', 'or', 'nor', 'not', 'no', 'so', 'if', 'then', 'than',
  'too', 'very', 'just', 'also', 'each', 'every', 'all', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same',
  'about', 'here', 'there', 'when', 'where', 'why', 'how', 'what', 'which', 'who',
  // Yard sale generic words — not useful for distinguishing one sale from another
  'yard', 'sale', 'garage', 'estate', 'moving', 'everything', 'go',
  'items', 'stuff', 'things', 'lots', 'many', 'much', 'come', 'check',
  'great', 'good', 'nice', 'prices', 'priced', 'sell', 'price', 'free',
  'big', 'huge', 'multi', 'family', 'neighborhood', 'community',
  'rain', 'shine', 'cash', 'am', 'pm', 'sat', 'sun', 'saturday', 'sunday',
  'friday', 'dont', 'miss', 'wont', 'last', 'stop', 'well', 'get',
]);

// ---- Address Abbreviation Map ----

const ADDRESS_ABBREVIATIONS: Record<string, string> = {
  street: 'st', avenue: 'ave', drive: 'dr', road: 'rd',
  boulevard: 'blvd', lane: 'ln', court: 'ct', circle: 'cir',
  place: 'pl', terrace: 'ter', trail: 'trl', way: 'way',
  parkway: 'pkwy', highway: 'hwy', apartment: 'apt', suite: 'ste',
  unit: 'unit', building: 'bldg', floor: 'fl',
  north: 'n', south: 's', east: 'e', west: 'w',
  northeast: 'ne', northwest: 'nw', southeast: 'se', southwest: 'sw',
};

// ============================================================
// Normalization Functions
// ============================================================

export function normalizeText(text: string): string {
  if (!text) return '';
  return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

export function normalizeAddress(address: string): string {
  if (!address) return '';
  let n = address.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  for (const [full, abbr] of Object.entries(ADDRESS_ABBREVIATIONS)) {
    n = n.replace(new RegExp(`\\b${full}\\b`, 'g'), abbr);
  }
  return n;
}

// ============================================================
// Similarity Algorithms
// ============================================================

/** Classic Levenshtein edit-distance */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

/** 0-1 similarity derived from Levenshtein distance */
export function levenshteinSimilarity(a: string, b: string): number {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na === '' && nb === '') return 1;
  if (na === '' || nb === '') return 0;

  // Cap at 500 chars to avoid O(n*m) explosion on huge descriptions
  const ca = na.substring(0, 500);
  const cb = nb.substring(0, 500);
  const dist = levenshteinDistance(ca, cb);
  return 1 - dist / Math.max(ca.length, cb.length);
}

/** Word-level Jaccard similarity (intersection / union of word sets) */
export function jaccardSimilarity(a: string, b: string): number {
  const wa = new Set(normalizeText(a).split(' ').filter(w => w.length > 0));
  const wb = new Set(normalizeText(b).split(' ').filter(w => w.length > 0));
  if (wa.size === 0 && wb.size === 0) return 1;
  if (wa.size === 0 || wb.size === 0) return 0;

  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  const union = new Set([...wa, ...wb]).size;
  return inter / union;
}

/** Character n-gram similarity — catches reworded sentences with shared phrases */
export function ngramSimilarity(a: string, b: string, n: number = 3): number {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na.length < n && nb.length < n) return na === nb ? 1 : 0;
  if (na.length < n || nb.length < n) return 0;

  const ga = new Set<string>();
  const gb = new Set<string>();
  for (let i = 0; i <= na.length - n; i++) ga.add(na.substring(i, i + n));
  for (let i = 0; i <= nb.length - n; i++) gb.add(nb.substring(i, i + n));

  let inter = 0;
  for (const g of ga) if (gb.has(g)) inter++;
  const union = new Set([...ga, ...gb]).size;
  return union === 0 ? 0 : inter / union;
}

// ============================================================
// Keyword Extraction & Overlap
// ============================================================

/** Extract meaningful keywords, filtering out stop words and yard-sale generics */
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  const words = normalizeText(text).split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([w]) => w);
}

/** Percentage of shared keywords between two texts */
export function keywordOverlap(a: string, b: string): number {
  const ka = new Set(extractKeywords(a));
  const kb = new Set(extractKeywords(b));
  if (ka.size === 0 && kb.size === 0) return 0;
  if (ka.size === 0 || kb.size === 0) return 0;
  let overlap = 0;
  for (const k of ka) if (kb.has(k)) overlap++;
  return overlap / new Set([...ka, ...kb]).size;
}

// ============================================================
// Core Comparison Engine
// ============================================================

export function compareTwoListings(
  a: { title: string; description: string; address: string; city: string; state: string; zip_code: string; sale_date: string },
  b: { title: string; description: string; address: string; city: string; state: string; zip_code: string; sale_date: string }
): { probability: number; breakdown: DuplicateMatch['breakdown']; reasons: string[] } | null {

  // ---- 1. Address ----
  const fullA = normalizeAddress(`${a.address} ${a.city} ${a.state} ${a.zip_code}`);
  const fullB = normalizeAddress(`${b.address} ${b.city} ${b.state} ${b.zip_code}`);
  const addressScore = levenshteinSimilarity(fullA, fullB);

  // Completely different address → can't be a duplicate
  if (addressScore < 0.6) return null;

  // ---- 2. Date ----
  const dateMatch = !!(a.sale_date && b.sale_date && a.sale_date === b.sale_date);

  // Same address, DIFFERENT date → allowed per business rule → NOT a duplicate
  if (addressScore >= 0.85 && !dateMatch) return null;

  // ---- 3. Title ----
  const titleScore = jaccardSimilarity(a.title || '', b.title || '');

  // ---- 4. Description (multi-algorithm blend) ----
  const dJ = jaccardSimilarity(a.description || '', b.description || '');
  const dN = ngramSimilarity(a.description || '', b.description || '');
  const dL = levenshteinSimilarity(a.description || '', b.description || '');
  const descriptionScore = dJ * 0.35 + dN * 0.30 + dL * 0.35;

  // ---- 5. Keyword overlap ----
  const kwOverlap = keywordOverlap(a.description || '', b.description || '');

  // ---- Weighted probability ----
  const reasons: string[] = [];
  let probability = 0;

  // Address — 30 pts max
  if (addressScore >= 0.85) {
    probability += 30;
    reasons.push(`📍 Address: ${Math.round(addressScore * 100)}% match`);
  } else if (addressScore >= 0.6) {
    probability += addressScore * 20;
    reasons.push(`📍 Address: ${Math.round(addressScore * 100)}% similar`);
  }

  // Date — 20 pts max
  if (dateMatch) {
    probability += 20;
    reasons.push('📅 Exact same sale date');
  }

  // Description — 30 pts max
  probability += descriptionScore * 30;
  if (descriptionScore >= 0.7) {
    reasons.push(`📝 Description: ${Math.round(descriptionScore * 100)}% match (high)`);
  } else if (descriptionScore >= 0.4) {
    reasons.push(`📝 Description: ${Math.round(descriptionScore * 100)}% similar`);
  } else if (descriptionScore > 0.1) {
    reasons.push(`📝 Description: ${Math.round(descriptionScore * 100)}% similar (low)`);
  }

  // Title — 10 pts max
  probability += titleScore * 10;
  if (titleScore >= 0.5) {
    reasons.push(`🏷️ Title: ${Math.round(titleScore * 100)}% match`);
  }

  // Keywords — 10 pts max
  probability += kwOverlap * 10;
  if (kwOverlap >= 0.3) {
    reasons.push(`🔑 ${Math.round(kwOverlap * 100)}% keyword overlap`);
  }

  probability = Math.min(99, Math.round(probability));

  // Below 20% → not worth flagging
  if (probability < 20) return null;

  return {
    probability,
    breakdown: {
      addressScore: Math.round(addressScore * 100),
      dateMatch,
      titleScore: Math.round(titleScore * 100),
      descriptionScore: Math.round(descriptionScore * 100),
      keywordOverlap: Math.round(kwOverlap * 100),
    },
    reasons,
  };
}

// ============================================================
// Public API — check one listing against existing DB listings
// ============================================================

export function checkAgainstExisting(
  incoming: ParsedListing,
  existingListings: Array<{
    id: string; title: string; description: string;
    address: string; city: string; state: string;
    zip_code: string; sale_date: string;
  }>
): DuplicateCheckResult {
  const matches: DuplicateMatch[] = [];

  for (const existing of existingListings) {
    const result = compareTwoListings(incoming, existing);
    if (result) {
      matches.push({
        existingId: existing.id,
        existingTitle: existing.title,
        existingDescription: existing.description,
        existingAddress: existing.address,
        existingCity: existing.city,
        existingState: existing.state || '',
        existingSaleDate: existing.sale_date,
        probability: result.probability,
        breakdown: result.breakdown,
        reasons: result.reasons,
      });
    }
  }

  matches.sort((a, b) => b.probability - a.probability);

  return {
    rowIndex: incoming.rowIndex,
    listing: incoming,
    status: matches.length > 0 ? 'flagged' : 'clear',
    matches,
    highestProbability: matches.length > 0 ? matches[0].probability : 0,
  };
}

// ============================================================
// Public API — check for duplicates WITHIN the CSV batch itself
// ============================================================

export function checkIntraBatchDuplicates(listings: ParsedListing[]): IntraBatchDuplicate[] {
  const dupes: IntraBatchDuplicate[] = [];

  for (let i = 0; i < listings.length; i++) {
    for (let j = i + 1; j < listings.length; j++) {
      const result = compareTwoListings(listings[i], listings[j]);
      if (result && result.probability >= 30) {
        dupes.push({
          rowIndexA: listings[i].rowIndex,
          rowIndexB: listings[j].rowIndex,
          probability: result.probability,
          breakdown: result.breakdown,
          reasons: result.reasons,
        });
      }
    }
  }

  dupes.sort((a, b) => b.probability - a.probability);
  return dupes;
}
