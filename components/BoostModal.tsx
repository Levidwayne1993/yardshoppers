// ============================================================
// PASTE INTO: components/BoostModal.tsx (yardshoppers project)
//
// UPDATED: Added promo code input and redemption flow.
//   - Users can enter a promo code before checkout
//   - Free boost codes activate immediately (skip Stripe)
//   - Discount codes show reduced price and pass it to checkout
//   - "Have a promo code?" toggle keeps UI clean
// ============================================================

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

  // ── Promo code state ──
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<{
    valid: boolean;
    free?: boolean;
    activated?: boolean;
    final_price?: string;
    message?: string;
    error?: string;
  } | null>(null);

  const tier = selectedTier ? BOOST_TIERS[selectedTier] : null;

  // ── Apply promo code ──
  async function handleApplyPromo() {
    if (!promoCode.trim() || !selectedTier) return;

    setPromoLoading(true);
    setPromoResult(null);

    try {
      const res = await fetch("/api/redeem-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          listing_id: listingId,
          boost_tier: selectedTier,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPromoResult({ valid: false, error: data.error });
      } else if (data.free && data.activated) {
        // Free boost — already activated on the backend
        setPromoResult({
          valid: true,
          free: true,
          activated: true,
          message: data.message || "Boost activated for free!",
        });
        // Auto-close after brief success display
        setTimeout(() => {
          if (onBoosted) onBoosted();
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        // Partial discount — show new price
        setPromoResult({
          valid: true,
          final_price: data.final_price,
          message: `Discount applied! New price: $${data.final_price}`,
        });
      }
    } catch {
      setPromoResult({ valid: false, error: "Failed to apply code" });
    }

    setPromoLoading(false);
  }

  // ── Checkout (with or without promo discount) ──
  async function handleBoost() {
    if (!selectedTier || !tier) return;

    setLoading(true);
    setError("");

    try {
      const finalPrice =
        promoResult?.valid && promoResult?.final_price
          ? parseFloat(promoResult.final_price)
          : tier.price;

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          listing_title: listingTitle,
          boost_tier: selectedTier,
          price: finalPrice,
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

  // Determine button label based on promo state
  const boostButtonLabel = () => {
    if (loading) {
      return (
        <>
          <i className="fa-solid fa-spinner fa-spin text-sm" />
          Redirecting to checkout...
        </>
      );
    }

    if (promoResult?.valid && promoResult?.activated) {
      return (
        <>
          <i className="fa-solid fa-check text-sm" />
          Boost Activated!
        </>
      );
    }

    if (selectedTier && tier) {
      const displayPrice =
        promoResult?.valid && promoResult?.final_price
          ? promoResult.final_price
          : tier.price.toFixed(2);

      return (
        <>
          <i className="fa-solid fa-rocket text-sm" />
          Boost for ${displayPrice}
        </>
      );
    }

    return (
      <>
        <i className="fa-solid fa-rocket text-sm" />
        Select a boost tier
      </>
    );
  };

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

          {/* ✅ Tier selection cards */}
          <BoostPricingCards
            selectedTier={selectedTier}
            onSelect={(t) => {
              setSelectedTier(t);
              // Reset promo when tier changes
              setPromoResult(null);
            }}
            className="mb-6"
          />

          {/* ═══════════════════════════════════════════
              ✅ NEW: Promo Code Section
              ═══════════════════════════════════════════ */}
          <div className="border-t border-gray-100 pt-4 mb-4">
            <button
              onClick={() => setShowPromo(!showPromo)}
              className="text-sm text-ys-600 font-medium hover:text-ys-700 transition flex items-center gap-1.5"
            >
              <i className={`fa-solid fa-tag text-xs transition-transform ${showPromo ? "rotate-90" : ""}`} />
              Have a promo code?
            </button>

            {showPromo && (
              <div className="mt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code..."
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoResult(null);
                    }}
                    disabled={promoResult?.activated}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 font-mono text-sm uppercase tracking-wider focus:ring-2 focus:ring-ys-500 focus:border-ys-500 outline-none disabled:opacity-50 disabled:bg-gray-50"
                  />
                  <button
                    disabled={!promoCode.trim() || !selectedTier || promoLoading || promoResult?.activated}
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-ys-600 text-white rounded-xl text-sm font-medium hover:bg-ys-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {promoLoading ? (
                      <i className="fa-solid fa-spinner fa-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>

                {!selectedTier && promoCode.trim() && (
                  <p className="mt-2 text-xs text-amber-600 font-medium">
                    <i className="fa-solid fa-info-circle mr-1" />
                    Select a boost tier first, then apply your code.
                  </p>
                )}

                {promoResult && (
                  <div
                    className={`mt-2 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
                      promoResult.valid
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : "bg-red-50 text-red-600 border border-red-100"
                    }`}
                  >
                    <i
                      className={`fa-solid ${
                        promoResult.valid ? "fa-check-circle" : "fa-times-circle"
                      } text-xs`}
                    />
                    {promoResult.message || promoResult.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleBoost}
            disabled={loading || !selectedTier || (promoResult?.activated === true)}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
              promoResult?.activated
                ? "bg-green-600 text-white"
                : "bg-gradient-to-r from-ys-800 to-ys-700 hover:from-ys-900 hover:to-ys-800 text-white"
            }`}
          >
            {boostButtonLabel()}
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
