"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

interface ListingCtx {
  id: string;
  title: string;
  user_id: string;
  is_boosted: boolean;
  is_shadowbanned: boolean;
  is_external: boolean;
}

interface PosterInfo {
  id: string;
  full_name: string | null;
  email: string | null;
  is_shadow_banned: boolean;
  listing_count: number;
  created_at: string | null;
}

export default function AdminFloatingBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [isAdmin, setIsAdmin] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [listing, setListing] = useState<ListingCtx | null>(null);
  const [poster, setPoster] = useState<PosterInfo | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"listing" | "user" | "tools">("listing");

  /* ── auth ── */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email?.toLowerCase() || "";
      setIsAdmin(ADMIN_EMAILS.includes(email));
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email?.toLowerCase() || "";
      setIsAdmin(ADMIN_EMAILS.includes(email));
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  /* ── listing context ── */
  useEffect(() => {
    if (!isAdmin) return;
    const m = pathname.match(/^\/listing\/(.+)$/);
    if (m) {
      fetchCtx(m[1]);
      setActiveTab("listing");
    } else {
      setListing(null);
      setPoster(null);
      setActiveTab("tools");
    }
  }, [pathname, isAdmin]);

  const fetchCtx = async (id: string) => {
    // Try internal listing first
    const { data: internal } = await supabase
      .from("listings")
      .select("id, title, user_id, is_boosted, is_shadowbanned")
      .eq("id", id)
      .single();

    if (internal) {
      setListing({
        ...internal,
        is_boosted: internal.is_boosted || false,
        is_shadowbanned: internal.is_shadowbanned || false,
        is_external: false,
      });
      if (internal.user_id) await fetchPoster(internal.user_id);
      else setPoster(null);
      return;
    }

    // Try external
    const { data: ext } = await supabase
      .from("external_sales")
      .select("id, title")
      .eq("id", id)
      .single();

    if (ext) {
      setListing({
        id: ext.id,
        title: ext.title || "External Sale",
        user_id: "",
        is_boosted: false,
        is_shadowbanned: false,
        is_external: true,
      });
      setPoster(null);
    }
  };

  const fetchPoster = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, is_shadow_banned, created_at")
      .eq("id", userId)
      .single();

    // Get user email from auth (only accessible via profile or we skip)
    const { count } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    setPoster({
      id: userId,
      full_name: profile?.full_name || null,
      email: null, // email not in profiles table by default
      is_shadow_banned: profile?.is_shadow_banned || false,
      listing_count: count || 0,
      created_at: profile?.created_at || null,
    });
  };

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  };

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  /* ── actions ── */
  const handleBoost = async () => {
    if (!listing || listing.is_external) return;
    setBusy("boost");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setListing((p) => (p ? { ...p, is_boosted: true } : null));
        flash("\u2705 Boosted! Owner notified.");
      } else flash("\u274c " + data.error);
    } catch { flash("\u274c Failed to boost"); }
    setBusy(null);
  };

  const handleShadowbanListing = async () => {
    if (!listing || listing.is_external) return;
    const newVal = !listing.is_shadowbanned;
    setBusy("sbl");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/shadowban", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId: listing.id, shadowban: newVal }),
      });
      if (res.ok) {
        setListing((p) => (p ? { ...p, is_shadowbanned: newVal } : null));
        flash(newVal ? "\uD83D\uDC7B Listing shadow-banned" : "\u2705 Listing un-banned");
      }
    } catch { flash("\u274c Failed"); }
    setBusy(null);
  };

  const handleShadowbanUser = async () => {
    if (!poster) return;
    const newVal = !poster.is_shadow_banned;
    const msg = newVal
      ? `Shadow ban this user? Their listings will be hidden from all other users.`
      : `Lift shadow ban on this user?`;
    if (!confirm(msg)) return;
    setBusy("sbu");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/shadowban-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: poster.id, shadowban: newVal }),
      });
      if (res.ok) {
        setPoster((p) => (p ? { ...p, is_shadow_banned: newVal } : null));
        flash(newVal ? "\uD83D\uDEAB User shadow-banned" : "\u2705 User un-banned");
      }
    } catch { flash("\u274c Failed"); }
    setBusy(null);
  };

  const handleDelete = async () => {
    if (!listing) return;
    if (!confirm(`Permanently delete "${listing.title}"? This cannot be undone.`)) return;
    setBusy("delete");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/delete-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId: listing.id, isExternal: listing.is_external }),
      });
      if (res.ok) {
        flash("\uD83D\uDDD1\uFE0F Deleted");
        setTimeout(() => router.push("/browse"), 1000);
      }
    } catch { flash("\u274c Failed to delete"); }
    setBusy(null);
  };

  const handleEdit = () => {
    if (!listing) return;
    router.push(`/admin/edit/${listing.id}${listing.is_external ? "?type=external" : ""}`);
  };

  if (!isAdmin) return null;

  const onListingPage = !!listing;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium max-w-sm text-center">
          {toast}
        </div>
      )}

      <div className="fixed bottom-20 md:bottom-6 right-4 z-[60]">
        {expanded && (
          <div className="mb-3 bg-gray-900 text-white rounded-2xl shadow-2xl w-80 max-h-[75vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 px-4 py-3 border-b border-gray-700 rounded-t-2xl flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-amber-400" />
                <span className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                  Admin Toolkit
                </span>
              </div>
              <button onClick={() => setExpanded(false)} className="text-gray-400 hover:text-white transition">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              {onListingPage && (
                <button
                  onClick={() => setActiveTab("listing")}
                  className={`flex-1 text-xs py-2.5 font-medium transition ${
                    activeTab === "listing" ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <i className="fa-solid fa-list mr-1" /> Listing
                </button>
              )}
              {poster && (
                <button
                  onClick={() => setActiveTab("user")}
                  className={`flex-1 text-xs py-2.5 font-medium transition ${
                    activeTab === "user" ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <i className="fa-solid fa-user mr-1" /> User
                </button>
              )}
              <button
                onClick={() => setActiveTab("tools")}
                className={`flex-1 text-xs py-2.5 font-medium transition ${
                  activeTab === "tools" ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-400 hover:text-white"
                }`}
              >
                <i className="fa-solid fa-wrench mr-1" /> Tools
              </button>
            </div>

            {/* ── LISTING TAB ── */}
            {activeTab === "listing" && listing && (
              <div className="p-4 space-y-3">
                {/* Listing info */}
                <div className="bg-gray-800 rounded-xl p-3 space-y-2">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    {listing.is_external ? "\uD83D\uDCE5 External" : "\uD83D\uDCDD User-posted"} Listing
                  </p>
                  <p className="text-sm font-semibold truncate">{listing.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.is_boosted && (
                      <span className="text-[10px] bg-amber-600/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        <i className="fa-solid fa-rocket mr-0.5" /> Boosted
                      </span>
                    )}
                    {listing.is_shadowbanned && (
                      <span className="text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                        <i className="fa-solid fa-ghost mr-0.5" /> Shadow-banned
                      </span>
                    )}
                  </div>
                </div>

                {/* Listing actions */}
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Actions</p>

                  {/* Edit */}
                  {!listing.is_external && (
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
                    >
                      <i className="fa-solid fa-pen-to-square text-xs w-4 text-center" />
                      Edit Listing
                    </button>
                  )}

                  {/* Boost */}
                  {!listing.is_external && !listing.is_boosted && (
                    <button
                      onClick={handleBoost}
                      disabled={busy === "boost"}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition disabled:opacity-50"
                    >
                      <i className={`fa-solid ${busy === "boost" ? "fa-spinner fa-spin" : "fa-rocket"} text-xs w-4 text-center`} />
                      Free Boost + Notify
                    </button>
                  )}
                  {!listing.is_external && listing.is_boosted && (
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-amber-900/30 text-amber-400 text-sm">
                      <i className="fa-solid fa-check-circle text-xs w-4 text-center" />
                      Already Boosted
                    </div>
                  )}

                  {/* Shadow ban listing */}
                  {!listing.is_external && (
                    <button
                      onClick={handleShadowbanListing}
                      disabled={busy === "sbl"}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                        listing.is_shadowbanned
                          ? "bg-green-700 hover:bg-green-600 text-white"
                          : "bg-purple-700 hover:bg-purple-600 text-white"
                      }`}
                    >
                      <i className={`fa-solid ${busy === "sbl" ? "fa-spinner fa-spin" : listing.is_shadowbanned ? "fa-eye" : "fa-ghost"} text-xs w-4 text-center`} />
                      {listing.is_shadowbanned ? "Un-ban Listing" : "Shadow Ban Listing"}
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={handleDelete}
                    disabled={busy === "delete"}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-50"
                  >
                    <i className={`fa-solid ${busy === "delete" ? "fa-spinner fa-spin" : "fa-trash"} text-xs w-4 text-center`} />
                    Delete Listing
                  </button>
                </div>
              </div>
            )}

            {/* ── USER TAB ── */}
            {activeTab === "user" && poster && (
              <div className="p-4 space-y-3">
                {/* User info card */}
                <div className="bg-gray-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(poster.full_name || "?")[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{poster.full_name || "Anonymous"}</p>
                      <p className="text-xs text-gray-400">
                        {poster.listing_count} listing{poster.listing_count !== 1 ? "s" : ""}
                        {poster.created_at &&
                          ` \u00B7 Joined ${new Date(poster.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {poster.is_shadow_banned && (
                      <span className="text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                        <i className="fa-solid fa-ban mr-0.5" /> Shadow-banned
                      </span>
                    )}
                    {!poster.is_shadow_banned && (
                      <span className="text-[10px] bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                        <i className="fa-solid fa-check mr-0.5" /> Active
                      </span>
                    )}
                  </div>
                </div>

                {/* User actions */}
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">User Actions</p>

                  {/* Shadow ban user */}
                  <button
                    onClick={handleShadowbanUser}
                    disabled={busy === "sbu"}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                      poster.is_shadow_banned
                        ? "bg-green-700 hover:bg-green-600 text-white"
                        : "bg-red-700 hover:bg-red-600 text-white"
                    }`}
                  >
                    <i className={`fa-solid ${busy === "sbu" ? "fa-spinner fa-spin" : poster.is_shadow_banned ? "fa-user-check" : "fa-user-slash"} text-xs w-4 text-center`} />
                    {poster.is_shadow_banned ? "Lift User Ban" : "Shadow Ban User"}
                  </button>

                  {/* View all user listings */}
                  <a
                    href={`/browse?user=${poster.id}`}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition"
                  >
                    <i className="fa-solid fa-rectangle-list text-xs w-4 text-center" />
                    View All Listings ({poster.listing_count})
                  </a>
                </div>
              </div>
            )}

            {/* ── TOOLS TAB ── */}
            {activeTab === "tools" && (
              <div className="p-4 space-y-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Quick Links</p>
                <div className="space-y-2">
                  <a href="/dashboard" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition">
                    <i className="fa-solid fa-chart-line text-xs w-4 text-center text-blue-400" />
                    Admin Dashboard
                  </a>
                  <a href="/admin/bulk-import" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition">
                    <i className="fa-solid fa-upload text-xs w-4 text-center text-green-400" />
                    Bulk Import
                  </a>
                  <a href="/browse" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition">
                    <i className="fa-solid fa-magnifying-glass text-xs w-4 text-center text-purple-400" />
                    Browse All Sales
                  </a>
                  <a href="/route-planner" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition">
                    <i className="fa-solid fa-map-location-dot text-xs w-4 text-center text-orange-400" />
                    Route Planner
                  </a>
                  <a href="/messages" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition">
                    <i className="fa-solid fa-envelope text-xs w-4 text-center text-cyan-400" />
                    Messages
                  </a>
                </div>

                {!onListingPage && (
                  <p className="text-xs text-gray-500 mt-3 text-center italic">
                    Navigate to a listing to see listing &amp; user actions
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* FAB Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
            expanded
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-amber-500 hover:bg-amber-400 hover:scale-110"
          }`}
          aria-label="Admin tools"
          title="Admin Toolkit"
        >
          <i className={`fa-solid ${expanded ? "fa-xmark" : "fa-shield-halved"} text-white text-xl`} />
        </button>
      </div>
    </>
  );
}
