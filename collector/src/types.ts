// ============================================================
//  Types — shared across all collector modules
//  Column names match what the browse page queries
// ============================================================

/** Raw data as scraped — messy, inconsistent, per-source */
export interface RawSale {
  title: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  price?: string;
  start_date?: string | number;
  end_date?: string | number;
  start_time?: string;
  end_time?: string;
  image_url?: string;
  image_urls?: string[];
  url: string;
  source: string;
  category?: string;
  categories?: string[];
}

/** Clean data ready for Supabase — column names match the table */
export interface NormalizedSale {
  source_id: string;
  source: string;
  title: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  price: string | null;
  sale_date: string | null;
  sale_time_start: string | null;
  sale_time_end: string | null;
  category: string | null;
  categories: string[] | null;
  photo_urls: string[];
  source_url: string;
}

/** Per-region result for summary logging */
export interface CollectorResult {
  source: string;
  region: string;
  salesFound: number;
  errors: string[];
}

/** Craigslist RSS item shape */
export interface CraigslistRssItem {
  title?: string;
  link?: string;
  description?: string;
  'dc:date'?: string;
  'enc:enclosure'?: {
    '@_resource'?: string;
  };
}

/** EstateSales.net API response shape */
export interface EstateSalesApiSale {
  id?: number | string;
  title?: string;
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  latitude?: number;
  lng?: number;
  longitude?: number;
  startDate?: string;
  endDate?: string;
  dates?: string;
  mainImage?: string;
  image?: string;
  images?: string[];
  pictureUrl?: string;
  url?: string;
  link?: string;
  price?: string;
  category?: string;
  categories?: string[];
}
