// ============================================
// CRAWLER ASSIGNMENT
// ============================================
export type CrawlerType = 'crawlee' | 'scraperai';

// ============================================
// SOURCE CATEGORIES
// ============================================
export type SourceCategory =
  | 'craigslist'
  | 'facebook'
  | 'offerup'
  | 'reddit'
  | 'nextdoor'
  | 'yardsale-directory'
  | 'estate-sale'
  | 'newspaper'
  | 'community-board'
  | 'marketplace'
  | 'hyperlocal'
  | 'tv-station'
  | 'public-radio';

// ============================================
// CITY SOURCE ENTRY
// ============================================
export interface CitySource {
  url: string;
  name: string;
  crawler: CrawlerType;
  category: SourceCategory;
  /** Max crawl depth for Crawlee. Default: 2 */
  maxDepth?: number;
}

// ============================================
// CITY CONFIG
// ============================================
export interface CityConfig {
  city: string;
  state: string;
  sources: CitySource[];
}

// ============================================
// RAW EXTRACTED LISTING (before normalization)
// ============================================
export interface RawListing {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
  sourceUrl: string;
  sourceName: string;
  sourceCategory: SourceCategory;
  price?: string;
  rawHtml?: string;
}

// ============================================
// NORMALIZED SALE (matches external_sales table)
// ============================================
export interface NormalizedSale {
  source: string;
  source_id: string;
  source_url: string;
  title: string;
  description: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  price: string | null;
  sale_date: string | null;
  sale_time_start: string | null;
  sale_time_end: string | null;
  category: string | null;
  categories: string[];
  photo_urls: string[];
  address: string | null;
  zip: string | null;
  expires_at: string | null;
  collected_at: string;
}

// ============================================
// COLLECTION RESULT
// ============================================
export interface CollectionResult {
  sales: NormalizedSale[];
  errors: string[];
  source: string;
  city: string;
  state: string;
  duration: number;
}

// ============================================
// SCRAPER STATS
// ============================================
export interface ScraperStats {
  totalCollected: number;
  totalInserted: number;
  totalSkipped: number;
  totalErrors: number;
  totalCleaned: number;
  citiesProcessed: number;
  duration: number;
  byCity: Record<string, { collected: number; inserted: number; errors: number }>;
  bySource: Record<string, { collected: number; errors: number }>;
}
