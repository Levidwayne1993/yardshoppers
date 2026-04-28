"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default function AdminEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const listingId = params.id as string;
  const isExternal = searchParams.get("type") === "external";

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form fields — internal listings
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isBoosted, setIsBoosted] = useState(false);
  const [isShadowbanned, setIsShadowbanned] = useState(false);

  // Form fields — external sales
  const [extSource, setExtSource] = useState("");
  const [extUrl, setExtUrl] = useState("");
  const [extLat, setExtLat] = useState("");
  const [extLng, setExtLng] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email?.toLowerCase() || "";
      if (!ADMIN_EMAILS.includes(email)) {
        router.push("/");
        return;
      }
      setIsAdmin(true);
      await loadListing();
    };
    init();
  }, []);

  const loadListing = async () => {
    setLoading(true);
    if (isExternal) {
      const { data } = await supabase
        .from("external_sales")
        .select("*")
        .eq("id", listingId)
        .single();
      if (data) {
        setTitle(data.title || "");
        setDescription(data.description || "");
        setAddress(data.address || "");
        setCity(data.city || "");
        setState(data.state || "");
        setZip(data.zip || "");
        setCategory(data.category || "");
        setStartDate(data.start_date ? data.start_date.substring(0, 10) : "");
        setEndDate(data.end_date ? data.end_date.substring(0, 10) : "");
        setExtSource(data.source || "");
        setExtUrl(data.source_url || data.url || "");
        setExtLat(data.latitude?.toString() || "");
        setExtLng(data.longitude?.toString() || "");
      }
    } else {
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .single();
      if (data) {
        setTitle(data.title || "");
        setDescription(data.description || "");
        setAddress(data.address || "");
        setCity(data.city || "");
        setState(data.state || "");
        setZip(data.zip_code || data.zip || "");
        setCategory(data.category || "");
        setStartDate(data.start_date ? data.start_date.substring(0, 10) : "");
        setEndDate(data.end_date ? data.end_date.substring(0, 10) : "");
        setIsBoosted(data.is_boosted || false);
        setIsShadowbanned(data.is_shadowbanned || false);
      }
    }
    setLoading(false);
  };

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      const payload: Record<string, unknown> = {
        listingId,
        isExternal,
        title: title.trim(),
        description: description.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        category: category.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
      };

      if (!isExternal) {
        payload.is_boosted = isBoosted;
        payload.is_shadowbanned = isShadowbanned;
      }

      if (isExternal) {
        payload.source = extSource.trim();
        payload.source_url = extUrl.trim();
        if (extLat) payload.latitude = parseFloat(extLat);
        if (extLng) payload.longitude = parseFloat(extLng);
      }

      const res = await fetch("/api/admin/edit-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        flash("\u2705 Changes saved!");
        setTimeout(() => router.push(`/listing/${listingId}`), 1500);
      } else {
        flash("\u274c " + (data.error || "Failed to save"));
      }
    } catch {
      flash("\u274c Failed to save");
    }
    setSaving(false);
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-[#2E7D32] text-3xl"></i>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <i className="fa-solid fa-arrow-left text-lg"></i>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              <i className="fa-solid fa-shield-halved text-amber-500 mr-2"></i>
              Admin Edit
            </h1>
            <p className="text-sm text-gray-500">
              {isExternal ? "External sale" : "User-posted listing"} &middot;{" "}
              <span className="font-mono text-xs">{listingId.substring(0, 8)}...</span>
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
              placeholder="Sale title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent resize-y"
              placeholder="Sale description"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
              placeholder="123 Main St"
            />
          </div>

          {/* City / State / Zip */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
                maxLength={2}
                placeholder="WA"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">ZIP</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
                maxLength={10}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
              placeholder="Yard Sale, Estate Sale, etc."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
              />
            </div>
          </div>

          {/* External-only fields */}
          {isExternal && (
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                External Source Info
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Source</label>
                  <input
                    type="text"
                    value={extSource}
                    onChange={(e) => setExtSource(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
                    placeholder="Craigslist, Facebook, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Source URL</label>
                  <input
                    type="url"
                    value={extUrl}
                    onChange={(e) => setExtUrl(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={extLat}
                    onChange={(e) => setExtLat(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={extLng}
                    onChange={(e) => setExtLng(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Internal-only toggles */}
          {!isExternal && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                Admin Flags
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBoosted}
                  onChange={(e) => setIsBoosted(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">
                  <i className="fa-solid fa-rocket text-amber-500 mr-1"></i> Boosted
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isShadowbanned}
                  onChange={(e) => setIsShadowbanned(e.target.checked)}
                  className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  <i className="fa-solid fa-ghost text-red-500 mr-1"></i> Shadow-banned
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 bg-[#2E7D32] hover:bg-green-800 text-white font-semibold py-3 px-6 rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i> Saving...
              </>
            ) : (
              <>
                <i className="fa-solid fa-check mr-2"></i> Save Changes
              </>
            )}
          </button>
          <button
            onClick={() => router.back()}
            className="py-3 px-6 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
        </div>

        {/* View live link */}
        <div className="mt-4 text-center">
          <a
            href={`/listing/${listingId}`}
            className="text-sm text-[#2E7D32] hover:underline"
          >
            <i className="fa-solid fa-external-link mr-1"></i> View live listing
          </a>
        </div>
      </div>
    </div>
  );
}
