export interface RawExternalListing {
  source?: string;
  source_id: string;
  source_url: string;
  title: string;
  description?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  sale_date?: string;
  sale_time_start?: string;
  sale_time_end?: string;
  category?: string;
  categories?: string[];
  photo_urls?: string[];
  address?: string;
  collected_at?: string;
  expires_at?: string;
  raw_data?: Record<string, unknown>;
}

export interface CollectorResult {
  source: string;
  sales: RawExternalListing[];
  errors: string[];
}

export interface NormalizedExternalListing {
  source: string;
  source_id: string;
  source_url: string;
  title: string;
  description: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  sale_date: string | null;
  sale_time_start: string | null;
  sale_time_end: string | null;
  category: string | null;
  categories: string[];
  photo_urls: string[];
  address: string | null;
  collected_at: string;
  expires_at: string;
  raw_data: Record<string, unknown> | null;
}
export interface UnifiedListing {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  sale_date: string | null;
  sale_time_start: string | null;
  sale_time_end: string | null;
  category: string | null;
  categories: string[] | null;
  listing_photos: { photo_url: string; position?: number }[];
  user_id: string | null;
  is_boosted: boolean;
  boost_tier: string | null;
  boost_expires_at: string | null;
  boost_started_at: string | null;
  created_at: string;
  is_external: boolean;
  source: string;
  source_url?: string;
}
