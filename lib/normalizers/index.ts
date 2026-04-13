import type {
  RawExternalListing,
  NormalizedExternalListing,
  CollectorResult,
} from '@/types/external';

const STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR',
  california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE',
  florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID',
  illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS',
  kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
  missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK',
  oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC',
};

const CRAIGSLIST_CITY_STATES: Record<string, string> = {
  seattle: 'WA', portland: 'OR', sfbay: 'CA', losangeles: 'CA',
  chicago: 'IL', newyork: 'NY', boston: 'MA', denver: 'CO',
  austin: 'TX', atlanta: 'GA', miami: 'FL', dallas: 'TX',
  houston: 'TX', phoenix: 'AZ', philadelphia: 'PA', detroit: 'MI',
  minneapolis: 'MN', sandiego: 'CA', tampa: 'FL', orlando: 'FL',
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Estate Sale': ['estate', 'estate sale', 'downsizing', 'liquidation'],
  'Garage Sale': ['garage', 'garage sale'],
  'Yard Sale': ['yard', 'yard sale', 'lawn'],
  'Moving Sale': ['moving', 'relocation', 'relocating'],
  'Multi-Family Sale': ['multi-family', 'multi family', 'neighborhood', 'block sale', 'community'],
  'Church / Charity Sale': ['church', 'charity', 'fundraiser', 'benefit', 'nonprofit'],
  'Tools & Hardware': ['tools', 'hardware', 'workshop', 'power tools'],
  'Baby & Kids': ['baby', 'kids', 'children', 'toys', 'nursery'],
  'Furniture': ['furniture', 'couch', 'sofa', 'table', 'chairs', 'dresser'],
  'Electronics': ['electronics', 'computer', 'phone', 'tv', 'gaming'],
  'Clothing': ['clothing', 'clothes', 'shoes', 'accessories', 'fashion'],
  'Antiques & Collectibles': ['antique', 'vintage', 'collectible', 'retro'],
};

export function normalizeState(state?: string, city?: string): string | null {
  if (!state && city) {
    const slug = city.toLowerCase().trim();
    if (CRAIGSLIST_CITY_STATES[slug]) return CRAIGSLIST_CITY_STATES[slug];
  }
  if (!state) return null;
  const trimmed = state.trim();
  if (/^[A-Z]{2}$/.test(trimmed)) return trimmed;
  if (/^[a-z]{2}$/i.test(trimmed)) return trimmed.toUpperCase();
  const lookup = STATE_ABBREVIATIONS[trimmed.toLowerCase()];
  return lookup ?? trimmed.toUpperCase().slice(0, 2);
}

export function guessCategory(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return category;
  }
  return 'Garage Sale';
}

export function computeExpiresAt(saleDate?: string): string {
  if (saleDate) {
    try {
      const date = new Date(saleDate);
      if (!isNaN(date.getTime())) {
        date.setDate(date.getDate() + 2);
        return date.toISOString();
      }
    } catch { /* fall through */ }
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 14);
  return fallback.toISOString();
}

export function normalizeListing(
  listing: RawExternalListing,
  source: string
): NormalizedExternalListing {
  const now = new Date().toISOString();
  const effectiveSource = listing.source || source;
  const category = listing.category || guessCategory(listing.title, listing.description);

  return {
    source: effectiveSource,
    source_id: listing.source_id,
    source_url: listing.source_url,
    title: listing.title.trim(),
    description: listing.description?.trim() || null,
    city: listing.city?.trim() || null,
    state: normalizeState(listing.state, listing.city),
    latitude: listing.latitude ?? null,
    longitude: listing.longitude ?? null,
    price: listing.price ?? null,
    sale_date: listing.sale_date || null,
    sale_time_start: listing.sale_time_start || null,
    sale_time_end: listing.sale_time_end || null,
    category,
    categories: listing.categories || [category],
    photo_urls: listing.photo_urls || [],
    address: listing.address || null,
    collected_at: listing.collected_at || now,
    expires_at: listing.expires_at || computeExpiresAt(listing.sale_date),
    raw_data: (listing.raw_data as Record<string, unknown>) || null,
  };
}

export function normalizeCollectorResult(
  result: CollectorResult
): NormalizedExternalListing[] {
  return result.sales.map((sale) => normalizeListing(sale, result.source));
}

export function deduplicateListings(
  listings: NormalizedExternalListing[]
): NormalizedExternalListing[] {
  const seen = new Set<string>();
  return listings.filter((listing) => {
    const key = `${listing.source}:${listing.source_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
