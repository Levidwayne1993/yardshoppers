'use client';

import { getBoostTier, isBoostActive, type BoostTierKey } from '@/lib/boost-config';

interface BoostBadgeProps {
  tierKey?: BoostTierKey | string | null;
  expiresAt?: string | null;
  className?: string;
}

export default function BoostBadge({ tierKey, expiresAt, className = '' }: BoostBadgeProps) {
  const tier = getBoostTier(tierKey);
  if (!tier || !isBoostActive(expiresAt)) return null;

  const { badge } = tier;

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
        border ${badge.bg} ${badge.text} ${badge.border}
        ${badge.glow ? badge.glow : ''}
        ${badge.animate ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <span aria-hidden="true">{tier.icon}</span>
      {badge.label}
    </span>
  );
}
