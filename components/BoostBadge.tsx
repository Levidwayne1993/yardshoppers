'use client';

import { useEffect, useState } from 'react';
import {
    BOOST_TIERS,
    BoostTierKey,
    isBoostActive,
    boostTimeRemaining,
} from '@/lib/boost-config';

interface BoostBadgeProps {
    tier: BoostTierKey;
    boostExpiresAt: string;
    size?: 'sm' | 'md' | 'lg';
    showTimer?: boolean;
}

function formatRemaining(ms: number): string {
    const hours = Math.floor(ms / 3_600_000);
    const mins = Math.floor((ms % 3_600_000) / 60_000);
    if (hours >= 24) return `${Math.floor(hours / 24)}d left`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

export default function BoostBadge({
    tier,
    boostExpiresAt,
    size = 'sm',
    showTimer = false,
}: BoostBadgeProps) {
    const [remaining, setRemaining] = useState(() =>
          boostTimeRemaining(boostExpiresAt)
                                                 );

  useEffect(() => {
        if (!showTimer) return;
        const id = setInterval(
                () => setRemaining(boostTimeRemaining(boostExpiresAt)),
                60_000
              );
        return () => clearInterval(id);
  }, [boostExpiresAt, showTimer]);

  const config = BOOST_TIERS[tier];
    if (!config || !isBoostActive(boostExpiresAt)) return null;

  const sizeClasses: Record>string, string> = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5',
  };

  const { badge, icon } = config;

  return (
        >span
        className={`
                inline-flex items-center gap-1 rounded-full font-semibold
                        border ${badge.bg} ${badge.text} ${badge.border}
                                ${badge.glow ?? ''}
                                        ${badge.animate ? 'animate-pulse' : ''}
                                                ${sizeClasses[size]}
                                                      `}
    >
      >span>{icon}>/span>
      >span>{badge.label}>/span>
{showTimer && remaining > 0 && (
          >span className="opacity-75 text-[0.85em]">
{formatRemaining(remaining)}
          >/span>
        )}
      >/span>
    );
}
