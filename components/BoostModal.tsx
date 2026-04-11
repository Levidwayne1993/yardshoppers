"use client";

import { useState } from "react";
import BoostPricingCards from "./BoostPricingCards";
import { BOOST_TIERS, type BoostTierKey } from "@/lib/boost-config";

interface BoostModalProps {
  listingId: string;
  listingTitle: string;
  onClose: () => void;
  onBoosted?: () => void;
}

export default function BoostModal({
  listingId,
  listingTitle,
  onClose,
  onBoosted,
}: BoostModalProps) {
  const [selectedTier, setSelectedTier] = useState<BoostTierKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tier = selectedTier ? BOOST_TIERS[selectedTier] : null;

  async function handleBoost() {
    if (!selectedTier || !tier) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          listing_title: listingTitle,
          boost_tier: selectedTier,
          price: tier.price,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to start checkout");

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="h-1.5 bg-gradient-to-r from-ys-700 via-ys-500 to-ys-300" />

        <div className="p-6 sm:p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <i className="fa-solid fa-rocket text-2xl text-amber-500" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
            Boost Your Listing
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            &ldquo;{listingTitle}&rdquo;
          </p>

          {/* ✅ NEW: Tier selection cards replace hardcoded pricing */}
          <BoostPricingCards
            selectedTier={selectedTier}
            onSelect={setSelectedTier}
            className="mb-6"
          />

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleBoost}
            disabled={loading || !selectedTier}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-ys-800 to-ys-700 hover:from-ys-900 hover:to-ys-800 text-white py-3.5 rounded-xl font-bold text-base transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-sm" />
                Redirecting to checkout...
              </>
            ) : selectedTier && tier ? (
              <>
                <i className="fa-solid fa-rocket text-sm" />
                Boost for ${tier.price.toFixed(2)}
              </>
            ) : (
              <>
                <i className="fa-solid fa-rocket text-sm" />
                Select a boost tier
              </>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-full mt-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition"
          >
            No thanks
          </button>

          <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-lock text-[10px]" />
              Secure Payment
            </span>
            <span className="flex items-center gap-1">
              <i className="fa-brands fa-stripe text-[10px]" />
              Powered by Stripe
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
