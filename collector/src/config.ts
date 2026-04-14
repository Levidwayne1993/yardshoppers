// ============================================================
//  YardShoppers Collector — Source Configuration
//  All the regions/locations each scraper will collect from
// ============================================================

// ── Craigslist Regions ──────────────────────────────────────
// Each entry is a CL subdomain. The collector builds the URL:
//   https://{region}.craigslist.org/search/gms?format=rss
//
// "gms" = garage & moving sales category
// Add or remove regions as you expand coverage.

export const CRAIGSLIST_REGIONS: string[] = [
  'seattle',
  'tacoma',
  'olympia',
  'portland',
  'eugene',
  'bellingham',
  'skagit',
  'yakima',
  'wenatchee',
  'kpr',
  'spokane',
  'pullman',
  'moseslake',
  'corvallis',
  'bend',
  'medford',
  'roseburg',
  'salem',
  'klamath',
  'lewiston',
  'boise',
  'vancouver',
];

// Maps CL subdomain → state abbreviation for normalization
export const CRAIGSLIST_CITY_STATES: Record<string, string> = {
  seattle: 'WA',
  tacoma: 'WA',
  olympia: 'WA',
  bellingham: 'WA',
  skagit: 'WA',
  yakima: 'WA',
  wenatchee: 'WA',
  kpr: 'WA',
  spokane: 'WA',
  pullman: 'WA',
  moseslake: 'WA',
  vancouver: 'WA',
  portland: 'OR',
  eugene: 'OR',
  corvallis: 'OR',
  bend: 'OR',
  medford: 'OR',
  roseburg: 'OR',
  salem: 'OR',
  klamath: 'OR',
  lewiston: 'ID',
  boise: 'ID',
};

// ── EstateSales.net Locations ───────────────────────────────
// IMPORTANT: EstateSales.net uses STATE ABBREVIATIONS in URLs,
// NOT full state names. The correct format is:
//   https://www.estatesales.net/{stateAbbr}/{city}/{zip}
//
// Example: https://www.estatesales.net/WA/Olympia/98501
// NOT:     https://www.estatesales.net/Washington/Olympia/98501

export interface EstateSalesLocation {
  stateAbbr: string;
  stateFull: string;
  city: string;
  zip: string;
}

export const ESTATE_SALES_LOCATIONS: EstateSalesLocation[] = [
  { stateAbbr: 'WA', stateFull: 'Washington', city: 'Olympia', zip: '98501' },
  { stateAbbr: 'WA', stateFull: 'Washington', city: 'Seattle', zip: '98101' },
  { stateAbbr: 'WA', stateFull: 'Washington', city: 'Tacoma', zip: '98402' },
  { stateAbbr: 'WA', stateFull: 'Washington', city: 'Spokane', zip: '99201' },
  { stateAbbr: 'WA', stateFull: 'Washington', city: 'Vancouver', zip: '98660' },
  { stateAbbr: 'WA', stateFull: 'Washington', city: 'Bellevue', zip: '98004' },
  { stateAbbr: 'OR', stateFull: 'Oregon', city: 'Portland', zip: '97201' },
  { stateAbbr: 'OR', stateFull: 'Oregon', city: 'Eugene', zip: '97401' },
  { stateAbbr: 'OR', stateFull: 'Oregon', city: 'Salem', zip: '97301' },
  { stateAbbr: 'OR', stateFull: 'Oregon', city: 'Bend', zip: '97701' },
  { stateAbbr: 'ID', stateFull: 'Idaho', city: 'Boise', zip: '83701' },
  { stateAbbr: 'ID', stateFull: 'Idaho', city: 'Nampa', zip: '83651' },
];

// ── GSALR Locations ─────────────────────────────────────────
// GSALR URL format: https://gsalr.com/yard-sales/{state}/{city}/

export interface GsalrLocation {
  state: string;
  city: string;
}

export const GSALR_LOCATIONS: GsalrLocation[] = [
  { state: 'washington', city: 'olympia' },
  { state: 'washington', city: 'seattle' },
  { state: 'washington', city: 'tacoma' },
  { state: 'oregon', city: 'portland' },
  { state: 'idaho', city: 'boise' },
];
