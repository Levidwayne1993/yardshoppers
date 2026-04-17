// FILE: collector/src/state-config.ts
// State-level configs — 50 states, 7 directory sources each
// These hit state-wide pages on yard sale directory sites
// to capture EVERY listing in the state, not just specific cities.
//
// Usage:
//   npx tsx src/main.ts --state AL
//   npx tsx src/main.ts --states AL,WA,CA,FL,TX
//   npx tsx src/main.ts --states ALL

import type { CityConfig } from './types.js';

// ============================================
// STATE DEFINITIONS
// ============================================

interface StateInfo {
  code: string;
  name: string;
  slug: string;
}

const ALL_STATES: StateInfo[] = [
  { code: 'AL', name: 'Alabama', slug: 'alabama' },
  { code: 'AK', name: 'Alaska', slug: 'alaska' },
  { code: 'AZ', name: 'Arizona', slug: 'arizona' },
  { code: 'AR', name: 'Arkansas', slug: 'arkansas' },
  { code: 'CA', name: 'California', slug: 'california' },
  { code: 'CO', name: 'Colorado', slug: 'colorado' },
  { code: 'CT', name: 'Connecticut', slug: 'connecticut' },
  { code: 'DE', name: 'Delaware', slug: 'delaware' },
  { code: 'FL', name: 'Florida', slug: 'florida' },
  { code: 'GA', name: 'Georgia', slug: 'georgia' },
  { code: 'HI', name: 'Hawaii', slug: 'hawaii' },
  { code: 'ID', name: 'Idaho', slug: 'idaho' },
  { code: 'IL', name: 'Illinois', slug: 'illinois' },
  { code: 'IN', name: 'Indiana', slug: 'indiana' },
  { code: 'IA', name: 'Iowa', slug: 'iowa' },
  { code: 'KS', name: 'Kansas', slug: 'kansas' },
  { code: 'KY', name: 'Kentucky', slug: 'kentucky' },
  { code: 'LA', name: 'Louisiana', slug: 'louisiana' },
  { code: 'ME', name: 'Maine', slug: 'maine' },
  { code: 'MD', name: 'Maryland', slug: 'maryland' },
  { code: 'MA', name: 'Massachusetts', slug: 'massachusetts' },
  { code: 'MI', name: 'Michigan', slug: 'michigan' },
  { code: 'MN', name: 'Minnesota', slug: 'minnesota' },
  { code: 'MS', name: 'Mississippi', slug: 'mississippi' },
  { code: 'MO', name: 'Missouri', slug: 'missouri' },
  { code: 'MT', name: 'Montana', slug: 'montana' },
  { code: 'NE', name: 'Nebraska', slug: 'nebraska' },
  { code: 'NV', name: 'Nevada', slug: 'nevada' },
  { code: 'NH', name: 'New Hampshire', slug: 'new-hampshire' },
  { code: 'NJ', name: 'New Jersey', slug: 'new-jersey' },
  { code: 'NM', name: 'New Mexico', slug: 'new-mexico' },
  { code: 'NY', name: 'New York', slug: 'new-york' },
  { code: 'NC', name: 'North Carolina', slug: 'north-carolina' },
  { code: 'ND', name: 'North Dakota', slug: 'north-dakota' },
  { code: 'OH', name: 'Ohio', slug: 'ohio' },
  { code: 'OK', name: 'Oklahoma', slug: 'oklahoma' },
  { code: 'OR', name: 'Oregon', slug: 'oregon' },
  { code: 'PA', name: 'Pennsylvania', slug: 'pennsylvania' },
  { code: 'RI', name: 'Rhode Island', slug: 'rhode-island' },
  { code: 'SC', name: 'South Carolina', slug: 'south-carolina' },
  { code: 'SD', name: 'South Dakota', slug: 'south-dakota' },
  { code: 'TN', name: 'Tennessee', slug: 'tennessee' },
  { code: 'TX', name: 'Texas', slug: 'texas' },
  { code: 'UT', name: 'Utah', slug: 'utah' },
  { code: 'VT', name: 'Vermont', slug: 'vermont' },
  { code: 'VA', name: 'Virginia', slug: 'virginia' },
  { code: 'WA', name: 'Washington', slug: 'washington' },
  { code: 'WV', name: 'West Virginia', slug: 'west-virginia' },
  { code: 'WI', name: 'Wisconsin', slug: 'wisconsin' },
  { code: 'WY', name: 'Wyoming', slug: 'wyoming' },
];

// ============================================
// URL BUILDER
// ============================================

function buildStateConfig(s: StateInfo): CityConfig {
  const lc = s.code.toLowerCase();

  return {
    city: s.name,
    state: s.code,
    sources: [
      // --- Yard Sale Directories (state-wide pages) ---
      {
        url: `https://yardsalesearch.com/yard-sales/${s.code}.html`,
        name: `YardSaleSearch ${s.name}`,
        crawler: 'crawlee',
        category: 'yardsale-directory',
        maxDepth: 3,
      },
      {
        url: `https://garagesalefinder.com/yard-sales/${s.code}/`,
        name: `GarageSaleFinder ${s.name}`,
        crawler: 'crawlee',
        category: 'yardsale-directory',
        maxDepth: 3,
      },
      {
        url: `https://gsalr.com/yard-sales/${s.slug}/`,
        name: `GSALR ${s.name}`,
        crawler: 'crawlee',
        category: 'yardsale-directory',
        maxDepth: 3,
      },
      {
        url: `https://yardsales.net/${lc}/`,
        name: `YardSales.net ${s.name}`,
        crawler: 'crawlee',
        category: 'yardsale-directory',
        maxDepth: 3,
      },
      {
        url: `https://www.garagesalehunter.com/garage-sales/${s.slug}/`,
        name: `GarageSaleHunter ${s.name}`,
        crawler: 'crawlee',
        category: 'yardsale-directory',
        maxDepth: 3,
      },

      // --- Estate Sale Directories (state-wide pages) ---
      {
        url: `https://estatesales.org/estate-sales/${lc}/`,
        name: `EstateSales.org ${s.name}`,
        crawler: 'crawlee',
        category: 'estate-sale',
        maxDepth: 3,
      },
      {
        url: `https://www.estatesales.net/${s.code}`,
        name: `EstateSales.net ${s.name}`,
        crawler: 'crawlee',
        category: 'estate-sale',
        maxDepth: 3,
      },
    ],
  };
}

// ============================================
// EXPORTED CONFIGS
// ============================================

export const STATE_CONFIGS: CityConfig[] = ALL_STATES.map(buildStateConfig);

// Helper: get one state config by code
export function getStateConfig(code: string): CityConfig | undefined {
  return STATE_CONFIGS.find((c) => c.state === code.toUpperCase());
}

// Helper: get multiple state configs by codes
export function getStateConfigs(codes: string[]): CityConfig[] {
  const upperCodes = new Set(codes.map((c) => c.toUpperCase()));
  return STATE_CONFIGS.filter((c) => upperCodes.has(c.state));
}

// Export valid codes for validation
export const VALID_STATE_CODES = ALL_STATES.map((s) => s.code);
