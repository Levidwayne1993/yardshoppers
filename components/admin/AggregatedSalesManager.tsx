"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

// ── Keywords that indicate a real yard / garage / estate sale ──
const YARD_SALE_KEYWORDS = [
  "yard sale", "yardsale", "garage sale", "garagesale",
  "estate sale", "estatesale", "moving sale", "movingsale",
  "rummage sale", "rummagesale", "tag sale", "tagsale",
  "barn sale", "barnsale", "patio sale", "patiosale",
  "lawn sale", "lawnsale", "stoop sale", "stoopsale",
  "block sale", "blocksale", "carport sale", "carportsale",
  "multi-family", "multifamily", "multi family",
  "downsizing", "cleanout", "clean out", "declutter",
  "household items", "everything must go",
  "yard", "garage", "estate",
];

function looksLikeYardSale(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return YARD_SALE_KEYWORDS.some((kw) => text.includes(kw));
}

interface ExternalSale {
  id: string;
  source: string;
  source_url: string | null;
  title: string;
  description: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  price: string | null;
  sale_date: string | null;
  address: string | null;
  photo_urls: string[] | null;
  categories: string[] | null;
  category: string | null;
  collected_at: string;
  expires_at: string | null;
}

type FilterMode = "all" | "no-address" | "not-yard-sale" | "no-address-and-not-yard-sale";

const PAGE_SIZE = 50;

export default function AggregatedSalesManager() {
  const [sales, setSales] = useState<ExternalSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");

  // Pagination
  const [page, setPage] = useState(0);

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [saving, setSaving] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // ── Fetch all external sales ──
  useEffect(() => {
    async function fetchSales() {
      setLoading(true);

      const { count } = await supabase
        .from("external_sales")
        .select("*", { count: "exact", head: true });

      setTotalCount(count || 0);

      const { data, error } = await supabase
        .from("external_sales")
        .select("*")
        .order("collected_at", { ascending: false })
        .range(0, 9999);

      if (error) {
        console.error("Failed to fetch external sales:", error);
      }

      setSales(data || []);
      setLoading(false);
    }
    fetchSales();
  }, []);

  // ── Derived stats ──
  const stats = useMemo(() => {
    const noAddress = sales.filter(
      (s) => !s.address && (!s.latitude || !s.longitude)
    ).length;
    const notYardSale = sales.filter(
      (s) => !looksLikeYardSale(s.title || "", s.description || "")
    ).length;
    const noAddressAndNotYardSale = sales.filter(
      (s) =>
        !s.address &&
        (!s.latitude || !s.longitude) &&
        !looksLikeYardSale(s.title || "", s.description || "")
    ).length;
    return { total: sales.length, noAddress, notYardSale, noAddressAndNotYardSale };
  }, [sales]);

  // ── State/source maps for dropdowns ──
  const stateMap = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      const st = (s.state || "Unknown").toUpperCase().trim();
      map[st] = (map[st] || 0) + 1;
    });
    return map;
  }, [sales]);

  const sourceMap = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      const src = s.source || "Unknown";
      map[src] = (map[src] || 0) + 1;
    });
    return map;
  }, [sales]);

  // ── Apply all filters ──
  const filteredSales = useMemo(() => {
    let result = sales;

    // Filter mode
    if (filterMode === "no-address") {
      result = result.filter(
        (s) => !s.address && (!s.latitude || !s.longitude)
      );
    } else if (filterMode === "not-yard-sale") {
      result = result.filter(
        (s) => !looksLikeYardSale(s.title || "", s.description || "")
      );
    } else if (filterMode === "no-address-and-not-yard-sale") {
      result = result.filter(
        (s) =>
          !s.address &&
          (!s.latitude || !s.longitude) &&
          !looksLikeYardSale(s.title || "", s.description || "")
      );
    }

    // State filter
    if (selectedState !== "all") {
      result = result.filter(
        (s) => (s.state || "Unknown").toUpperCase().trim() === selectedState
      );
    }

    // Source filter
    if (selectedSource !== "all") {
      result = result.filter((s) => (s.source || "Unknown") === selectedSource);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          (s.title || "").toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q) ||
          (s.city || "").toLowerCase().includes(q) ||
          (s.address || "").toLowerCase().includes(q) ||
          (s.source || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [sales, filterMode, selectedState, selectedSource, searchQuery]);

  // ── Paginated slice ──
  const paginatedSales = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredSales.slice(start, start + PAGE_SIZE);
  }, [filteredSales, page]);

  const totalPages = Math.ceil(filteredSales.length / PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
    setSelectedIds(new Set());
  }, [filterMode, selectedState, selectedSource, searchQuery]);

  // ── Start editing ──
  function startEdit(sale: ExternalSale) {
    setEditingId(sale.id);
    setEditTitle(sale.title || "");
    setEditDescription(sale.description || "");
    setEditAddress(sale.address || "");
    setEditCity(sale.city || "");
    setEditState(sale.state || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditAddress("");
    setEditCity("");
    setEditState("");
  }

  // ── Save edit ──
  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);

    const updates: any = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      address: editAddress.trim() || null,
      city: editCity.trim() || null,
      state: editState.trim().toUpperCase() || null,
    };

    // If address was added, try to geocode it
    if (editAddress.trim() && editCity.trim()) {
      try {
        const geoRes = await fetch(
          `/api/geocode?address=${encodeURIComponent(
            `${editAddress.trim()}, ${editCity.trim()}, ${editState.trim()}`
          )}`
        );
        const geoData = await geoRes.json();
        if (geoData.lat && geoData.lng) {
          updates.latitude = geoData.lat;
          updates.longitude = geoData.lng;
        }
      } catch {
        // Geocoding failed, still save other fields
      }
    }

    const { error } = await supabase
      .from("external_sales")
      .update(updates)
      .eq("id", editingId);

    if (error) {
      alert("Failed to save: " + error.message);
    } else {
      // Update local state
      setSales((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...s, ...updates }
            : s
        )
      );
      cancelEdit();
    }

    setSaving(false);
  }

  // ── Bulk delete ──
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(paginatedSales.map((s) => s.id)));
  }

  function selectAllFiltered() {
    setSelectedIds(new Set(filteredSales.map((s) => s.id)));
  }

  async function executeBulkDelete() {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);

    const ids = Array.from(selectedIds);
    // Delete in batches of 100
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const { error } = await supabase
        .from("external_sales")
        .delete()
        .in("id", batch);
      if (error) {
        alert(`Delete failed at batch ${i}: ${error.message}`);
        break;
      }
    }

    setSales((prev) => prev.filter((s) => !selectedIds.has(s.id)));
    setSelectedIds(new Set());
    setDeleteConfirm(false);
    setIsDeleting(false);
  }

  // ── Single delete ──
  async function deleteSingle(id: string) {
    const confirmed = confirm("Delete this aggregated listing? This cannot be undone.");
    if (!confirmed) return;

    const { error } = await supabase
      .from("external_sales")
      .delete()
      .eq("id", id);

    if (!error) {
      setSales((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) cancelEdit();
    } else {
      alert("Delete failed: " + error.message);
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-gray-500">
          <i className="fa-solid fa-spinner fa-spin" />
          Loading aggregated sales...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setFilterMode("all")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterMode === "all"
              ? "bg-ys-50 border-ys-300 ring-2 ring-ys-200"
              : "bg-white border-gray-100 hover:border-ys-200"
          }`}
        >
          <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
          <p className="text-xs font-semibold text-gray-500 mt-1">Total Aggregated</p>
        </button>
        <button
          onClick={() => setFilterMode("no-address")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterMode === "no-address"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-200"
              : "bg-white border-gray-100 hover:border-amber-200"
          }`}
        >
          <p className="text-2xl font-bold text-amber-600">{stats.noAddress.toLocaleString()}</p>
          <p className="text-xs font-semibold text-gray-500 mt-1">Missing Address</p>
        </button>
        <button
          onClick={() => setFilterMode("not-yard-sale")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterMode === "not-yard-sale"
              ? "bg-red-50 border-red-300 ring-2 ring-red-200"
              : "bg-white border-gray-100 hover:border-red-200"
          }`}
        >
          <p className="text-2xl font-bold text-red-600">{stats.notYardSale.toLocaleString()}</p>
          <p className="text-xs font-semibold text-gray-500 mt-1">Not a Yard Sale</p>
        </button>
        <button
          onClick={() => setFilterMode("no-address-and-not-yard-sale")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterMode === "no-address-and-not-yard-sale"
              ? "bg-purple-50 border-purple-300 ring-2 ring-purple-200"
              : "bg-white border-gray-100 hover:border-purple-200"
          }`}
        >
          <p className="text-2xl font-bold text-purple-600">{stats.noAddressAndNotYardSale.toLocaleString()}</p>
          <p className="text-xs font-semibold text-gray-500 mt-1">Both Issues</p>
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, description, city, address, source..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300 focus:border-ys-400 transition"
            />
          </div>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-ys-300 min-w-[150px]"
          >
            <option value="all">All States ({stats.total})</option>
            {Object.entries(stateMap)
              .sort((a, b) => b[1] - a[1])
              .map(([st, count]) => (
                <option key={st} value={st}>
                  {st} ({count})
                </option>
              ))}
          </select>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-ys-300 min-w-[150px]"
          >
            <option value="all">All Sources</option>
            {Object.entries(sourceMap)
              .sort((a, b) => b[1] - a[1])
              .map(([src, count]) => (
                <option key={src} value={src}>
                  {src} ({count})
                </option>
              ))}
          </select>
        </div>

        {/* Active filter summary */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing <span className="font-bold text-gray-700">{filteredSales.length.toLocaleString()}</span> of {stats.total.toLocaleString()} aggregated listings
            {filterMode !== "all" && (
              <span className={`ml-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                filterMode === "no-address"
                  ? "bg-amber-50 text-amber-700"
                  : filterMode === "not-yard-sale"
                  ? "bg-red-50 text-red-700"
                  : "bg-purple-50 text-purple-700"
              }`}>
                {filterMode === "no-address" && "Missing Address"}
                {filterMode === "not-yard-sale" && "Not Yard Sale"}
                {filterMode === "no-address-and-not-yard-sale" && "Both Issues"}
              </span>
            )}
          </p>
          <button
            onClick={() => {
              setFilterMode("all");
              setSelectedState("all");
              setSelectedSource("all");
              setSearchQuery("");
            }}
            className="text-sm text-ys-700 hover:text-ys-900 font-semibold transition"
          >
            <i className="fa-solid fa-xmark mr-1 text-xs" />
            Reset
          </button>
        </div>
      </div>

      {/* ── Bulk Actions ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={selectAllVisible}
            className="flex items-center gap-1.5 px-3 py-2 bg-ys-50 hover:bg-ys-100 text-ys-800 rounded-xl text-xs font-semibold transition"
          >
            <i className="fa-regular fa-square-check text-xs" />
            Select Page ({paginatedSales.length})
          </button>
          <button
            onClick={selectAllFiltered}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold transition"
          >
            <i className="fa-solid fa-check-double text-xs" />
            Select All Filtered ({filteredSales.length})
          </button>
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
              >
                <i className="fa-regular fa-square text-xs" />
                Deselect All
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition"
              >
                <i className="fa-solid fa-trash text-[10px]" />
                Delete Selected ({selectedIds.size})
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-trash text-red-500 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Bulk Delete</h3>
              <p className="text-sm text-gray-500 mt-1">
                You are about to permanently delete{" "}
                <span className="font-bold text-red-600">{selectedIds.size}</span> aggregated listings.
                This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin text-xs" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-trash text-xs" />
                    Delete {selectedIds.size}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Listings Table ── */}
      {filteredSales.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-database text-2xl text-gray-300" />
          </div>
          <p className="text-gray-500">No aggregated listings match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedSales.map((sale) => {
            const isEditing = editingId === sale.id;
            const hasAddress = !!sale.address || (!!sale.latitude && !!sale.longitude);
            const isYardSale = looksLikeYardSale(sale.title || "", sale.description || "");
            const isSelected = selectedIds.has(sale.id);

            return (
              <div
                key={sale.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                  isSelected
                    ? "border-red-400 ring-2 ring-red-200"
                    : !hasAddress && !isYardSale
                    ? "border-purple-200"
                    : !hasAddress
                    ? "border-amber-200"
                    : !isYardSale
                    ? "border-red-200"
                    : "border-gray-100"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Select checkbox */}
                    <button
                      onClick={() => toggleSelect(sale.id)}
                      className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                        isSelected
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                    >
                      {isSelected && <i className="fa-solid fa-check text-xs" />}
                    </button>

                    {/* Photo thumbnail */}
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {sale.photo_urls && sale.photo_urls.length > 0 ? (
                        <img
                          src={sale.photo_urls[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="fa-solid fa-image text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        /* ── Edit Mode ── */
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Title</label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300 resize-none"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">Address</label>
                              <input
                                type="text"
                                value={editAddress}
                                onChange={(e) => setEditAddress(e.target.value)}
                                placeholder="123 Main St"
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">City</label>
                              <input
                                type="text"
                                value={editCity}
                                onChange={(e) => setEditCity(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">State</label>
                              <input
                                type="text"
                                value={editState}
                                onChange={(e) => setEditState(e.target.value)}
                                maxLength={2}
                                placeholder="WA"
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="flex items-center gap-2 px-4 py-2 bg-ys-700 hover:bg-ys-800 text-white rounded-xl text-sm font-bold transition"
                            >
                              {saving ? (
                                <i className="fa-solid fa-spinner fa-spin text-xs" />
                              ) : (
                                <i className="fa-solid fa-check text-xs" />
                              )}
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── View Mode ── */
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-sm truncate max-w-md">
                              {sale.title || "Untitled"}
                            </h3>
                            {/* Status badges */}
                            {!hasAddress && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <i className="fa-solid fa-location-crosshairs text-[8px]" />
                                No Address
                              </span>
                            )}
                            {!isYardSale && (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <i className="fa-solid fa-triangle-exclamation text-[8px]" />
                                Not Yard Sale
                              </span>
                            )}
                          </div>

                          {sale.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {sale.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                            {sale.city && (
                              <span className="flex items-center gap-1">
                                <i className="fa-solid fa-location-dot text-[10px]" />
                                {sale.city}{sale.state ? `, ${sale.state}` : ""}
                              </span>
                            )}
                            {sale.address && (
                              <span className="flex items-center gap-1">
                                <i className="fa-solid fa-house text-[10px]" />
                                {sale.address}
                              </span>
                            )}
                            {sale.source && (
                              <span className="flex items-center gap-1">
                                <i className="fa-solid fa-globe text-[10px]" />
                                {sale.source}
                              </span>
                            )}
                            {sale.sale_date && (
                              <span className="flex items-center gap-1">
                                <i className="fa-regular fa-calendar text-[10px]" />
                                {sale.sale_date}
                              </span>
                            )}
                            {sale.source_url && (
                              <a
                                href={sale.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-ys-600 hover:text-ys-800 transition"
                              >
                                <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
                                Source
                              </a>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action buttons (view mode only) */}
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => startEdit(sale)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-ys-50 text-gray-400 hover:text-ys-700 rounded-lg transition"
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen text-xs" />
                        </button>
                        <button
                          onClick={() => deleteSingle(sale.id)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition"
                          title="Delete"
                        >
                          <i className="fa-solid fa-trash text-xs" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              page === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <i className="fa-solid fa-chevron-left text-xs mr-1" />
            Previous
          </button>
          <span className="text-sm text-gray-500 px-3">
            Page <span className="font-bold text-gray-700">{page + 1}</span> of{" "}
            <span className="font-bold text-gray-700">{totalPages}</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              page >= totalPages - 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Next
            <i className="fa-solid fa-chevron-right text-xs ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
