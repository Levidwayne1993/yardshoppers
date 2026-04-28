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
  is_shadow_banned: boolean;
  listing_count: number;
  created_at: string | null;
}

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
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

type TabKey = "listing" | "user" | "coupons" | "notes" | "tools";

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
  const [activeTab, setActiveTab] = useState<TabKey>("tools");

  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [cpCode, setCpCode] = useState("");
  const [cpDesc, setCpDesc] = useState("");
  const [cpType, setCpType] = useState<"free_boost" | "percentage" | "fixed">("free_boost");
  const [cpValue, setCpValue] = useState("");
  const [cpTier, setCpTier] = useState("spark");
  const [cpDays, setCpDays] = useState("");
  const [cpMax, setCpMax] = useState("");
  const [cpExp, setCpExp] = useState("");

  const [generalNote, setGeneralNote] = useState("");
  const [listingNote, setListingNote] = useState("");

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

  useEffect(() => {
    if (!isAdmin) return;
    const m = pathname.match(/^\/listing\/(.+)$/);
    if (m) { fetchCtx(m[1]); setActiveTab("listing"); }
    else { setListing(null); setPoster(null); if (activeTab === "listing" || activeTab === "user") setActiveTab("tools"); }
  }, [pathname, isAdmin]);

  const fetchCtx = async (id: string) => {
    const { data: internal } = await supabase.from("listings").select("id, title, user_id, is_boosted, is_shadowbanned").eq("id", id).single();
    if (internal) {
      setListing({ ...internal, is_boosted: internal.is_boosted || false, is_shadowbanned: internal.is_shadowbanned || false, is_external: false });
      if (internal.user_id) await fetchPoster(internal.user_id); else setPoster(null);
      return;
    }
    const { data: ext } = await supabase.from("external_sales").select("id, title").eq("id", id).single();
    if (ext) { setListing({ id: ext.id, title: ext.title || "External Sale", user_id: "", is_boosted: false, is_shadowbanned: false, is_external: true }); setPoster(null); }
  };

  const fetchPoster = async (uid: string) => {
    const { data: profile } = await supabase.from("profiles").select("id, full_name, is_shadow_banned, created_at").eq("id", uid).single();
    const { count } = await supabase.from("listings").select("id", { count: "exact", head: true }).eq("user_id", uid);
    setPoster({ id: uid, full_name: profile?.full_name || null, is_shadow_banned: profile?.is_shadow_banned || false, listing_count: count || 0, created_at: profile?.created_at || null });
  };

  useEffect(() => { try { setGeneralNote(localStorage.getItem("ys_admin_general_note") || ""); } catch {} }, []);
  useEffect(() => { if (listing) { try { setListingNote(localStorage.getItem(`ys_admin_note_${listing.id}`) || ""); } catch {} } else setListingNote(""); }, [listing]);
  useEffect(() => { const t = setTimeout(() => { try { localStorage.setItem("ys_admin_general_note", generalNote); } catch {} }, 500); return () => clearTimeout(t); }, [generalNote]);
  useEffect(() => { if (!listing) return; const t = setTimeout(() => { try { localStorage.setItem(`ys_admin_note_${listing.id}`, listingNote); } catch {} }, 500); return () => clearTimeout(t); }, [listingNote, listing]);

  const getToken = async () => { const { data } = await supabase.auth.getSession(); return data.session?.access_token || ""; };
  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleBoost = async () => {
    if (!listing || listing.is_external) return; setBusy("boost");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/boost", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ listingId: listing.id }) });
      if (res.ok) { setListing((p) => (p ? { ...p, is_boosted: true } : null)); flash("\u2705 Boosted! Owner notified."); }
      else { const d = await res.json(); flash("\u274c " + (d.error || "Boost failed")); }
    } catch { flash("\u274c Failed to boost"); }
    setBusy(null);
  };

  const handleShadowbanListing = async () => {
    if (!listing || listing.is_external) return; const newVal = !listing.is_shadowbanned; setBusy("sbl");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/shadowban", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ listingId: listing.id, shadowban: newVal }) });
      if (res.ok) { setListing((p) => (p ? { ...p, is_shadowbanned: newVal } : null)); flash(newVal ? "\uD83D\uDC7B Listing shadow-banned" : "\u2705 Listing un-banned"); }
    } catch { flash("\u274c Failed"); }
    setBusy(null);
  };

  const handleShadowbanUser = async () => {
    if (!poster) return; const newVal = !poster.is_shadow_banned;
    if (!confirm(`${newVal ? "Shadow ban" : "Un-ban"} "${poster.full_name || "this user"}"?${newVal ? " All their listings will be hidden." : ""}`)) return;
    setBusy("sbu");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/shadowban-user", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId: poster.id, shadowban: newVal }) });
      if (res.ok) { setPoster((p) => (p ? { ...p, is_shadow_banned: newVal } : null)); flash(newVal ? "\uD83D\uDEAB User shadow-banned" : "\u2705 User un-banned"); }
    } catch { flash("\u274c Failed"); }
    setBusy(null);
  };

  const handleDelete = async () => {
    if (!listing) return;
    if (!confirm(`Permanently delete "${listing.title}"? This cannot be undone.`)) return; setBusy("delete");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/delete-listing", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ listingId: listing.id, isExternal: listing.is_external }) });
      if (res.ok) { flash("\uD83D\uDDD1\uFE0F Deleted"); setTimeout(() => router.push("/browse"), 1000); }
    } catch { flash("\u274c Failed to delete"); }
    setBusy(null);
  };

  const handleEdit = () => { if (!listing) return; router.push(`/admin/edit/${listing.id}${listing.is_external ? "?type=external" : ""}`); };

  const loadPromos = async () => {
    setPromoLoading(true);
    try { const res = await fetch("/api/admin/promo"); const data = await res.json(); if (res.ok) setPromos(data.codes || []); } catch {}
    setPromoLoading(false);
  };

  const createPromo = async () => {
    if (!cpCode.trim()) return; setBusy("promo");
    try {
      const res = await fetch("/api/admin/promo", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cpCode.trim(), description: cpDesc || null, discount_type: cpType, discount_value: cpType !== "free_boost" ? parseFloat(cpValue) || 0 : 0, boost_tier: cpType === "free_boost" ? cpTier : null, duration_days: cpDays ? parseInt(cpDays) : null, max_uses: cpMax ? parseInt(cpMax) : null, expires_at: cpExp || null }) });
      if (res.ok) { flash("\u2705 Promo code created!"); setCpCode(""); setCpDesc(""); setCpValue(""); setCpDays(""); setCpMax(""); setCpExp(""); loadPromos(); }
      else { const d = await res.json(); flash("\u274c " + (d.error || "Failed")); }
    } catch { flash("\u274c Network error"); }
    setBusy(null);
  };

  const togglePromo = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/promo", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ promo_id: id, is_active: !currentActive }) });
      if (res.ok) { flash(!currentActive ? "\u2705 Activated" : "\u23f8\uFE0F Deactivated"); loadPromos(); }
    } catch {}
  };

  useEffect(() => { if (activeTab === "coupons" && isAdmin) loadPromos(); }, [activeTab, isAdmin]);

  if (!isAdmin) return null;

  const onListingPage = !!listing;
  const tabs: { key: TabKey; label: string; icon: string }[] = [];
  if (onListingPage) tabs.push({ key: "listing", label: "Listing", icon: "fa-list" });
  if (poster) tabs.push({ key: "user", label: "User", icon: "fa-user" });
  tabs.push({ key: "coupons", label: "Coupons", icon: "fa-ticket" });
  tabs.push({ key: "notes", label: "Notes", icon: "fa-sticky-note" });
  tabs.push({ key: "tools", label: "Tools", icon: "fa-wrench" });

  return (
    <>
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium max-w-sm text-center">{toast}</div>
      )}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[60]">
        {expanded && (
          <div className="mb-3 bg-gray-900 text-white rounded-2xl shadow-2xl w-80 max-h-[75vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700 rounded-t-2xl flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-amber-400" />
                <span className="text-sm font-bold text-amber-400 uppercase tracking-wider">Admin Toolkit</span>
              </div>
              <button onClick={() => setExpanded(false)} className="text-gray-400 hover:text-white transition"><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="flex border-b border-gray-700 flex-shrink-0 overflow-x-auto">
              {tabs.map((t) => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`flex-1 min-w-0 text-[10px] py-2 font-medium transition whitespace-nowrap px-1 ${activeTab === t.key ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-400 hover:text-white"}`}>
                  <i className={`fa-solid ${t.icon} mr-0.5`} /> {t.label}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto flex-1 p-4">

              {activeTab === "listing" && listing && (
                <div className="space-y-3">
                  <div className="bg-gray-800 rounded-xl p-3 space-y-2">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{listing.is_external ? "\uD83D\uDCE5 External" : "\uD83D\uDCDD User-posted"} Listing</p>
                    <p className="text-sm font-semibold truncate">{listing.title}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {listing.is_boosted && <span className="text-[10px] bg-amber-600/20 text-amber-400 px-2 py-0.5 rounded-full font-medium"><i className="fa-solid fa-rocket mr-0.5" /> Boosted</span>}
                      {listing.is_shadowbanned && <span className="text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full font-medium"><i className="fa-solid fa-ghost mr-0.5" /> Shadow-banned</span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Actions</p>
                    {!listing.is_external && <button onClick={handleEdit} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"><i className="fa-solid fa-pen-to-square text-xs w-4 text-center" /> Edit Listing</button>}
                    {!listing.is_external && !listing.is_boosted && <button onClick={handleBoost} disabled={busy === "boost"} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition disabled:opacity-50"><i className={`fa-solid ${busy === "boost" ? "fa-spinner fa-spin" : "fa-rocket"} text-xs w-4 text-center`} /> Free Boost + Notify</button>}
                    {!listing.is_external && listing.is_boosted && <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-amber-900/30 text-amber-400 text-sm"><i className="fa-solid fa-check-circle text-xs w-4 text-center" /> Already Boosted</div>}
                    {!listing.is_external && <button onClick={handleShadowbanListing} disabled={busy === "sbl"} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${listing.is_shadowbanned ? "bg-green-700 hover:bg-green-600 text-white" : "bg-purple-700 hover:bg-purple-600 text-white"}`}><i className={`fa-solid ${busy === "sbl" ? "fa-spinner fa-spin" : listing.is_shadowbanned ? "fa-eye" : "fa-ghost"} text-xs w-4 text-center`} /> {listing.is_shadowbanned ? "Un-ban Listing" : "Shadow Ban Listing"}</button>}
                    <button onClick={handleDelete} disabled={busy === "delete"} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-50"><i className={`fa-solid ${busy === "delete" ? "fa-spinner fa-spin" : "fa-trash"} text-xs w-4 text-center`} /> Delete Listing</button>
                  </div>
                </div>
              )}

              {activeTab === "user" && poster && (
                <div className="space-y-3">
                  <div className="bg-gray-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{(poster.full_name || "?")[0]?.toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{poster.full_name || "Anonymous"}</p>
                        <p className="text-xs text-gray-400">{poster.listing_count} listing{poster.listing_count !== 1 ? "s" : ""}{poster.created_at && ` \u00B7 Joined ${new Date(poster.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {poster.is_shadow_banned ? <span className="text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full font-medium"><i className="fa-solid fa-ban mr-0.5" /> Shadow-banned</span> : <span className="text-[10px] bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full font-medium"><i className="fa-solid fa-check mr-0.5" /> Active</span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">User Actions</p>
                    <button onClick={handleShadowbanUser} disabled={busy === "sbu"} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${poster.is_shadow_banned ? "bg-green-700 hover:bg-green-600 text-white" : "bg-red-700 hover:bg-red-600 text-white"}`}><i className={`fa-solid ${busy === "sbu" ? "fa-spinner fa-spin" : poster.is_shadow_banned ? "fa-user-check" : "fa-user-slash"} text-xs w-4 text-center`} /> {poster.is_shadow_banned ? "Lift User Ban" : "Shadow Ban User"}</button>
                    <a href={`/browse?user=${poster.id}`} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition"><i className="fa-solid fa-rectangle-list text-xs w-4 text-center" /> View All Listings ({poster.listing_count})</a>
                  </div>
                </div>
              )}

              {activeTab === "coupons" && (
                <div className="space-y-3">
                  <div className="bg-gray-800 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Quick Create Promo</p>
                    <input placeholder="Code (e.g. YARD50)" value={cpCode} onChange={(e) => setCpCode(e.target.value.toUpperCase())} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-amber-500 outline-none font-mono" />
                    <input placeholder="Description (optional)" value={cpDesc} onChange={(e) => setCpDesc(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-amber-500 outline-none" />
                    <div className="grid grid-cols-2 gap-2">
                      <select value={cpType} onChange={(e) => setCpType(e.target.value as "free_boost" | "percentage" | "fixed")} className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none">
                        <option value="free_boost">Free Boost</option><option value="percentage">% Off</option><option value="fixed">$ Off</option>
                      </select>
                      {cpType === "free_boost" ? (
                        <select value={cpTier} onChange={(e) => setCpTier(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none">
                          <option value="spark">Spark</option><option value="spotlight">Spotlight</option><option value="blaze">Blaze</option><option value="mega">Mega</option>
                        </select>
                      ) : (
                        <input type="number" placeholder={cpType === "percentage" ? "% value" : "$ value"} value={cpValue} onChange={(e) => setCpValue(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-xs text-white placeholder-gray-500 focus:ring-1 focus:ring-amber-500 outline-none" />
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" placeholder="Days" value={cpDays} onChange={(e) => setCpDays(e.target.value)} title="Duration days" className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-xs text-white placeholder-gray-500 focus:ring-1 focus:ring-amber-500 outline-none" />
                      <input type="number" placeholder="Max uses" value={cpMax} onChange={(e) => setCpMax(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-xs text-white placeholder-gray-500 focus:ring-1 focus:ring-amber-500 outline-none" />
                      <input type="date" value={cpExp} onChange={(e) => setCpExp(e.target.value)} title="Expiry date" className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none" />
                    </div>
                    <button onClick={createPromo} disabled={busy === "promo" || !cpCode.trim()} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition disabled:opacity-50"><i className={`fa-solid ${busy === "promo" ? "fa-spinner fa-spin" : "fa-plus"} text-xs`} /> Create Promo Code</button>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Active Codes ({promos.filter((p) => p.is_active).length})</p>
                    {promoLoading ? <div className="text-center py-4"><i className="fa-solid fa-spinner fa-spin text-gray-500" /></div> : promos.length === 0 ? <p className="text-xs text-gray-500 text-center py-4">No promo codes yet</p> : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {promos.map((p) => (
                          <div key={p.id} className={`bg-gray-800 rounded-lg p-2.5 ${!p.is_active ? "opacity-50" : ""}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold font-mono text-white">{p.code}</span>
                              <span className="text-[10px] text-gray-400">{p.discount_type === "free_boost" ? `Free ${p.boost_tier || "boost"}` : p.discount_type === "percentage" ? `${p.discount_value}% off` : `$${p.discount_value} off`}</span>
                            </div>
                            {p.description && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{p.description}</p>}
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[10px] text-gray-500">{p.uses_count}{p.max_uses ? `/${p.max_uses}` : ""} used{p.expires_at && ` \u00B7 Exp ${new Date(p.expires_at).toLocaleDateString()}`}</span>
                              <button onClick={() => togglePromo(p.id, p.is_active)} className={`text-[10px] px-2 py-0.5 rounded font-medium ${p.is_active ? "bg-red-900/40 text-red-400 hover:bg-red-900/60" : "bg-green-900/40 text-green-400 hover:bg-green-900/60"}`}>{p.is_active ? "Deactivate" : "Activate"}</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <a href="/dashboard" className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium transition"><i className="fa-solid fa-arrow-up-right-from-square text-[10px]" /> Open Full Coupon Dashboard</a>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2"><i className="fa-solid fa-book mr-1" /> General Notes</p>
                    <textarea value={generalNote} onChange={(e) => setGeneralNote(e.target.value)} placeholder="Jot down admin notes, reminders, to-dos..." rows={5} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-amber-500 outline-none resize-y" />
                    <p className="text-[10px] text-gray-600 mt-1">Auto-saved to your browser</p>
                  </div>
                  {listing && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2"><i className="fa-solid fa-thumbtack mr-1" /> Note for: {listing.title.substring(0, 30)}{listing.title.length > 30 ? "..." : ""}</p>
                      <textarea value={listingNote} onChange={(e) => setListingNote(e.target.value)} placeholder="Notes about this specific listing..." rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-amber-500 outline-none resize-y" />
                    </div>
                  )}
                  {!listing && <p className="text-xs text-gray-500 text-center italic mt-2">Navigate to a listing to add listing-specific notes</p>}
                </div>
              )}

              {activeTab === "tools" && (
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Quick Links</p>
                  <div className="space-y-2">
                    <a href="/dashboard" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition"><i className="fa-solid fa-chart-line text-xs w-4 text-center text-blue-400" /> Admin Dashboard</a>
                    <a href="/admin/bulk-import" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition"><i className="fa-solid fa-upload text-xs w-4 text-center text-green-400" /> Bulk Import</a>
                    <a href="/browse" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition"><i className="fa-solid fa-magnifying-glass text-xs w-4 text-center text-purple-400" /> Browse All Sales</a>
                    <a href="/route-planner" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition"><i className="fa-solid fa-map-location-dot text-xs w-4 text-center text-orange-400" /> Route Planner</a>
                    <a href="/messages" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition"><i className="fa-solid fa-envelope text-xs w-4 text-center text-cyan-400" /> Messages</a>
                  </div>
                  {!onListingPage && <p className="text-xs text-gray-500 mt-3 text-center italic">Navigate to a listing to see listing &amp; user actions</p>}
                </div>
              )}
            </div>
          </div>
        )}
        <button onClick={() => setExpanded(!expanded)} className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${expanded ? "bg-gray-700 hover:bg-gray-600" : "bg-amber-500 hover:bg-amber-400 hover:scale-110"}`} aria-label="Admin tools" title="Admin Toolkit">
          <i className={`fa-solid ${expanded ? "fa-xmark" : "fa-shield-halved"} text-white text-xl`} />
        </button>
      </div>
    </>
  );
}
