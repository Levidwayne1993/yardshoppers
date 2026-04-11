// =============================================================
// YardShoppers – Boost Tier Configuration
// Central source of truth for every boost tier, pricing,
// colours, helpers, and Stripe metadata.
// =============================================================

export type BoostTierKey = 'spark' | 'spotlight' | 'blaze' | 'mega';

export interface BoostTier {
  key: BoostTierKey;
  name: string;
  tagline: string;
  price: number;          // USD
  durationDays: number;
  priority: number;       // higher = shown first in search
  reachMultiplier: string; // e.g. "3x"
  icon: string;           // emoji
  features: string[];
  popular?: boolean;
  badge: {
    label: string;
    bg: string;
    text: string;
    border: string;
    glow?: string;
    animate?: boolean;
  };
  card: {
    borderColor: string;
    bgGradient: string;
    glowShadow: string;
  };
}

// -- Tier definitions --
export const BOOST_TIERS: Record<BoostTierKey, BoostTier> = {
  spark: {
    key: 'spark',
    name: 'Spark',
    tagline: 'A quick bump to the top',
    price: 1.99,
    durationDays: 1,
    priority: 1,
    reachMultiplier: '3x',
    icon: '⚡',
    features: [
      'Priority placement for 24 hours',
      'Blue "Boosted" badge on listing',
      'Appear above non-boosted listings',
    ],
    badge: {
      label: 'Boosted',
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-300',
    },
    card: {
      borderColor: 'border-blue-400',
      bgGradient: 'bg-gradient-to-br from-blue-50 to-white',
      glowShadow: 'shadow-blue-200/50',
    },
  },

  spotlight: {
    key: 'spotlight',
    name: 'Spotlight',
    tagline: 'Stand out from the crowd',
    price: 4.99,
    durationDays: 3,
    priority: 2,
    reachMultiplier: '5x',
    icon: '⭐',
    popular: true,
    features: [
      'Priority placement for 3 days',
      'Gold "Featured" badge on listing',
      'Highlighted card in search results',
      'Shown in "Featured Sales" section',
    ],
    badge: {
      label: 'Featured',
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-400',
      glow: 'shadow-amber-200/60',
    },
    card: {
      borderColor: 'border-amber-400',
      bgGradient: 'bg-gradient-to-br from-amber-50 to-yellow-50',
      glowShadow: 'shadow-amber-200/50',
    },
  },

  blaze: {
    key: 'blaze',
    name: 'Blaze',
    tagline: 'Maximum visibility for a full week',
    price: 9.99,
    durationDays: 7,
    priority: 3,
    reachMultiplier: '10x',
    icon: '🔥',
    features: [
      'Top of ALL search results for 7 days',
      'Orange "Hot Deal" badge on listing',
      'Homepage carousel placement',
      'Boost analytics dashboard',
      'Highlighted in Route Planner',
    ],
    badge: {
      label: 'Hot Deal',
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      border: 'border-orange-400',
      glow: 'shadow-orange-200/60',
    },
    card: {
      borderColor: 'border-orange-400',
      bgGradient: 'bg-gradient-to-br from-orange-50 to-red-50',
      glowShadow: 'shadow-orange-200/50',
    },
  },

  mega: {
    key: 'mega',
    name: 'Mega',
    tagline: 'The ultimate yard-sale promotion',
    price: 14.99,
    durationDays: 14,
    priority: 4,
    reachMultiplier: '25x',
    icon: '💎',
    features: [
      'Top placement for a full 2 weeks',
      'Animated purple "Mega Sale" badge',
      'Hero spotlight on homepage',
      'Priority pin in Route Planner',
      'Full boost analytics dashboard',
      'Social-optimised listing card',
    ],
    badge: {
      label: 'Mega Sale',
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-400',
      glow: 'shadow-purple-300/60',
      animate: true,
    },
    card: {
      borderColor: 'border-purple-400',
      bgGradient: 'bg-gradient-to-br from-purple-50 to-pink-50',
      glowShadow: 'shadow-purple-200/50',
    },
  },
};

// Ordered list for rendering (low to high)
export const TIER_ORDER: BoostTierKey[] = ['spark', 'spotlight', 'blaze', 'mega'];

// -- Helpers --

/** Look up a tier config; returns undefined for unknown keys. */
export function getBoostTier(key?: string | null): BoostTier | undefined {
  if (!key) return undefined;
  return BOOST_TIERS[key as BoostTierKey];
}

/** Is the boost still active based on its expiry timestamp? */
export function isBoostActive(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) > new Date();
}

/** Milliseconds remaining on an active boost; 0 when expired. */
export function boostTimeRemaining(expiresAt?: string | null): number {
  if (!expiresAt) return 0;
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

/** 0-100 progress value representing how much boost time has elapsed. */
export function boostProgress(startsAt?: string | null, expiresAt?: string | null): number {
  if (!startsAt || !expiresAt) return 0;
  const total = new Date(expiresAt).getTime() - new Date(startsAt).getTime();
  const elapsed = Date.now() - new Date(startsAt).getTime();
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

/** Price per day for display (e.g. "$0.71/day"). */
export function perDayPrice(tier: BoostTier): string {
  return `$${(tier.price / tier.durationDays).toFixed(2)}/day`;
}

/** Sort comparator: highest active boost first, then newest. */
export function boostSortComparator(
  a: { boost_priority?: number | null; boost_expires_at?: string | null; created_at?: string },
  b: { boost_priority?: number | null; boost_expires_at?: string | null; created_at?: string },
): number {
  const aActive = isBoostActive(a.boost_expires_at);
  const bActive = isBoostActive(b.boost_expires_at);
  if (aActive && !bActive) return -1;
  if (!aActive && bActive) return 1;
  if (aActive && bActive) {
    const priDiff = (b.boost_priority ?? 0) - (a.boost_priority ?? 0);
    if (priDiff !== 0) return priDiff;
  }
  // Fall back to newest first
  return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
}

