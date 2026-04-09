"use client";

import { useState } from "react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBoost() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          listing_title: listingTitle,
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

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
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

          <div className="bg-ys-50 rounded-2xl p-5 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-ys-200 rounded-lg flex items-center justify-center shrink-0">
                <i className="fa-solid fa-arrow-up text-sm text-ys-800" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Top Placement</p>
                <p className="text-xs text-gray-500">Appear first in browse results</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-ys-200 rounded-lg flex items-center justify-center shrink-0">
                <i className="fa-solid fa-eye text-sm text-ys-800" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">10x More Views</p>
                <p className="text-xs text-gray-500">Get seen by more local shoppers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-ys-200 rounded-lg flex items-center justify-center shrink-0">
                <i className="fa-solid fa-bolt text-sm text-ys-800" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Instant Activation</p>
                <p className="text-xs text-gray-500">Boost goes live immediately after payment</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleBoost}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-ys-800 to-ys-700 hover:from-ys-900 hover:to-ys-800 text-white py-3.5 rounded-xl font-bold text-base transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-sm" />
                Redirecting to checkout...
              </>
            ) : (
              <>
                <i className="fa-solid fa-rocket text-sm" />
                Boost for $2.99
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
