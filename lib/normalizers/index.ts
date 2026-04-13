import { RawExternalListing, NormalizedListing, CollectorResult } from "@/types/external";
import { geocodeAddress } from "@/lib/geocode";

const US_STATES: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI",
  Wyoming: "WY",
};

function normalizeState(state: string | undefined): string | null {
  if (!state) return null;
  const trimmed = state.trim().toUpperCase();
  if (trimmed.length === 2 && Object.values(US_STATES).includes(trimmed)) {
    return trimmed;
  }
  const fullName =
    Object.keys(US_STATES).find(
      (k) => k.toLowerCase() === state.trim().toLowerCase()
    );
  if (fullName) return US_STATES[fullName];
  return state.trim().slice(0, 2).toUpperCase();
}

function normalizePrice(price: string | undefined): string | null {
  if (!price) return null;
  const cleaned = price.replace(/[^$\d,.]/g, "");
  if (!cleaned) return null;
  return cleaned.startsWith("$") ? cleaned : `$${cleaned}`;
}

function normalizeTitle(title: string): string {
  return title
    .replace(/\s+/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim()
    .slice(0, 300);
}

function normalizeDate(date: string | undefined): string | null {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

function computeExpiry(saleDate: string | null): string | null {
  if (!saleDate) {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString();
  }
  const d = new Date(saleDate + "T23:59:59");
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

export async function normalizeListing(
  raw: RawExternalListing,
  source: string,
  collectedAt: string
): Promise<NormalizedListing> {
  let lat = raw.latitude || null;
  let lng = raw.longitude || null;
  let city = raw.city || null;
  let state = normalizeState(raw.state);

  if ((!lat || !lng) && raw.address) {
    const geo = await geocodeAddress(raw.address);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      if (!city) city = geo.city;
      if (!state) state = normalizeState(geo.state || undefined);
    }
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  if ((!lat || !lng) && city && state) {
    const geo = await geocodeAddress(`${city}, ${state}`);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
    }
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  const saleDate = normalizeDate(raw.sale_date);

  return {
    source,
    source_id: raw.source_id,
    source_url: raw.source_url,
    title: normalizeTitle(raw.title),
    description: raw.description?.slice(0, 2000) || null,
    city,
    state,
    latitude: lat,
    longitude: lng,
    price: normalizePrice(raw.price),
    sale_date: saleDate,
    sale_time_start: raw.sale_time_start || null,
    sale_time_end: raw.sale_time_end || null,
    category: raw.categories?.[0] || null,
    categories: raw.categories || null,
    photo_urls: raw.photo_urls || null,
    address: raw.address || null,
    collected_at: collectedAt,
    expires_at: computeExpiry(saleDate),
    raw_data: raw.raw_data || null,
  };
}

export async function normalizeCollectorResult(
  result: CollectorResult
): Promise<NormalizedListing[]> {
  const normalized: NormalizedListing[] = [];

  for (const raw of result.listings) {
    try {
      const listing = await normalizeListing(raw, result.source, result.collected_at);
      normalized.push(listing);
    } catch {
      // skip failed normalization
    }
  }

  return normalized;
}

export function deduplicateListings(
  listings: NormalizedListing[]
): NormalizedListing[] {
  const seen = new Set<string>();
  const unique: NormalizedListing[] = [];

  for (const listing of listings) {
    if (seen.has(listing.source_id)) continue;
    seen.add(listing.source_id);

    const titleKey = listing.title.toLowerCase().replace(/\s+/g, "").slice(0, 50);
    const locationKey = `${listing.city || ""}-${listing.state || ""}`.toLowerCase();
    const dupeKey = `${titleKey}|${locationKey}|${listing.sale_date || ""}`;

    if (seen.has(dupeKey)) continue;
    seen.add(dupeKey);

    unique.push(listing);
  }

  return unique;
}
