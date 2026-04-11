'use client';

import {
  BOOST_TIERS,
  TIER_ORDER,
  perDayPrice,
  type BoostTierKey,
} from '@/lib/boost-config';

interface BoostPricingCardsProps {
  selectedTier?: BoostTierKey | null;
  onSelect: (tierKey: BoostTierKey) => void;
  className?: string;
}

export default function BoostPricingCards({
  selectedTier,
  onSelect,
  className = '',
}: BoostPricingCardsProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {TIER_ORDER.map((key) => {
        const tier = BOOST_TIERS[key];
        const isSelected = selectedTier === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`
              relative flex flex-col items-start p-4 rounded-xl border-2 text-left
              transition-all duration-200
              ${tier.card.bgGradient} ${tier.card.borderColor}
              ${isSelected ? `ring-2 ring-offset-2 ${tier.card.glowShadow} shadow-lg` : 'hover:shadow-md'}
            `}
          >
            {tier.popular && (
              <span className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow">
                Most Popular
              </span>
            )}

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{tier.icon}</span>
              <span className="font-bold text-lg">{tier.name}</span>
            </div>

            <p className="text-sm text-gray-500 mb-3">{tier.tagline}</p>

            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-extrabold">${tier.price.toFixed(2)}</span>
              <span className="text-xs text-gray-400">
                / {tier.durationDays} {tier.durationDays === 1 ? 'day' : 'days'}
              </span>
              <span className="text-xs text-gray-400 ml-1">({perDayPrice(tier)})</span>
            </div>

            <ul className="space-y-1 mb-3">
              {tier.features.map((f, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-1 mt-auto">
              <span
                className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                  border ${tier.badge.bg} ${tier.badge.text} ${tier.badge.border}
                  ${tier.badge.animate ? 'animate-pulse' : ''}
                `}
              >
                {tier.icon} {tier.badge.label}
              </span>
              <span className="text-[10px] text-gray-400">{tier.reachMultiplier} reach</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
