"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import BoostModal from "@/components/BoostModal";
import TrafficDashboard from "@/components/admin/TrafficDashboard";
import BoostDashboard from "@/components/admin/BoostDashboard";
import ShadowbanDashboard from "@/components/admin/ShadowbanDashboard";
import CouponDashboard from "@/components/admin/CouponDashboard";
import AdminNotepad from "@/components/admin/AdminNotepad";
import AggregatedSalesManager from "@/components/admin/AggregatedSalesManager";
import WeatherWidget from '@/components/WeatherWidget';
import CommunityBoard from '@/components/CommunityBoard';

const ADMIN_EMAILS = ["erwin-levi@outlook.com", "gary.w.erwin@gmail.com"];

interface Listing {
  id: string;
  title: string;
  city: string;
  state: string;
  sale_date: string;
  is_boosted: boolean;
  created_at: string;
  user_id: string;
  listing_photos?: { id: string; photo_url: string }[];
}

interface Report {
  id: string;
  reason: string;
  details: string | null;
  created_at: string;
  listing_id: string;
  reporter_id: string;
  listings?: {
    id: string;
    title: string;
    city: string;
    state: string;
    user_id: string;
    listing_photos?: { id: string; photo_url: string }[];
  };
}

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [boostTarget, setBoostTarget] = useState<Listing | null>(null);

  // Tabs — users get: my-listings, community | admins get full set
  const [activeTab, setActiveTab] = useState<
    "my-listings" | "community" | "analytics" | "boosts" | "listings" | "aggregated" | "reports" | "coverage" | "shadowban" | "coupons" | "aggregated" | "notepad"
  >("my-listings");

  // Profile editing
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Admin listing management (unchanged from original)
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    mode: string;
    label: string;
    count: number;
    state?: string;
    city?: string;
  } | null>(null);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);

  // ================= LOAD DATA =================
  useEffect(() => {
    async function load() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();

      if (!u) {
        router.push("/login");
        return;
      }

      setUser(u);
      const admin = ADMIN_EMAILS.includes(u.email?.toLowerCase() || "");
      setIsAdmin(admin);

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setEditName(profileData.display_name || "");
        setEditBio(profileData.bio || "");
        setEditCity(profileData.city || "");
        setEditState(profileData.state || "");
      }

      // Load listings
      let query = supabase
        .from("listings")
        .select("*, listing_photos(*)")
        .order("created_at", { ascending: false });

      if (!admin) {
        query = query.eq("user_id", u.id);
      }

      const { data: listingsData } = await query;
      setListings(listingsData || []);

      // Load reports (admin only)
      if (admin) {
        const { data: reportsData } = await supabase
          .from("reported_listings")
          .select(
            "*, listings(id, title, city, state, user_id, listing_photos(*))"
          )
          .eq("resolved", false)
          .order("created_at", { ascending: false });

        setReports(reportsData || []);
      }

      setLoading(false);
    }
    load();
  }, []);

  // ================= AVATAR UPLOAD =================
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      // Remove old avatar if exists
      await supabase.storage.from("avatars").remove([path]);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : prev);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert("Failed to upload avatar. Please try again.");
    }
    setUploadingAvatar(false);
  }

  // ================= SAVE PROFILE =================
  async function handleSaveProfile() {
    if (!user) return;
    setSavingProfile(true);

    try {
      // Geocode the city/state
      let lat: number | null = null;
      let lng: number | null = null;

      if (editCity && editState) {
        try {
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(editCity + " " + editState)}&count=1&language=en&format=json`
          );
          const geoData = await geoRes.json();
          if (geoData.results?.[0]) {
            lat = geoData.results[0].latitude;
            lng = geoData.results[0].longitude;
          }
        } catch {
          // Geocoding failed, still save other fields
        }
      }

      const updates: Partial<Profile> = {
        display_name: editName.trim() || null,
        bio: editBio.trim(),
        city: editCity.trim(),
        state: editState.trim().toUpperCase(),
        lat,
        lng,
        updated_at: new Date().toISOString(),
      } as any;

      await supabase.from("profiles").update(updates).eq("id", user.id);

      setProfile((prev) =>
        prev ? { ...prev, ...updates } : prev
      );
      setShowProfileEditor(false);
    } catch (err) {
      console.error("Profile save failed:", err);
    }

    setSavingProfile(false);
  }

  // ================= ADMIN LISTING HELPERS (unchanged) =================
  const stateMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    listings.forEach((l) => {
      const st = (l.state || "Unknown").toUpperCase().trim();
      const ct = (l.city || "Unknown").trim();
      if (!map[st]) map[st] = {};
      map[st][ct] = (map[st][ct] || 0) + 1;
    });
    return map;
  }, [listings]);

  const sortedStates = useMemo(() => {
    return Object.keys(stateMap).sort((a, b) => {
      const countA = Object.values(stateMap[a]).reduce((s, v) => s + v, 0);
      const countB = Object.values(stateMap[b]).reduce((s, v) => s + v, 0);
      return countB - countA;
    });
  }, [stateMap]);

  const citiesForSelectedState = useMemo(() => {
    if (selectedState === "all") return [];
    const cityMap = stateMap[selectedState] || {};
    return Object.entries(cityMap).sort((a, b) => b[1] - a[1]);
  }, [selectedState, stateMap]);

  const filteredListings = useMemo(() => {
    let result = listings;
    if (selectedState !== "all") {
      result = result.filter(
        (l) => (l.state || "").toUpperCase().trim() === selectedState
      );
    }
    if (selectedCity !== "all") {
      result = result.filter((l) => (l.city || "").trim() === selectedCity);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.city || "").toLowerCase().includes(q) ||
          (l.state || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [listings, selectedState, selectedCity, searchQuery]);

  const adminOwnListings = useMemo(() => {
    if (!user) return [];
    return listings.filter((l) => l.user_id === user.id);
  }, [listings, user]);

  const adminFilteredOwn = useMemo(() => {
    if (!user) return [];
    return filteredListings.filter((l) => l.user_id === user.id);
  }, [filteredListings, user]);

  const expiredListings = useMemo(() => {
    if (!user) return [];
    const today = new Date().toISOString().split("T")[0];
    return adminOwnListings.filter(
      (l) => l.sale_date && l.sale_date < today
    );
  }, [adminOwnListings]);

  const lowCoverageCities = useMemo(() => {
    const result: { state: string; city: string; count: number }[] = [];
    Object.entries(stateMap).forEach(([state, cityMap]) => {
      Object.entries(cityMap).forEach(([city, count]) => {
        if (count < 3) {
          result.push({ state, city, count });
        }
      });
    });
    return result.sort((a, b) => a.count - b.count);
  }, [stateMap]);

  const userListingsCount = useMemo(() => {
    if (!user) return 0;
    return listings.filter((l) => l.user_id === user.id).length;
  }, [listings, user]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedIds(new Set(adminFilteredOwn.map((l) => l.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  function promptDelete(
    mode: string,
    label: string,
    count: number,
    state?: string,
    city?: string
  ) {
    setDeleteConfirm({ mode, label, count, state, city });
  }

  async function executeDelete() {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    setDeleteResult(null);

    try {
      const payload: any = { mode: deleteConfirm.mode };
      if (deleteConfirm.mode === "selected") {
        payload.ids = Array.from(selectedIds);
      }
      if (deleteConfirm.state) payload.state = deleteConfirm.state;
      if (deleteConfirm.city) payload.city = deleteConfirm.city;

      const res = await fetch("/api/admin/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setDeleteResult(
          `✅ ${data.deleted} listing${data.deleted !== 1 ? "s" : ""} deleted`
        );
        if (deleteConfirm.mode === "selected") {
          setListings((prev) =>
            prev.filter((l) => !selectedIds.has(l.id))
          );
          setSelectedIds(new Set());
        } else {
          const { data: fresh } = await supabase
            .from("listings")
            .select("*, listing_photos(*)")
            .order("created_at", { ascending: false });
          setListings(fresh || []);
          setSelectedIds(new Set());
        }
      } else {
        setDeleteResult(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setDeleteResult(`❌ Failed: ${err.message}`);
    }

    setIsDeleting(false);
    setDeleteConfirm(null);
    setTimeout(() => setDeleteResult(null), 4000);
  }

  async function handleDelete(listingId: string) {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing || listing.user_id !== user?.id) {
      alert("You can only delete your own listings.");
      return;
    }
    const confirmed = confirm(
      "Are you sure you want to delete this listing? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await supabase
        .from("listing_photos")
        .delete()
        .eq("listing_id", listingId);
      await supabase.from("listings").delete().eq("id", listingId);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      setReports((prev) => prev.filter((r) => r.listing_id !== listingId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
    } catch (err) {
      alert("Failed to delete listing.");
    }
  }

  async function handleDismissReport(reportId: string) {
    await supabase
      .from("reported_listings")
      .update({ resolved: true })
      .eq("id", reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function handleStateChange(state: string) {
    setSelectedState(state);
    setSelectedCity("all");
    setSelectedIds(new Set());
  }

  function clearFilters() {
    setSelectedState("all");
    setSelectedCity("all");
    setSearchQuery("");
    setSelectedIds(new Set());
  }

  // Member since
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  // ================= LOADING STATE =================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <i className="fa-solid fa-spinner fa-spin" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  // ================= RENDER =================
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* ========== PROFILE HERO SECTION ========== */}
      <div className="bg-gradient-to-br from-ys-700 via-ys-800 to-ys-900 rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-4 right-20 w-3 h-3 bg-amber-400/40 rounded-full" />
        <div className="absolute bottom-8 right-12 w-2 h-2 bg-ys-300/30 rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-white/20 border-4 border-white/30 shadow-xl flex items-center justify-center">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="Your avatar"
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                />
              ) : (
                <i className="fa-solid fa-user text-4xl text-white/60" />
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            >
              {uploadingAvatar ? (
                <i className="fa-solid fa-spinner fa-spin text-white text-lg" />
              ) : (
                <i className="fa-solid fa-camera text-white text-lg" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            {/* Online dot */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-4 border-ys-800 rounded-full" />
          </div>

          {/* Name + Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {profile?.display_name || "Welcome!"}
              </h1>
              {isAdmin && (
                <span className="bg-red-500/30 text-red-200 text-xs font-bold px-2.5 py-1 rounded-full border border-red-400/30">
                  Admin
                </span>
              )}
            </div>

            {profile?.bio && (
              <p className="text-sm text-white/70 mb-2 max-w-lg">{profile.bio}</p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-white/60">
              {profile?.city && profile?.state && (
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-location-dot text-xs" />
                  {profile.city}, {profile.state}
                </span>
              )}
              {memberSince && (
                <span className="flex items-center gap-1.5">
                  <i className="fa-regular fa-calendar text-xs" />
                  Member since {memberSince}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
              <button
                onClick={() => {
                  setEditName(profile?.display_name || "");
                  setEditBio(profile?.bio || "");
                  setEditCity(profile?.city || "");
                  setEditState(profile?.state || "");
                  setShowProfileEditor(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-semibold transition backdrop-blur-sm border border-white/10"
              >
                <i className="fa-solid fa-pen text-xs" />
                Edit Profile
              </button>
              <Link
                href="/messages"
                className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-semibold transition backdrop-blur-sm border border-white/10"
              >
                <i className="fa-solid fa-envelope text-xs" />
                Messages
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-red-500/30 text-white/70 hover:text-white rounded-xl text-sm font-semibold transition border border-white/10"
              >
                <i className="fa-solid fa-right-from-bracket text-xs" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== STATS + WEATHER ROW ========== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Stats cards */}
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/post"
            className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-ys-300 hover:shadow-md transition group text-center"
          >
            <div className="w-10 h-10 bg-ys-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-ys-100 transition">
              <i className="fa-solid fa-plus text-ys-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 group-hover:text-ys-700">Post a Sale</p>
          </Link>

          <Link
            href="/browse"
            className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-ys-300 hover:shadow-md transition group text-center"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-100 transition">
              <i className="fa-solid fa-magnifying-glass text-blue-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 group-hover:text-blue-600">Browse Sales</p>
          </Link>

          <Link
            href="/saved"
            className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-red-200 hover:shadow-md transition group text-center"
          >
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-red-100 transition">
              <i className="fa-solid fa-heart text-red-400" />
            </div>
            <p className="text-xs font-bold text-gray-500 group-hover:text-red-500">Saved</p>
          </Link>

          <Link
            href="/route-planner"
            className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-purple-200 hover:shadow-md transition group text-center"
          >
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-100 transition">
              <i className="fa-solid fa-route text-purple-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 group-hover:text-purple-600">Route Planner</p>
          </Link>
        </div>

        {/* Weather widget */}
        <div>
          <WeatherWidget
            lat={profile?.lat}
            lng={profile?.lng}
            city={profile?.city}
            state={profile?.state}
          />
        </div>
      </div>

      {/* ========== USER STATS BAR ========== */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="text-center px-4">
            <p className="text-2xl font-bold text-gray-900">{userListingsCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">My Listings</p>
          </div>
          <div className="text-center px-4">
            <p className="text-2xl font-bold text-gray-900">
              {listings.filter((l) => l.user_id === user?.id && l.is_boosted).length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Boosted</p>
          </div>
          <div className="text-center px-4">
            <p className="text-2xl font-bold text-ys-700">
              {profile?.city && profile?.state
                ? `${profile.city}`
                : "—"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Home Area</p>
          </div>
        </div>
      </div>

      {/* ========== TABS ========== */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {/* User tabs (always shown) */}
        <button
          onClick={() => setActiveTab("my-listings")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "my-listings"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className="fa-solid fa-tag mr-2 text-xs" />
          My Listings
        </button>
        <button
          onClick={() => setActiveTab("community")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "community"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className="fa-solid fa-users mr-2 text-xs" />
          Community
        </button>

        {/* Divider if admin */}
        {isAdmin && (
          <div className="w-px bg-gray-300 mx-1 my-1" />
        )}

        {/* Admin-only tabs */}
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "analytics"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className="fa-solid fa-chart-line mr-2 text-xs" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("boosts")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "boosts"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className="fa-solid fa-rocket mr-2 text-xs" />
              Boosts
            </button>
            <button
              onClick={() => setActiveTab("listings")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "listings"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className="fa-solid fa-grid-2 mr-2 text-xs" />
              All ({listings.length})
            </button>
            <button
              onClick={() => setActiveTab("coverage")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "coverage"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className="fa-solid fa-map mr-2 text-xs" />
              Coverage
              {lowCoverageCities.length > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {lowCoverageCities.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "reports"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className="fa-solid fa-flag mr-2 text-xs" />
              Reports
              {reports.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {reports.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("shadowban")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "shadowban"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className="fa-solid fa-ghost mr-2 text-xs" />
              Shadowban
            </button>
            <button
              onClick={() => setActiveTab("coupons")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "coupons"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className="fa-solid fa-ticket mr-2 text-xs" />
              Coupons
            </button>
            <button
              onClick={() => setActiveTab("aggregated")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "aggregated"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className="fa-solid fa-database mr-2 text-xs" />
              Aggregated
            </button>
            <button
              onClick={() => setActiveTab("notepad")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "notepad"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className="fa-solid fa-note-sticky mr-2 text-xs" />
              Notepad
            </button>
                            <Link
                  href="/admin/outreach"
                  className="px-5 py-2 rounded-lg text-sm font-semibold transition text-gray-500 hover:text-gray-700 hover:bg-white/50 flex items-center gap-2"
                >
                  <i className="fa-solid fa-envelope mr-2 text-xs" />
                  Outreach
                </Link>

          </>
        )}
      </div>

      {/* DELETE RESULT TOAST */}
      {deleteResult && (
        <div
          className={`mb-6 px-5 py-3 rounded-xl text-sm font-semibold ${
            deleteResult.startsWith("✅")
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {deleteResult}
        </div>
      )}

      {/* ========== COMMUNITY TAB ========== */}
      {activeTab === "community" && (
        <CommunityBoard
          userId={user.id}
          userCity={profile?.city || ""}
          userState={profile?.state || "WA"}
        />
      )}

      {/* ========== MY LISTINGS TAB ========== */}
      {activeTab === "my-listings" && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            My Listings{" "}
            <span className="text-gray-400 font-normal">
              ({userListingsCount})
            </span>
          </h2>

          {userListingsCount === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-tag text-2xl text-gray-300" />
              </div>
              <p className="text-gray-500 mb-4">
                You haven&apos;t posted any sales yet.
              </p>
              <Link
                href="/post"
                className="inline-flex items-center gap-2 bg-ys-800 hover:bg-ys-900 text-white px-6 py-2.5 rounded-full font-semibold transition"
              >
                <i className="fa-solid fa-plus text-xs" />
                Post Your First Sale
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings
                .filter((l) => l.user_id === user?.id)
                .map((listing) => {
                  const photo = listing.listing_photos?.[0]?.photo_url;
                  return (
                    <div
                      key={listing.id}
                      className={`bg-white rounded-2xl overflow-hidden border transition-all hover:shadow-md ${
                        listing.is_boosted
                          ? "border-amber-200 shadow-sm"
                          : "border-gray-100"
                      }`}
                    >
                      <Link
                        href={`/listing/${listing.id}`}
                        className="block relative aspect-[4/3] bg-gray-100"
                      >
                        {photo ? (
                          <Image
                            src={photo}
                            alt={listing.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-ys-50">
                            <i className="fa-solid fa-tag text-3xl text-ys-300" />
                          </div>
                        )}
                        {listing.is_boosted && (
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
                            <i className="fa-solid fa-rocket text-[10px]" />
                            Boosted
                          </div>
                        )}
                      </Link>

                      <div className="p-4">
                        <Link href={`/listing/${listing.id}`}>
                          <h3 className="font-bold text-gray-900 hover:text-ys-800 transition truncate">
                            {listing.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <i className="fa-solid fa-location-dot text-[10px] text-ys-500" />
                          {listing.city}, {listing.state}
                        </p>
                        {listing.sale_date && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            <i className="fa-regular fa-calendar text-[10px] mr-1" />
                            {new Date(
                              listing.sale_date + "T00:00:00"
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        )}

                        <div className="mt-3 flex gap-2">
                          {!listing.is_boosted ? (
                            <button
                              onClick={() => setBoostTarget(listing)}
                              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-900 py-2 rounded-xl text-sm font-bold transition-all"
                            >
                              <i className="fa-solid fa-rocket text-xs" />
                              Boost
                            </button>
                          ) : (
                            <div className="flex-1 flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 py-2 rounded-xl text-sm font-semibold">
                              <i className="fa-solid fa-check-circle text-xs" />
                              Boosted
                            </div>
                          )}

                          <button
                            onClick={() => handleDelete(listing.id)}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition"
                          >
                            <i className="fa-solid fa-trash text-xs" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}



      {/* ===== ADMIN: ANALYTICS TAB ===== */}
      {activeTab === "analytics" && isAdmin && (
        <TrafficDashboard />
      )}

      {/* ===== ADMIN: BOOSTS TAB ===== */}
      {activeTab === "boosts" && isAdmin && (
        <BoostDashboard />
      )}

      {/* ===== ADMIN: ALL LISTINGS TAB ===== */}
      {activeTab === "listings" && isAdmin && (
        <>
          {/* ADMIN FILTER BAR */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search listings..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300 focus:border-ys-400 transition"
                />
              </div>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-ys-300 min-w-[160px]"
              >
                <option value="all">All States ({listings.length})</option>
                {sortedStates.map((st) => {
                  const count = Object.values(stateMap[st]).reduce(
                    (s, v) => s + v,
                    0
                  );
                  return (
                    <option key={st} value={st}>
                      {st} ({count})
                    </option>
                  );
                })}
              </select>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={selectedState === "all"}
                className={`bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-ys-300 min-w-[180px] ${
                  selectedState === "all"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <option value="all">
                  {selectedState === "all"
                    ? "Select a state first"
                    : `All Cities in ${selectedState} (${Object.values(
                        stateMap[selectedState] || {}
                      ).reduce((s, v) => s + v, 0)})`}
                </option>
                {citiesForSelectedState.map(([city, count]) => (
                  <option key={city} value={city}>
                    {city} ({count})
                  </option>
                ))}
              </select>
            </div>

            {(selectedState !== "all" ||
              selectedCity !== "all" ||
              searchQuery) && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {filteredListings.length} of {listings.length}{" "}
                  listings
                  {selectedState !== "all" && (
                    <span className="ml-1 inline-flex items-center gap-1 bg-ys-50 text-ys-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {selectedState}
                      {selectedCity !== "all" && ` / ${selectedCity}`}
                    </span>
                  )}
                </p>
                <button
                  onClick={clearFilters}
                  className="text-sm text-ys-700 hover:text-ys-900 font-semibold transition"
                >
                  <i className="fa-solid fa-xmark mr-1 text-xs" />
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* ADMIN BULK ACTION TOOLBAR */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <i className="fa-solid fa-toolbox text-ys-600 text-xs" />
                Admin Tools
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="bg-ys-50 text-ys-800 font-bold px-2 py-0.5 rounded-full">
                  {adminOwnListings.length} your listings
                </span>
                {expiredListings.length > 0 && (
                  <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full">
                    {expiredListings.length} expired
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={selectAllFiltered}
                className="flex items-center gap-1.5 px-3 py-2 bg-ys-50 hover:bg-ys-100 text-ys-800 rounded-xl text-xs font-semibold transition"
              >
                <i className="fa-regular fa-square-check text-xs" />
                Select All Visible ({adminFilteredOwn.length})
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={deselectAll}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                >
                  <i className="fa-regular fa-square text-xs" />
                  Deselect All
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                disabled={selectedIds.size === 0}
                onClick={() =>
                  promptDelete(
                    "selected",
                    `${selectedIds.size} selected listing${selectedIds.size !== 1 ? "s" : ""}`,
                    selectedIds.size
                  )
                }
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  selectedIds.size > 0
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <i className="fa-solid fa-trash text-[10px]" />
                Delete Selected ({selectedIds.size})
              </button>

              {selectedState !== "all" && (
                <button
                  onClick={() => {
                    const count = adminFilteredOwn.length;
                    if (count === 0) return;
                    promptDelete(
                      selectedCity !== "all" ? "city" : "state",
                      selectedCity !== "all"
                        ? `all your listings in ${selectedCity}, ${selectedState}`
                        : `all your listings in ${selectedState}`,
                      count,
                      selectedState,
                      selectedCity !== "all" ? selectedCity : undefined
                    );
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition"
                >
                  <i className="fa-solid fa-location-dot text-[10px]" />
                  Delete All in{" "}
                  {selectedCity !== "all"
                    ? `${selectedCity}`
                    : `${selectedState}`}{" "}
                  ({adminFilteredOwn.length})
                </button>
              )}

              {expiredListings.length > 0 && (
                <button
                  onClick={() =>
                    promptDelete(
                      "expired",
                      `${expiredListings.length} expired listing${expiredListings.length !== 1 ? "s" : ""} (past sale date)`,
                      expiredListings.length
                    )
                  }
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition"
                >
                  <i className="fa-regular fa-calendar-xmark text-[10px]" />
                  Delete Expired ({expiredListings.length})
                </button>
              )}

              <button
                onClick={() =>
                  promptDelete(
                    "all",
                    `ALL ${adminOwnListings.length} of your listings across every state and city`,
                    adminOwnListings.length
                  )
                }
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition"
              >
                <i className="fa-solid fa-skull-crossbones text-[10px]" />
                Delete ALL My Listings ({adminOwnListings.length})
              </button>
            </div>
          </div>

          {/* ADMIN LISTING HEADING */}
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            All Listings{" "}
            <span className="text-gray-400 font-normal">
              ({filteredListings.length})
            </span>
          </h2>

          {/* ADMIN LISTING GRID */}
          {filteredListings.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-tag text-2xl text-gray-300" />
              </div>
              <p className="text-gray-500 mb-4">
                {selectedState !== "all" ||
                selectedCity !== "all" ||
                searchQuery
                  ? "No listings match your filters."
                  : "No listings yet."}
              </p>
              {(selectedState !== "all" ||
                selectedCity !== "all" ||
                searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 bg-ys-800 hover:bg-ys-900 text-white px-6 py-2.5 rounded-full font-semibold transition"
                >
                  <i className="fa-solid fa-xmark text-xs" />
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((listing) => {
                const photo = listing.listing_photos?.[0]?.photo_url;
                const isOwner = listing.user_id === user?.id;
                const isSelected = selectedIds.has(listing.id);
                const isExpired =
                  listing.sale_date &&
                  listing.sale_date < new Date().toISOString().split("T")[0];

                return (
                  <div
                    key={listing.id}
                    className={`bg-white rounded-2xl overflow-hidden border transition-all hover:shadow-md relative ${
                      isSelected
                        ? "border-red-400 ring-2 ring-red-200"
                        : listing.is_boosted
                        ? "border-amber-200 shadow-sm"
                        : "border-gray-100"
                    }`}
                  >
                    {isOwner && (
                      <button
                        onClick={() => toggleSelect(listing.id)}
                        className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-red-500 text-white shadow-md"
                            : "bg-white/90 text-gray-400 hover:text-red-500 border border-gray-200 shadow-sm"
                        }`}
                      >
                        <i
                          className={`fa-solid ${
                            isSelected ? "fa-check" : "fa-square"
                          } text-xs`}
                        />
                      </button>
                    )}

                    {isExpired && (
                      <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Expired
                      </div>
                    )}

                    <Link
                      href={`/listing/${listing.id}`}
                      className="block relative aspect-[4/3] bg-gray-100"
                    >
                      {photo ? (
                        <Image
                          src={photo}
                          alt={listing.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-ys-50">
                          <i className="fa-solid fa-tag text-3xl text-ys-300" />
                        </div>
                      )}
                      {listing.is_boosted && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
                          <i className="fa-solid fa-rocket text-[10px]" />
                          Boosted
                        </div>
                      )}
                    </Link>

                    <div className="p-4">
                      <Link href={`/listing/${listing.id}`}>
                        <h3 className="font-bold text-gray-900 hover:text-ys-800 transition truncate">
                          {listing.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <i className="fa-solid fa-location-dot text-[10px] text-ys-500" />
                        {listing.city}, {listing.state}
                      </p>
                      {listing.sale_date && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          <i className="fa-regular fa-calendar text-[10px] mr-1" />
                          {new Date(
                            listing.sale_date + "T00:00:00"
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      )}

                      {isOwner && (
                        <div className="mt-3 flex gap-2">
                          {!listing.is_boosted ? (
                            <button
                              onClick={() => setBoostTarget(listing)}
                              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-900 py-2 rounded-xl text-sm font-bold transition-all"
                            >
                              <i className="fa-solid fa-rocket text-xs" />
                              Boost
                            </button>
                          ) : (
                            <div className="flex-1 flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 py-2 rounded-xl text-sm font-semibold">
                              <i className="fa-solid fa-check-circle text-xs" />
                              Boosted
                            </div>
                          )}
                          <button
                            onClick={() => handleDelete(listing.id)}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition"
                          >
                            <i className="fa-solid fa-trash text-xs" />
                            Delete
                          </button>
                        </div>
                      )}

                      {!isOwner && (
                        <div className="mt-3">
                          <Link
                            href={`/listing/${listing.id}`}
                            className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 py-2 rounded-xl text-sm font-semibold transition"
                          >
                            <i className="fa-solid fa-eye text-xs" />
                            View Listing
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== ADMIN: COVERAGE TAB ===== */}
      {activeTab === "coverage" && isAdmin && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Coverage Overview
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {listings.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Listings</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {sortedStates.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">States Covered</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(stateMap).reduce(
                  (total, cityMap) => total + Object.keys(cityMap).length,
                  0
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">Cities Covered</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
              <p
                className={`text-2xl font-bold ${
                  lowCoverageCities.length > 0
                    ? "text-amber-600"
                    : "text-green-600"
                }`}
              >
                {lowCoverageCities.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Low Coverage</p>
            </div>
          </div>

          {lowCoverageCities.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation text-amber-500" />
                Cities Needing More Listings (fewer than 3)
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl divide-y divide-amber-100">
                {lowCoverageCities.map(({ state, city, count }) => (
                  <div
                    key={`${state}-${city}`}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-location-dot text-amber-500 text-xs" />
                      <span className="text-sm font-semibold text-gray-900">
                        {city}, {state}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          count === 0
                            ? "bg-red-100 text-red-700"
                            : count === 1
                            ? "bg-amber-100 text-amber-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {count} listing{count !== 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedState(state);
                          setSelectedCity(city);
                          setActiveTab("listings");
                        }}
                        className="text-xs text-ys-700 hover:text-ys-900 font-semibold"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 className="text-sm font-bold text-gray-700 mb-3">
            Listings by State
          </h3>
          <div className="space-y-3">
            {sortedStates.map((state) => {
              const cityMap = stateMap[state];
              const totalForState = Object.values(cityMap).reduce(
                (s, v) => s + v,
                0
              );
              const sortedCities = Object.entries(cityMap).sort(
                (a, b) => b[1] - a[1]
              );

              return (
                <div
                  key={state}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setSelectedState(
                        selectedState === state ? "all" : state
                      );
                      setSelectedCity("all");
                    }}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-ys-50 rounded-xl flex items-center justify-center">
                        <span className="text-sm font-bold text-ys-800">
                          {state}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900">
                          {totalForState} listing
                          {totalForState !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sortedCities.length} cit
                          {sortedCities.length !== 1 ? "ies" : "y"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:block w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-ys-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (totalForState /
                                Math.max(
                                  ...sortedStates.map((s) =>
                                    Object.values(stateMap[s]).reduce(
                                      (a, b) => a + b,
                                      0
                                    )
                                  )
                                )) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                      <i
                        className={`fa-solid fa-chevron-down text-gray-400 text-xs transition-transform ${
                          selectedState === state ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {selectedState === state && (
                    <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sortedCities.map(([city, count]) => (
                          <button
                            key={city}
                            onClick={() => {
                              setSelectedCity(city);
                              setActiveTab("listings");
                            }}
                            className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-gray-100 hover:border-ys-300 hover:shadow-sm transition text-left"
                          >
                            <span className="text-sm text-gray-700">
                              {city}
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                count >= 5
                                  ? "bg-green-100 text-green-700"
                                  : count >= 3
                                  ? "bg-ys-50 text-ys-800"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ===== ADMIN: REPORTS TAB ===== */}
      {activeTab === "reports" && isAdmin && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Reported Listings{" "}
            <span className="text-gray-400 font-normal">
              ({reports.length})
            </span>
          </h2>

          {reports.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-check text-2xl text-green-500" />
              </div>
              <p className="text-gray-500">
                No reported listings to review. All clear!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const reportedListing = report.listings;
                const reportPhoto =
                  reportedListing?.listing_photos?.[0]?.photo_url;

                return (
                  <div
                    key={report.id}
                    className="bg-white border border-red-100 rounded-2xl p-5 hover:shadow-md transition"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {reportedListing && (
                        <Link
                          href={`/listing/${reportedListing.id}`}
                          className="shrink-0 w-full sm:w-32 h-24 relative rounded-xl overflow-hidden bg-gray-100"
                        >
                          {reportPhoto ? (
                            <Image
                              src={reportPhoto}
                              alt={reportedListing.title}
                              fill
                              className="object-cover"
                              sizes="128px"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-ys-50">
                              <i className="fa-solid fa-tag text-xl text-ys-300" />
                            </div>
                          )}
                        </Link>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {reportedListing?.title || "Unknown Listing"}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {reportedListing?.city},{" "}
                              {reportedListing?.state}
                            </p>
                          </div>
                          <span className="shrink-0 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            {report.reason}
                          </span>
                        </div>

                        {report.details && (
                          <p className="text-sm text-gray-600 mt-2 bg-red-50 rounded-xl px-3 py-2">
                            &ldquo;{report.details}&rdquo;
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          <p className="text-xs text-gray-400">
                            Reported{" "}
                            {new Date(report.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>

                        <div className="flex gap-2 mt-3">
                          {reportedListing && (
                            <button
                              onClick={() =>
                                handleDelete(reportedListing.id)
                              }
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition"
                            >
                              <i className="fa-solid fa-trash text-[10px]" />
                              Remove Listing
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDismissReport(report.id)
                            }
                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                          >
                            <i className="fa-solid fa-check text-[10px]" />
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== ADMIN: SHADOWBAN TAB ===== */}
      {activeTab === "shadowban" && isAdmin && <ShadowbanDashboard />}

      {/* ===== ADMIN: COUPONS TAB ===== */}
      {activeTab === "coupons" && isAdmin && <CouponDashboard />}

      {/* ===== ADMIN: AGGREGATED TAB ===== */}
      {activeTab === "aggregated" && isAdmin && (
        <AggregatedSalesManager />
      )}

      {/* ===== ADMIN: NOTEPAD TAB ===== */}
      {activeTab === "notepad" && isAdmin && <AdminNotepad userEmail={""} />}

      {/* ========== PROFILE EDITOR MODAL ========== */}
      {showProfileEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <i className="fa-solid fa-user-pen text-ys-600" />
                Edit Profile
              </h2>
              <button
                onClick={() => setShowProfileEditor(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
              >
                <i className="fa-solid fa-xmark text-gray-500 text-sm" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="How should we call you?"
                  maxLength={50}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell your neighbors about yourself..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300 resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1 text-right">
                  {editBio.length}/200
                </p>
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Your city"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value.toUpperCase())}
                    placeholder="e.g. WA"
                    maxLength={2}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300 uppercase"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <i className="fa-solid fa-circle-info text-[10px]" />
                Your city &amp; state power the weather widget and community board
              </p>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowProfileEditor(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex-1 px-4 py-2.5 bg-ys-700 hover:bg-ys-800 text-white rounded-xl text-sm font-bold transition disabled:opacity-50"
              >
                {savingProfile ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-1 text-xs" />{" "}
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DELETE CONFIRMATION MODAL ========== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Confirm Deletion
              </h3>
              <p className="text-sm text-gray-500">
                You&apos;re about to delete{" "}
                <span className="font-bold text-red-600">
                  {deleteConfirm.label}
                </span>
                . This cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-1 text-xs" />{" "}
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-trash mr-1 text-xs" /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== BOOST MODAL ========== */}
      {boostTarget && (
  <BoostModal
    listingId={boostTarget.id}
    listingTitle={boostTarget.title}
    onClose={() => setBoostTarget(null)}
  />
)}

    </div>
  );
}
