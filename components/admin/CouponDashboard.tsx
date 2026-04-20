"use client";

import { useState, useEffect, useCallback } from "react";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed" | "free_boost";
  discount_value: number;
  boost_tier: string | null;
  duration_days: number | null;
  max_uses: number | null;
  uses_count: number;
  target_user_id: string | null;
  target_listing_id: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface Redemption {
  id: string;
  user_id: string;
  listing_id: string;
  boost_tier: string;
  duration_days: number;
  original_price_cents: number;
  discount_cents: number;
  final_price_cents: number;
  redeemed_at: string;
  promo_codes: { code: string; description: string | null } | null;
}

interface BoostCredit {
  id: string;
  listing_id: string;
  user_id: string;
  boost_tier: string;
  duration_days: number;
  reason: string | null;
  granted_by: string;
  granted_at: string;
  activated_at: string | null;
}

type SubTab = "codes" | "grant" | "history";

export default function CouponDashboard() {
  const [subTab, setSubTab] = useState<SubTab>("codes");
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [credits, setCredits] = useState<BoostCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create promo code form
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<"percentage" | "fixed" | "free_boost">("free_boost");
  const [newDiscountValue, setNewDiscountValue] = useState("");
  const [newBoostTier, setNewBoostTier] = useState("spark");
  const [newDurationDays, setNewDurationDays] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Grant credit form
  const [grantListingId, setGrantListingId] = useState("");
  const [grantBoostTier, setGrantBoostTier] = useState("spark");
  const [grantDurationDays, setGrantDurationDays] = useState("7");
  const [grantReason, setGrantReason] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo");
      const data = await res.json();
      if (res.ok) setCodes(data.codes || []);
    } catch (err) {
      console.error("Failed to fetch promo codes", err);
    }
    setLoading(false);
  }, []);

  const fetchRedemptions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promo?view=redemptions");
      const data = await res.json();
      if (res.ok) setRedemptions(data.redemptions || []);
    } catch (err) {
      console.error("Failed to fetch redemptions", err);
    }
  }, []);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promo?view=credits");
      const data = await res.json();
      if (res.ok) setCredits(data.credits || []);
    } catch (err) {
      console.error("Failed to fetch credits", err);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  useEffect(() => {
    if (subTab === "history") {
      fetchRedemptions();
      fetchCredits();
    }
  }, [subTab, fetchRedemptions, fetchCredits]);

  const handleCreateCode = async () => {
    if (!newCode.trim()) {
      setMessage({ type: "error", text: "Promo code is required" });
      return;
    }
    setCreateLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.trim(),
          description: newDescription || null,
          discount_type: newDiscountType,
          discount_value: newDiscountType !== "free_boost" ? parseFloat(newDiscountValue) || 0 : 0,
          boost_tier: newDiscountType === "free_boost" ? newBoostTier : null,
          duration_days: newDurationDays ? parseInt(newDurationDays) : null,
          max_uses: newMaxUses ? parseInt(newMaxUses) : null,
          expires_at: newExpiresAt || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `Promo code "${newCode.toUpperCase()}" created!` });
        setNewCode("");
        setNewDescription("");
        setNewDiscountValue("");
        setNewDurationDays("");
        setNewMaxUses("");
        setNewExpiresAt("");
        fetchCodes();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to create code" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
    setCreateLoading(false);
  };

  const handleToggleCode = async (promoId: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/promo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promo_id: promoId, is_active: !currentActive }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: `Code ${!currentActive ? "activated" : "deactivated"}` });
        fetchCodes();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update code" });
    }
  };

  const handleGrantCredit = async () => {
    if (!grantListingId.trim()) {
      setMessage({ type: "error", text: "Listing ID is required" });
      return;
    }
    setGrantLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant_credit",
          listing_id: grantListingId.trim(),
          boost_tier: grantBoostTier,
          duration_days: parseInt(grantDurationDays) || 7,
          reason: grantReason || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Boost credit granted!" });
        setGrantListingId("");
        setGrantReason("");
      } else {
        setMessage({ type: "error", text: data.error || "Failed to grant credit" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
    setGrantLoading(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  };

  const tierColors: Record<string, string> = {
    spark: "bg-yellow-100 text-yellow-700",
    spotlight: "bg-blue-100 text-blue-700",
    blaze: "bg-orange-100 text-orange-700",
    mega: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            <i className="fa-solid fa-ticket mr-2 text-ys-600"></i>Coupon &amp; Discount Manager
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Create promo codes, grant free boosts, and track all redemptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-ys-50 px-4 py-2 rounded-xl">
            <span className="text-sm font-semibold text-ys-700">
              <i className="fa-solid fa-tags mr-1"></i>{codes.filter((c) => c.is_active).length} active codes
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "codes" as SubTab, label: "Promo Codes", icon: "fa-tags" },
          { key: "grant" as SubTab, label: "Grant Free Boost", icon: "fa-gift" },
          { key: "history" as SubTab, label: "Redemption History", icon: "fa-clock-rotate-left" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setSubTab(tab.key); setMessage(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              subTab === tab.key ? "bg-white text-ys-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className={`fa-solid ${tab.icon} mr-2`}></i>{tab.label}
          </button>
        ))}
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          message.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          <i className={`fa-solid ${message.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"} mr-2`}></i>
          {message.text}
        </div>
      )}

      {/* TAB: Promo Codes */}
      {subTab === "codes" && (
        <div className="space-y-6">
          {/* Create New Code */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              <i className="fa-solid fa-plus-circle mr-2"></i>Create Promo Code
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Code *</label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME50"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono uppercase focus:ring-2 focus:ring-ys-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Internal note..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-ys-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Discount Type *</label>
                <select
                  value={newDiscountType}
                  onChange={(e) => setNewDiscountType(e.target.value as "percentage" | "fixed" | "free_boost")}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-ys-500 outline-none bg-white"
                >
                  <option value="free_boost">Free Boost (100% off)</option>
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed $ Off</option>
                </select>
              </div>

              {newDiscountType !== "free_boost" && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {newDiscountType === "percentage" ? "Discount %" : "Discount $"}
                  </label>
                  <input
                    type="number"
                    placeholder={newDiscountType === "percentage" ? "e.g. 25" : "e.g. 2.00"}
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-ys-500 outline-none"
                  />
                </div>
              )}

              {newDiscountType === "free_boost" && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Boost Tier</label>
                  <select
                    value={newBoostTier}
                    onChange={(e) => setNewBoostTier(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-ys-500 outline-none bg-white"
                  >
                    <option value="spark">Spark ($3)</option>
                    <option value="spotlight">Spotlight ($5)</option>
                    <option value="blaze">Blaze ($8)</option>
                    <option value="mega">Mega ($10)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Duration (days)</label>
                <input
                  type="number"
                  placeholder="Custom days (optional)"
                  value={newDurationDays}
                  onChange={(e) => setNewDurationDays(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-ys-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Max Uses</label>
                <input
                  type="number"
                  placeholder="Unlimited if empty"
                  value={newMaxUses}
                  onChange={(e) => setNewMaxUses(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-ys-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Expires At</label>
                <input
                  type="datetime-local"
                  value={newExpiresAt}
                  onChange={(e) => setNewExpiresAt(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-ys-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleCreateCode}
              disabled={createLoading || !newCode.trim()}
              className="mt-4 px-6 py-2.5 bg-ys-600 text-white text-sm font-medium rounded-xl hover:bg-ys-700 disabled:opacity-50 transition-colors"
            >
              {createLoading ? (
                <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Creating...</>
              ) : (
                <><i className="fa-solid fa-plus mr-2"></i>Create Promo Code</>
              )}
            </button>
          </div>

          {/* Existing Codes */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              <i className="fa-solid fa-list mr-2"></i>All Promo Codes ({codes.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <i className="fa-solid fa-spinner fa-spin text-2xl text-ys-600"></i>
              </div>
            ) : codes.length === 0 ? (
              <div className="text-center py-12">
                <i className="fa-solid fa-ticket text-4xl text-gray-300 mb-3"></i>
                <p className="text-sm text-gray-500">No promo codes yet. Create your first one above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {codes.map((promo) => (
                  <div key={promo.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${promo.is_active ? "bg-white border-gray-200 hover:border-ys-200" : "bg-gray-50 border-gray-100 opacity-60"}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${promo.is_active ? "bg-ys-100" : "bg-gray-200"}`}>
                        <i className={`fa-solid fa-tag ${promo.is_active ? "text-ys-600" : "text-gray-400"}`}></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono text-gray-900">{promo.code}</span>
                          {promo.discount_type === "free_boost" && promo.boost_tier && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tierColors[promo.boost_tier] || "bg-gray-100 text-gray-600"}`}>
                              {promo.boost_tier} — FREE
                            </span>
                          )}
                          {promo.discount_type === "percentage" && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                              {promo.discount_value}% off
                            </span>
                          )}
                          {promo.discount_type === "fixed" && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                              ${promo.discount_value} off
                            </span>
                          )}
                          {!promo.is_active && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-500">Inactive</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {promo.description && <span>{promo.description}</span>}
                          <span><i className="fa-solid fa-hashtag mr-1"></i>{promo.uses_count}{promo.max_uses ? `/${promo.max_uses}` : ""} used</span>
                          {promo.duration_days && <span><i className="fa-solid fa-calendar mr-1"></i>{promo.duration_days}d boost</span>}
                          {promo.expires_at && <span><i className="fa-solid fa-hourglass mr-1"></i>Expires {formatDate(promo.expires_at)}</span>}
                          {promo.target_user_id && <span><i className="fa-solid fa-user-lock mr-1"></i>User-specific</span>}
                          {promo.target_listing_id && <span><i className="fa-solid fa-thumbtack mr-1"></i>Listing-specific</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleCode(promo.id, promo.is_active)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-xl transition-colors ${
                        promo.is_active
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {promo.is_active ? (
                        <><i className="fa-solid fa-pause mr-1"></i>Deactivate</>
                      ) : (
                        <><i className="fa-solid fa-play mr-1"></i>Activate</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Grant Free Boost */}
      {subTab === "grant" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            <i className="fa-solid fa-gift mr-2"></i>Grant Free Boost to a Listing
          </h3>
          <p className="text-xs text-gray-500 mb-6">
            Instantly activate a boost on any listing for free. Great for compensating issues or rewarding good sellers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Listing ID *</label>
              <input
                type="text"
                placeholder="Paste listing UUID..."
                value={grantListingId}
                onChange={(e) => setGrantListingId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:ring-2 focus:ring-ys-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Find this in the Admin Listings tab or from the listing URL.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Boost Tier</label>
              <select
                value={grantBoostTier}
                onChange={(e) => setGrantBoostTier(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-ys-500 outline-none bg-white"
              >
                <option value="spark">Spark (Tier 1)</option>
                <option value="spotlight">Spotlight (Tier 2)</option>
                <option value="blaze">Blaze (Tier 3)</option>
                <option value="mega">Mega (Tier 4)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Duration (days)</label>
              <input
                type="number"
                placeholder="7"
                value={grantDurationDays}
                onChange={(e) => setGrantDurationDays(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-ys-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
              <input
                type="text"
                placeholder="e.g. Compensation for billing issue, loyalty reward..."
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-ys-500 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleGrantCredit}
            disabled={grantLoading || !grantListingId.trim()}
            className="mt-6 px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {grantLoading ? (
              <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Granting...</>
            ) : (
              <><i className="fa-solid fa-gift mr-2"></i>Grant Free Boost</>
            )}
          </button>
        </div>
      )}

      {/* TAB: Redemption History */}
      {subTab === "history" && (
        <div className="space-y-6">
          {/* Promo Redemptions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              <i className="fa-solid fa-receipt mr-2"></i>Promo Code Redemptions ({redemptions.length})
            </h3>
            {redemptions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No redemptions yet</p>
            ) : (
              <div className="space-y-2">
                {redemptions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-ys-100 rounded-full flex items-center justify-center">
                        <i className="fa-solid fa-ticket text-ys-600 text-xs"></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-semibold text-gray-900">
                            {r.promo_codes?.code || "—"}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tierColors[r.boost_tier] || "bg-gray-100 text-gray-600"}`}>
                            {r.boost_tier}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          ${(r.original_price_cents / 100).toFixed(2)} → ${(r.final_price_cents / 100).toFixed(2)}
                          {" "}(saved ${(r.discount_cents / 100).toFixed(2)})
                          {" · "}{r.duration_days}d boost
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(r.redeemed_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Boost Credits */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              <i className="fa-solid fa-gift mr-2"></i>Admin-Granted Boost Credits ({credits.length})
            </h3>
            {credits.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No credits granted yet</p>
            ) : (
              <div className="space-y-2">
                {credits.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <i className="fa-solid fa-gift text-green-600 text-xs"></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tierColors[c.boost_tier] || "bg-gray-100 text-gray-600"}`}>
                            {c.boost_tier}
                          </span>
                          <span className="text-xs text-gray-600">{c.duration_days}d boost</span>
                          {c.activated_at && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                              <i className="fa-solid fa-check mr-1"></i>Activated
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {c.reason || "No reason given"} · Listing: {c.listing_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(c.granted_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
