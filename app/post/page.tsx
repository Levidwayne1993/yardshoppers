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

export default function PostPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── ALL hooks at the top ────────────────── */
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  /* Form fields */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  /* ── Auth check ──────────────────────────── */
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

  /* ── Generate previews when photos change ── */
  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  /* ── Loading / Not authed ────────────────── */
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ys-200 border-t-ys-800 rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  /* ── Photo handlers ──────────────────────── */
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

  /* ── Submit ──────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !category || !city.trim() || !state.trim()) {
      setError("Please fill in all required fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);

    try {
      /* Insert listing */
      const { data: listing, error: insertErr } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          price: price.trim(),
          category,
          address: address.trim(),
          city: city.trim(),
          state: state.trim().toUpperCase(),
          zip_code: zipCode.trim(),
          sale_date: saleDate || null,
          sale_time_start: timeStart || null,
          sale_time_end: timeEnd || null,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      /* Upload photos */
      for (const photo of photos) {
        const ext = photo.name.split(".").pop();
        const path = `${user.id}/${listing.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

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

      router.push(`/listing/${listing.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ys-50 to-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* ── Header ───────────────────────── */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-ys-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-camera-retro text-2xl text-ys-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Post a Yard Sale</h1>
          <p className="text-gray-500 mt-2">
            Fill in the details below and reach thousands of local buyers — it&apos;s free!
          </p>
        </div>

        {/* ── Error ────────────────────────── */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <i className="fa-solid fa-circle-exclamation text-red-500 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Card: Basic Info ────────────── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
              <i className="fa-solid fa-pen text-ys-600 text-sm" />
              Basic Info
            </h2>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Moving Sale — Everything Must Go!"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-ys-600 focus:ring-2 focus:ring-ys-600/20 transition-all outline-none"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what you're selling — the more detail, the more buyers you'll attract..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-ys-600 focus:ring-2 focus:ring-ys-600/20 transition-all outline-none resize-y"
              />
            </div>

            {/* Price + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-ys-600 focus:ring-2 focus:ring-ys-600/20 transition-all outline-none bg-white cursor-pointer"
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Card: Location ──────────────── */}
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

          {/* ── Card: Date & Time ──────────── */}
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

          {/* ── Card: Photos ───────────────── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
              <i className="fa-solid fa-images text-ys-600 text-sm" />
              Photos
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Upload up to 10 photos. Listings with photos get 5x more views!
            </p>

            {/* Drop zone */}
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
                onChange={(e) => e.target.files && addPhotos(e.target.files)}
                className="hidden"
              />
              <div className="w-12 h-12 bg-ys-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-cloud-arrow-up text-xl text-ys-600" />
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-ys-800">Click to upload</span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, WEBP up to 5MB each
              </p>
            </div>

            {/* Preview grid */}
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

          {/* ── Submit ─────────────────────── */}
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
                Post Your Sale — It&apos;s Free
              </span>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            By posting, you agree to our{" "}
            <a href="/terms" className="underline hover:text-gray-600">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-gray-600">
              Privacy Policy
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
