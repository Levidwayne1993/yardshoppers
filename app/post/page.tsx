// ============================================================
// REPLACE: app/post/page.tsx
//
// UPDATED: Added promo code input with live validation.
//   - New "Promo Code" section between Photos and Submit button
//   - "Apply" button validates code via GET /api/promo/redeem?code=X
//   - After listing creation, auto-redeems code via POST /api/promo/redeem
//   - Success modal updated to show promo benefit instead of boost upsell
// ============================================================

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase-browser";

const CATEGORIES = [
  "Furniture",
  "Electronics",
  "Clothing",
  "Toys & Games",
  "Tools",
  "Kitchen",
  "Sports",
  "Books",
  "Antiques",
  "Garden",
  "Baby & Kids",
  "Vehicles",
  "Free Stuff",
];

interface PromoValidation {
  valid: boolean;
  error?: string;
  discount_type?: string;
  discount_value?: number;
  boost_tier?: string;
  duration_days?: number;
  benefit?: string;
}

export default function PostPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const [showBoostModal, setShowBoostModal] = useState(false);
  const [newListingId, setNewListingId] = useState<string | null>(null);
  const [newListingTitle, setNewListingTitle] = useState("");
  const [boostLoading, setBoostLoading] = useState(false);
  const [selectedBoostTier, setSelectedBoostTier] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // ── Promo Code State ──
  const [promoCode, setPromoCode] = useState("");
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoResult, setPromoResult] = useState<PromoValidation | null>(null);
  const [promoRedeemed, setPromoRedeemed] = useState(false);
  const [promoRedeemMessage, setPromoRedeemMessage] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u);
      setAuthLoading(false);
      if (!u) router.push("/login");
    }
    checkAuth();
  }, []);

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ys-200 border-t-ys-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  function addPhotos(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setPhotos((prev) => [...prev, ...arr].slice(0, 10));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) addPhotos(e.dataTransfer.files);
  }

  // ── Validate Promo Code ──
  async function handleValidatePromo() {
    if (!promoCode.trim()) return;
    setPromoValidating(true);
    setPromoResult(null);

    try {
      const res = await fetch(
        `/api/promo/redeem?code=${encodeURIComponent(promoCode.trim())}`
      );
      const data: PromoValidation = await res.json();
      setPromoResult(data);
    } catch {
      setPromoResult({ valid: false, error: "Network error. Please try again." });
    }

    setPromoValidating(false);
  }

  // ── Clear Promo Code ──
  function handleClearPromo() {
    setPromoCode("");
    setPromoResult(null);
    setPromoRedeemed(false);
    setPromoRedeemMessage("");
  }

  // ── Redeem Promo Code (called after listing is created) ──
  async function redeemPromoCode(listingId: string): Promise<{
    success: boolean;
    type?: string;
    message?: string;
  }> {
    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          listing_id: listingId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, type: data.type, message: data.message };
      }
      return { success: false, message: data.error || "Failed to redeem" };
    } catch {
      return { success: false, message: "Network error during redemption" };
    }
  }

  async function handleBoost(tier: string) {
    if (!newListingId) return;
    setBoostLoading(true);
    setSelectedBoostTier(tier);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: newListingId,
          listing_title: newListingTitle,
          boost_tier: tier,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
        setBoostLoading(false);
        setSelectedBoostTier(null);
      }
    } catch {
      alert("Something went wrong");
      setBoostLoading(false);
      setSelectedBoostTier(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (
      !title.trim() ||
      categories.length === 0 ||
      !city.trim() ||
      !state.trim()
    ) {
      setError(
        "Please fill in all required fields (including at least one category)."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);

    try {
      const { data: listing, error: insertErr } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          price: price.trim(),
          category: categories[0] || "Other",
          categories,
          address: address.trim(),
          street_address: address.trim(),
          city: city.trim(),
          state: state.trim().toUpperCase(),
          zip_code: zipCode.trim(),
          sale_date: saleDate || null,
          sale_time_start: timeStart || null,
          sale_time_end: timeEnd || null,
          start_time: timeStart || null,
          end_time: timeEnd || null,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Upload photos
      for (const photo of photos) {
        const ext = photo.name.split(".").pop();
        const path = `${user.id}/${listing.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("listing-photos")
          .upload(path, photo);

        if (!upErr) {
          const { data: urlData } = supabase.storage
            .from("listing-photos")
            .getPublicUrl(path);
          await supabase.from("listing_photos").insert({
            listing_id: listing.id,
            photo_url: urlData.publicUrl,
          });
        }
      }

      // Geocode
      try {
        const fullAddress = [address, city, state, zipCode]
          .filter(Boolean)
          .join(", ");
        const geoRes = await fetch(
          `/api/geocode?address=${encodeURIComponent(fullAddress)}`
        );
        const geoData = await geoRes.json();
        if (geoData.lat && geoData.lng) {
          await supabase
            .from("listings")
            .update({ latitude: geoData.lat, longitude: geoData.lng })
            .eq("id", listing.id);
        }
      } catch {}

      // ── REDEEM PROMO CODE if one was validated ──
      if (promoResult?.valid && promoCode.trim()) {
        const result = await redeemPromoCode(listing.id);
        if (result.success) {
          setPromoRedeemed(true);
          setPromoRedeemMessage(result.message || "Promo applied!");
        } else {
          // Promo failed but listing was still created successfully
          setPromoRedeemMessage(result.message || "Promo could not be applied");
        }
      }

      setNewListingId(listing.id);
      setNewListingTitle(listing.title);
      setShowBoostModal(true);
      setSubmitting(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ys-50 to-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-ys-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-camera-retro text-2xl text-ys-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Post a Yard Sale</h1>
          <p className="text-gray-500 mt-2">
            Fill in the details below and reach thousands of local buyers
            &mdash; it&apos;s free!
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <i className="fa-solid fa-circle-exclamation text-red-500 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ───────── BASIC INFO ───────── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
              <i className="fa-solid fa-pen text-ys-600 text-sm" />
              Basic Info
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Moving Sale – Everything Must Go!"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-ys-600 focus:ring-2 focus:ring-ys-600/20 transition-all outline-none"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what you're selling..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-ys-600 focus:ring-2 focus:ring-ys-600/20 transition-all outline-none resize-y"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Price Range
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. $5 – $200"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-ys-600 focus:ring-2 focus:ring-ys-600/20 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categories <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-400 ml-1">
                  (select all that apply)
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setCategories((prev) =>
                        prev.includes(cat)
                          ? prev.filter((c) => c !== cat)
                          : [...prev, cat]
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      categories.includes(cat)
                        ? "bg-ys-700 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                    {categories.includes(cat) && (
                      <span className="ml-1">✕</span>
                    )}
                  </button>
                ))}
              </div>
              {categories.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Pick at least one category
                </p>
              )}
            </div>
          </div>

          {/* ───────── LOCATION ───────── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
              <i className="fa-solid fa-location-dot text-ys-600 text-sm" />
              Location
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main Street"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-ys-600 focus:ring-2 focus:ring-ys-600/20 transition-all outline-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  City <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Olympia"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-ys-600 focus:ring-2 focus:ring-ys-600/20 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  State <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="WA"
                  maxLength={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-ys-600 focus:ring-2 focus:ring-ys-600/20 transition-all outline-none uppercase"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ZIP
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="98501"
                  maxLength={5}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-ys-600 focus:ring-2 focus:ring-ys-600/20 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* ───────── DATE & TIME ───────── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
              <i className="fa-regular fa-calendar text-ys-600 text-sm" />
              Date &amp; Time
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sale Date
                </label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-ys-600 focus:ring-2 focus:ring-ys-600/20 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-ys-600 focus:ring-2 focus:ring-ys-600/20 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  End Time
                </label>
                <input
                  type="time"
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-ys-600 focus:ring-2 focus:ring-ys-600/20 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* ───────── PHOTOS ───────── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
              <i className="fa-solid fa-images text-ys-600 text-sm" />
              Photos
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Upload up to 10 photos. Listings with photos get 5x more views!
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-ys-600 bg-ys-50"
                  : "border-gray-200 hover:border-ys-400 hover:bg-ys-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  e.target.files && addPhotos(e.target.files)
                }
                className="hidden"
              />
              <div className="w-12 h-12 bg-ys-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-cloud-arrow-up text-xl text-ys-600" />
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-ys-800">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, WEBP up to 5MB each
              </p>
            </div>
            {previews.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-4">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl overflow-hidden group"
                  >
                    <Image
                      src={src}
                      alt={`Preview ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 bg-ys-800 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ───────── PROMO CODE (NEW) ───────── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
              <i className="fa-solid fa-ticket text-ys-600 text-sm" />
              Promo Code
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Have a promo code? Enter it below to unlock a free boost or
              discount.
            </p>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    // Clear previous result when typing
                    if (promoResult) setPromoResult(null);
                  }}
                  placeholder="e.g. WELCOME50"
                  disabled={promoResult?.valid === true}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm font-mono uppercase transition-all outline-none ${
                    promoResult?.valid === true
                      ? "border-green-300 bg-green-50 text-green-800"
                      : promoResult?.valid === false
                      ? "border-red-300 bg-red-50 text-red-800 focus:border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 focus:border-ys-600 focus:ring-2 focus:ring-ys-600/20"
                  }`}
                />
                {promoResult?.valid === true && (
                  <i className="fa-solid fa-circle-check text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {promoResult?.valid === true ? (
                <button
                  type="button"
                  onClick={handleClearPromo}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition-all"
                >
                  <i className="fa-solid fa-xmark mr-1.5" />
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleValidatePromo}
                  disabled={!promoCode.trim() || promoValidating}
                  className="px-5 py-2.5 bg-ys-700 hover:bg-ys-800 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {promoValidating ? (
                    <span className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Checking
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-check text-xs" />
                      Apply
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Validation Result */}
            {promoResult && (
              <div
                className={`mt-3 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2 ${
                  promoResult.valid
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                <i
                  className={`fa-solid ${
                    promoResult.valid
                      ? "fa-gift text-green-500"
                      : "fa-exclamation-circle text-red-500"
                  } mt-0.5`}
                />
                <span>
                  {promoResult.valid
                    ? promoResult.benefit
                    : promoResult.error}
                </span>
              </div>
            )}
          </div>

          {/* ───────── SUBMIT ───────── */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-ys-800 to-ys-700 hover:from-ys-900 hover:to-ys-800 text-white text-lg font-bold rounded-2xl transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting your sale...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <i className="fa-solid fa-rocket" />
                Post Your Sale &mdash; It&apos;s Free
              </span>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            By posting, you agree to our{" "}
            <a
              href="/terms"
              className="underline hover:text-gray-600"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="underline hover:text-gray-600"
            >
              Privacy Policy
            </a>
          </p>
        </form>
      </div>

      {/* ───────── SUCCESS MODAL ───────── */}
      {showBoostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <i className="fa-solid fa-check text-3xl text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sale Posted! 🎉
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              &ldquo;{newListingTitle}&rdquo; is now live.
            </p>

            {/* Show promo redemption result if a code was applied */}
            {promoRedeemed && promoRedeemMessage && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <i className="fa-solid fa-gift text-green-600" />
                  <h3 className="font-bold text-green-900">
                    Promo Code Applied!
                  </h3>
                </div>
                <p className="text-sm text-green-800">
                  {promoRedeemMessage}
                </p>
              </div>
            )}

            {/* Show boost tier selection only if no free_boost promo was redeemed */}
            {!(promoRedeemed && promoResult?.discount_type === "free_boost") && (
              <>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <i className="fa-solid fa-rocket text-amber-600" />
                  <h3 className="font-bold text-gray-900">Boost Your Listing</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* Spark */}
                  <button
                    onClick={() => handleBoost("spark")}
                    disabled={boostLoading}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all hover:shadow-md disabled:opacity-60 ${
                      selectedBoostTier === "spark"
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 bg-white"
                    }`}
                  >
                    <div className="text-lg mb-1">⚡</div>
                    <h4 className="text-sm font-bold text-gray-900">Spark</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Quick bump to the top</p>
                    <p className="text-base font-extrabold text-gray-900 mt-2">$1.99</p>
                    <p className="text-[10px] text-gray-400">1 day &middot; 3x reach</p>
                    {selectedBoostTier === "spark" && boostLoading && (
                      <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                      </div>
                    )}
                  </button>

                  {/* Spotlight */}
                  <button
                    onClick={() => handleBoost("spotlight")}
                    disabled={boostLoading}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all hover:shadow-md disabled:opacity-60 ${
                      selectedBoostTier === "spotlight"
                        ? "border-yellow-400 bg-yellow-50"
                        : "border-yellow-300 hover:border-yellow-400 bg-white"
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 bg-yellow-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">POPULAR</div>
                    <div className="text-lg mb-1">⭐</div>
                    <h4 className="text-sm font-bold text-gray-900">Spotlight</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Stand out from the crowd</p>
                    <p className="text-base font-extrabold text-gray-900 mt-2">$4.99</p>
                    <p className="text-[10px] text-gray-400">3 days &middot; 5x reach</p>
                    {selectedBoostTier === "spotlight" && boostLoading && (
                      <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-yellow-300 border-t-yellow-600 rounded-full animate-spin" />
                      </div>
                    )}
                  </button>

                  {/* Blaze */}
                  <button
                    onClick={() => handleBoost("blaze")}
                    disabled={boostLoading}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all hover:shadow-md disabled:opacity-60 ${
                      selectedBoostTier === "blaze"
                        ? "border-orange-400 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300 bg-white"
                    }`}
                  >
                    <div className="text-lg mb-1">🔥</div>
                    <h4 className="text-sm font-bold text-gray-900">Blaze</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Maximum visibility for a week</p>
                    <p className="text-base font-extrabold text-gray-900 mt-2">$9.99</p>
                    <p className="text-[10px] text-gray-400">7 days &middot; 10x reach</p>
                    {selectedBoostTier === "blaze" && boostLoading && (
                      <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                      </div>
                    )}
                  </button>

                  {/* Mega */}
                  <button
                    onClick={() => handleBoost("mega")}
                    disabled={boostLoading}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all hover:shadow-md disabled:opacity-60 ${
                      selectedBoostTier === "mega"
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300 bg-white"
                    }`}
                  >
                    <div className="text-lg mb-1">💎</div>
                    <h4 className="text-sm font-bold text-gray-900">Mega</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">The ultimate promotion</p>
                    <p className="text-base font-extrabold text-gray-900 mt-2">$14.99</p>
                    <p className="text-[10px] text-gray-400">14 days &middot; 25x reach</p>
                    {selectedBoostTier === "mega" && boostLoading && (
                      <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                </div>
              </>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() =>
                  router.push(`/listing/${newListingId}`)
                }
                className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium text-sm transition"
              >
                {promoRedeemed && promoResult?.discount_type === "free_boost"
                  ? "View my boosted listing →"
                  : "No thanks, view my listing →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
