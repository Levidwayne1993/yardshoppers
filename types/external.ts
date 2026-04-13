// ── Raw listing as received from a collector ──
export interface RawExternalListing {
  source_id: string;
  source_url: string;
  title: string;
  description?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  price?: string;
  sale_date?: string;
  sale_time_start?: string;
  sale_time_end?: string;
  categories?: string[];
  photo_urls?: string[];
  address?: string;
  raw_data?: Record<string, unknown>;
}

// ── Result returned by each collector function ──
export interface CollectorResult {
  source: string;
  listings: RawExternalListing[];
  collected_at: string;
}

// ── Listing after normalization, ready for database insert ──
export interface NormalizedListing {
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
  categories: string[] | null;
  photo_urls: string[] | null;
  address: string | null;
  collected_at: string;
  expires_at: string | null;
  raw_data: Record<string, unknown> | null;
}

// ── Row shape used by collectors and the collect endpoint ──
export interface ExternalSale {
  source: string;
  source_id: string;
  source_url: string;
  title: string;
  description?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  price?: string;
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

// ── Unified shape for the browse page (internal + external) ──
export interface UnifiedListing {
  id: string;
  title: string;
  description?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  price?: string;
  sale_date?: string;
  sale_time_start?: string;
  sale_time_end?: string;
  category?: string;
  categories?: string[];
  photo_urls?: string[];
  listing_photos?: { photo_url: string }[];
  source: "internal" | "craigslist" | "estatesales" | "gsalr";
  source_url?: string | null;
  created_at: string;
  address?: string;
  user_id?: string | null;
  is_boosted?: boolean;
  boost_tier?: string | null;
  boost_expires_at?: string | null;
  boost_started_at?: string | null;
  is_external: boolean;
}
