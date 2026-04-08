"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function BoostSuccessContent() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listing_id");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <i className="fa-solid fa-rocket text-2xl text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Listing Boosted! 🚀
        </h1>
        <p className="text-gray-500 mb-6">
          Your listing is now boosted and will appear at the top of browse
          results. Thanks for your purchase!
        </p>
        <div className="flex flex-col gap-3">
          {listingId && (
            <Link
              href={`/listing/${listingId}`}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition"
            >
              View Your Listing
            </Link>
          )}
          <Link
            href="/dashboard"
            className="w-full bg-white border py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BoostSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Loading...
        </div>
      }
    >
      <BoostSuccessContent />
    </Suspense>
  );
}
