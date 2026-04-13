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
  expires_at?: string;
  raw_data?: Record<string, unknown>;
}

export interface UnifiedListing {
  id: string;
  title: string;
  description?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  price?: string;
  photo_urls?: string[];
  category?: string;
  categories?: string[];
  source: "internal" | "craigslist" | "estatesales" | "gsalr";
  source_url?: string;
  created_at: string;
  address?: string;
  sale_date?: string;
  boosted?: boolean;
  boost_tier?: string;
  user_id?: string;
}
