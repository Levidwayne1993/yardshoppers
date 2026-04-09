"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

interface ReportModalProps {
  listingId: string;
  listingTitle: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  "Spam or misleading",
  "Inappropriate content",
  "Suspected scam or fraud",
  "Wrong location or fake address",
  "Duplicate listing",
  "Sale already ended",
  "Other",
];

export default function ReportModal({
  listingId,
  listingTitle,
  onClose,
}: ReportModalProps) {
  const supabase = createClient();
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!selectedReason) {
      setError("Please select a reason.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to report a listing.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("reported_listings")
        .insert({
          listing_id: listingId,
          reporter_id: user.id,
          reason: selectedReason,
          details: details.trim() || null,
        });

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit report.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-red-400 via-red-300 to-orange-300" />

        <div className="p-6 sm:p-8">
          {submitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <i className="fa-solid fa-check text-2xl text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Report Submitted
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Thank you for helping keep YardShoppers safe. Our team will
                review this listing.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-flag text-xl text-red-400" />
              </div>

              <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
                Report Listing
              </h2>
              <p className="text-sm text-gray-500 text-center mb-6">
                &ldquo;{listingTitle}&rdquo;
              </p>

              <div className="space-y-2 mb-5">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Why are you reporting this?
                </p>
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedReason === reason
                        ? "border-red-300 bg-red-50"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="accent-red-500"
                    />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>

              <div className="mb-5">
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Additional details{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any extra context..."
                  rows={3}
                  maxLength={500}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !selectedReason}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin text-sm" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-flag text-sm" />
                    Submit Report
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                disabled={loading}
                className="w-full mt-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
