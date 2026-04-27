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

export default function AdminFloatingBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [isAdmin, setIsAdmin] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [listing, setListing] = useState<ListingCtx | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        setIsAdmin(true);
      }
    });
  }, []);

  // Detect if we're on a listing page and fetch context
  useEffect(() => {
    const m = pathname.match(/^\/listing\/(.+)$/);
    if (m) fetchCtx(m[1]);
    else setListing(null);
  }, [pathname]);

  const fetchCtx = async (id: string) => {
    // Try internal listings first
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
      return;
    }

    // Try external_sales
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
    }
  };

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleBoost = async () => {
    if (!listing || listing.is_external) return;
    setBusy("boost");
    try {
      const res = await fetch("/api/admin/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setListing((p) => (p ? { ...p, is_boosted: true } : null));
        flash("\u2705 Boosted! Owner notified in their inbox.");
      } else {
        flash("\u274c " + data.error);
      }
    } catch {
      flash("\u274c Failed to boost");
    }
    setBusy(null);
  };

  const handleShadowban = async () => {
    if (!listing || listing.is_external) return;
    setBusy("shadow");
    const next = !listing.is_shadowbanned;
    try {
      const res = await fetch("/api/admin/shadowban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, shadowban: next }),
      });
      if (res.ok) {
        setListing((p) => (p ? { ...p, is_shadowbanned: next } : null));
        flash(next ? "\uD83D\uDC7B Shadowbanned" : "\u2705 Unshadowbanned");
      }
    } catch {
      flash("\u274c Failed");
    }
    setBusy(null);
  };

  const handleDelete = async () => {
    if (!listing) return;
    const msg = `Delete "${listing.title}"? This cannot be undone.`;
    if (!confirm(msg)) return;
    setBusy("delete");
    try {
      const res = await fetch("/api/admin/delete-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          isExternal: listing.is_external,
        }),
      });
      if (res.ok) {
        flash("\uD83D\uDDD1\uFE0F Deleted");
        setTimeout(() => router.push("/browse"), 1000);
      }
    } catch {
      flash("\u274c Failed to delete");
    }
    setBusy(null);
  };

  if (!isAdmin) return null;

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-bounce">
          {toast}
        </div>
      )}

      {/* Floating button + panel */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[60]">
        {expanded && (
          <div className="mb-3 bg-gray-900 text-white rounded-2xl shadow-2xl p-4 w-72 space-y-2 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                <i className="fa-solid fa-shield-halved mr-1" />
                Admin Tools
              </span>
              <button
                onClick={() => setExpanded(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            {listing ? (
              <>
                <p className="text-xs text-gray-400 truncate mb-2">
                  {listing.is_external ? "\uD83D\uDCE5 External" : "\uD83D\uDCDD User-posted"}:{" "}
                  {listing.title}
                </p>

                {/* Boost (internal only) */}
                {!listing.is_external && !listing.is_boosted && (
                  <button
                    onClick={handleBoost}
                    disabled={busy === "boost"}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition disabled:opacity-50"
                  >
                    <i
                      className={`fa-solid ${busy === "boost" ? "fa-spinner fa-spin" : "fa-rocket"} text-xs`}
                    />
                    Free Boost + Notify
                  </button>
                )}
                {!listing.is_external && listing.is_boosted && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-900/30 text-amber-400 text-sm">
                    <i className="fa-solid fa-check-circle text-xs" />
                    Already Boosted
                  </div>
                )}

                {/* Shadowban (internal only) */}
                {!listing.is_external && (
                  <button
                    onClick={handleShadowban}
                    disabled={busy === "shadow"}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                      listing.is_shadowbanned
                        ? "bg-green-700 hover:bg-green-600 text-white"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    }`}
                  >
                    <i
                      className={`fa-solid ${busy === "shadow" ? "fa-spinner fa-spin" : "fa-ghost"} text-xs`}
                    />
                    {listing.is_shadowbanned ? "Remove Shadowban" : "Shadowban"}
                  </button>
                )}

                {/* Delete (both internal + external) */}
                <button
                  onClick={handleDelete}
                  disabled={busy === "delete"}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-50"
                >
                  <i
                    className={`fa-solid ${busy === "delete" ? "fa-spinner fa-spin" : "fa-trash"} text-xs`}
                  />
                  Delete Listing
                </button>
              </>
            ) : (
              <p className="text-xs text-gray-400 py-2">
                Navigate to a listing to see context actions here.
              </p>
            )}

            {/* Always-available links */}
            <div className="border-t border-gray-700 pt-2 mt-1 space-y-2">
              <a
                href="/admin/bulk-import"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition"
              >
                <i className="fa-solid fa-upload text-xs" />
                Bulk Import
              </a>
              <a
                href="/browse"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition"
              >
                <i className="fa-solid fa-magnifying-glass text-xs" />
                Browse All
              </a>
            </div>
          </div>
        )}

        {/* FAB button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
            expanded
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-amber-500 hover:bg-amber-400 hover:scale-110"
          }`}
          aria-label="Admin tools"
          title="Admin tools"
        >
          <i
            className={`fa-solid ${expanded ? "fa-xmark" : "fa-shield-halved"} text-white text-lg`}
          />
        </button>
      </div>
    </>
  );
}
