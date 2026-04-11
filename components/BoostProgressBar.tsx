'use client';

import { useEffect, useState } from 'react';
import {
  getBoostTier,
  isBoostActive,
  boostProgress,
  boostTimeRemaining,
  type BoostTierKey,
} from '@/lib/boost-config';

interface BoostProgressBarProps {
  tierKey?: BoostTierKey | string | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  className?: string;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

export default function BoostProgressBar({
  tierKey,
  startsAt,
  expiresAt,
  className = '',
}: BoostProgressBarProps) {
  const tier = getBoostTier(tierKey);
  const [progress, setProgress] = useState(0);
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!tier || !isBoostActive(expiresAt)) return;

    function tick() {
      setProgress(boostProgress(startsAt, expiresAt));
      setRemaining(formatRemaining(boostTimeRemaining(expiresAt)));
    }

    tick();
    const interval = setInterval(tick, 60_000); // update every minute
    return () => clearInterval(interval);
  }, [tier, startsAt, expiresAt]);

  if (!tier || !isBoostActive(expiresAt)) return null;

  const { card } = tier;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">
          {tier.icon} {tier.name} Boost
        </span>
        <span className="text-xs text-gray-500">{remaining}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${card.borderColor.replace('border-', 'bg-')}`}
          style={{ width: `${Math.max(2, 100 - progress)}%` }}
        />
      </div>
    </div>
  );
}
