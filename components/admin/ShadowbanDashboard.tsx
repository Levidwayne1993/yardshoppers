"use client";

import { useState, useEffect, useCallback } from "react";

interface ShadowbannedUser {
  id: string;
  display_name: string | null;
  email: string | null;
  is_shadowbanned: boolean;
  shadowban_reason: string | null;
  shadowbanned_at: string | null;
  listing_count?: number;
}

interface SearchUser {
  id: string;
  display_name: string | null;
  email: string | null;
  is_shadowbanned: boolean;
  shadowbanned_at: string | null;
}

export default function ShadowbanDashboard() {
  const [shadowbanned, setShadowbanned] = useState<ShadowbannedUser[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchShadowbanned = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shadowban");
      const data = await res.json();
      if (res.ok) setShadowbanned(data.shadowbanned || []);
    } catch (err) {
      console.error("Failed to fetch shadowbanned users", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchShadowbanned();
  }, [fetchShadowbanned]);

  const handleSearch = async () => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/shadowban?search=${encodeURIComponent(search.trim())}`);
      const data = await res.json();
      if (res.ok) setSearchResults(data.users || []);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim()) handleSearch();
      else setSearchResults([]);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleShadowban = async (userId: string) => {
    setActionLoading(userId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/shadowban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, reason: reason || "Spam / policy violation" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `User shadowbanned. ${data.listings_hidden} listing(s) hidden.` });
        setReason("");
        setSearch("");
        setSearchResults([]);
        fetchShadowbanned();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to shadowban" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
    setActionLoading(null);
  };

  const handleUnshadowban = async (userId: string) => {
    setActionLoading(userId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/shadowban", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `Shadowban removed. ${data.listings_restored} listing(s) restored.` });
        fetchShadowbanned();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to remove shadowban" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
    setActionLoading(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            <i className="fa-solid fa-ghost mr-2 text-ys-600"></i>Shadowban Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Silently hide spammer posts without alerting them. Shadowbanned users see their own posts, but no one else can.
          </p>
        </div>
        <div className="bg-red-50 px-4 py-2 rounded-xl">
          <span className="text-sm font-semibold text-red-700">
            <i className="fa-solid fa-ban mr-1"></i>{shadowbanned.length} banned
          </span>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          <i className={`fa-solid ${message.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"} mr-2`}></i>
          {message.text}
        </div>
      )}

      {/* Search & Ban Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          <i className="fa-solid fa-magnifying-glass mr-2"></i>Search Users to Shadowban
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-ys-500 outline-none"
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-64 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-ys-500 outline-none"
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-ys-100 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-user text-ys-600 text-xs"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.display_name || "No name"}</p>
                    <p className="text-xs text-gray-500">{user.email || "No email"}</p>
                  </div>
                  {user.is_shadowbanned && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      <i className="fa-solid fa-ghost mr-1"></i>Shadowbanned
                    </span>
                  )}
                </div>
                {!user.is_shadowbanned ? (
                  <button
                    onClick={() => handleShadowban(user.id)}
                    disabled={actionLoading === user.id}
                    className="px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === user.id ? (
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                      <><i className="fa-solid fa-ghost mr-1"></i>Shadowban</>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnshadowban(user.id)}
                    disabled={actionLoading === user.id}
                    className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === user.id ? (
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                      <><i className="fa-solid fa-sun mr-1"></i>Remove Ban</>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {search.trim() && searchResults.length === 0 && (
          <p className="mt-4 text-sm text-gray-400 text-center py-4">No users found matching &ldquo;{search}&rdquo;</p>
        )}
      </div>

      {/* Currently Shadowbanned */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          <i className="fa-solid fa-list mr-2"></i>Currently Shadowbanned ({shadowbanned.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <i className="fa-solid fa-spinner fa-spin text-2xl text-ys-600"></i>
          </div>
        ) : shadowbanned.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-shield-check text-4xl text-green-400 mb-3"></i>
            <p className="text-sm text-gray-500">No shadowbanned users. Community is clean!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shadowbanned.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl border border-red-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-ghost text-red-600"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.display_name || "No name"}</p>
                    <p className="text-xs text-gray-500">{user.email || "No email"}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-red-600">
                        <i className="fa-solid fa-clock mr-1"></i>Banned {formatDate(user.shadowbanned_at)}
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-500">
                        <i className="fa-solid fa-box mr-1"></i>{user.listing_count || 0} listing(s)
                      </span>
                      {user.shadowban_reason && (
                        <>
                          <span className="text-xs text-gray-400">|</span>
                          <span className="text-xs text-orange-600">
                            <i className="fa-solid fa-comment mr-1"></i>{user.shadowban_reason}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleUnshadowban(user.id)}
                  disabled={actionLoading === user.id}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === user.id ? (
                    <i className="fa-solid fa-spinner fa-spin"></i>
                  ) : (
                    <><i className="fa-solid fa-sun mr-1"></i>Remove Ban</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
