'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ── Shared date-filter helper (import in pages) ── */
export function matchesDateFilter(saleDate: string | null | undefined, filter: string): boolean {
  if (!filter) return true;
  if (!saleDate) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sale = new Date(saleDate + 'T00:00:00');

  switch (filter) {
    case 'today':
      return sale.getTime() === today.getTime();
    case 'tomorrow': {
      const tmrw = new Date(today);
      tmrw.setDate(tmrw.getDate() + 1);
      return sale.getTime() === tmrw.getTime();
    }
    case 'weekend': {
      const d = today.getDay();
      const sat = new Date(today);
      const sun = new Date(today);
      if (d === 0) {
        sun.setTime(today.getTime());
        sat.setDate(today.getDate() - 1);
      } else {
        sat.setDate(today.getDate() + (6 - d));
        sun.setDate(sat.getDate() + 1);
      }
      return sale.getTime() === sat.getTime() || sale.getTime() === sun.getTime();
    }
    case 'week': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return sale >= startOfWeek && sale <= endOfWeek;
    }
    default:
      return true;
  }
}

/* ── Options ── */
const CATEGORY_OPTIONS = [
  { name: 'All Categories', icon: 'fa-border-all', value: '' },
  { name: 'Furniture', icon: 'fa-couch', value: 'Furniture' },
  { name: 'Electronics', icon: 'fa-laptop', value: 'Electronics' },
  { name: 'Clothing', icon: 'fa-shirt', value: 'Clothing' },
  { name: 'Toys & Games', icon: 'fa-gamepad', value: 'Toys & Games' },
  { name: 'Tools', icon: 'fa-wrench', value: 'Tools' },
  { name: 'Kitchen', icon: 'fa-utensils', value: 'Kitchen' },
  { name: 'Sports', icon: 'fa-futbol', value: 'Sports' },
  { name: 'Books', icon: 'fa-book', value: 'Books' },
  { name: 'Antiques', icon: 'fa-gem', value: 'Antiques' },
  { name: 'Garden', icon: 'fa-leaf', value: 'Garden' },
  { name: 'Baby & Kids', icon: 'fa-baby-carriage', value: 'Baby & Kids' },
  { name: 'Vehicles', icon: 'fa-car', value: 'Vehicles' },
  { name: 'Free Stuff', icon: 'fa-gift', value: 'Free Stuff' },
];

const DATE_OPTIONS = [
  { label: 'All Dates', value: '', icon: 'fa-calendar' },
  { label: 'Today', value: 'today', icon: 'fa-calendar-day' },
  { label: 'Tomorrow', value: 'tomorrow', icon: 'fa-calendar-plus' },
  { label: 'This Weekend', value: 'weekend', icon: 'fa-calendar-week' },
  { label: 'This Week', value: 'week', icon: 'fa-calendar-days' },
];

const DISTANCE_OPTIONS: { label: string; value: number | null }[] = [
  { label: '5 mi', value: 5 },
  { label: '10 mi', value: 10 },
  { label: '25 mi', value: 25 },
  { label: '50 mi', value: 50 },
  { label: '100 mi', value: 100 },
  { label: 'Any', value: null },
];

/* ── Props ── */
interface FilterSidebarProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedDistance: number | null;
  onDistanceChange: (d: number | null) => void;
  selectedDate: string;
  onDateChange: (d: string) => void;
  city: string;
  region: string;
  onRequestLocation: () => void;
  isLoggedIn: boolean;
}

/* ── Component ── */
export default function FilterSidebar({
  selectedCategory,
  onCategoryChange,
  selectedDistance,
  onDistanceChange,
  selectedDate,
  onDateChange,
  city,
  region,
  onRequestLocation,
  isLoggedIn,
}: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const locationLabel =
    city && region
      ? `${city}, ${region}`
      : city || region || 'Detecting location...';

  /* ── Reusable filter panel ── */
  const sidebarContent = (
    <div className="space-y-0.5">
      {/* ▸ Location */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Location
          </h3>
          {/* A11Y FIX: aria-label on icon-text button */}
          <button
            onClick={() => {
              onRequestLocation();
              setMobileOpen(false);
            }}
            aria-label="Update your location"
            className="text-xs text-green-700 hover:text-green-800 font-semibold flex items-center gap-1"
          >
            <i className="fa-solid fa-location-crosshairs text-[10px]" aria-hidden="true" />
            Update
          </button>
        </div>
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-100 rounded-xl px-3.5 py-2.5">
          <i className="fa-solid fa-location-dot text-green-600 text-sm" aria-hidden="true" />
          <span className="text-sm font-semibold text-green-800 truncate">
            {locationLabel}
          </span>
        </div>
      </div>

      <hr className="border-gray-100 mx-4" />

      {/* ▸ Distance */}
      <div className="px-4 py-3">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
          Radius
        </h3>
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Search radius">
          {DISTANCE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onDistanceChange(opt.value)}
              aria-pressed={selectedDistance === opt.value}
              className={`text-xs font-semibold px-2 py-2 rounded-lg transition-all ${
                selectedDistance === opt.value
                  ? 'bg-green-600 text-white shadow-sm ring-1 ring-green-700'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 ring-1 ring-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-100 mx-4" />

      {/* ▸ Date */}
      <div className="px-4 py-3">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
          Date
        </h3>
        <div className="space-y-0.5" role="group" aria-label="Date filter">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onDateChange(opt.value);
                setMobileOpen(false);
              }}
              aria-pressed={selectedDate === opt.value}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all ${
                selectedDate === opt.value
                  ? 'bg-green-50 text-green-700 font-bold ring-1 ring-green-200'
                  : 'text-gray-700 hover:bg-gray-50 font-medium'
              }`}
            >
              <i
                className={`fa-regular ${opt.icon} w-4 text-center text-sm ${
                  selectedDate === opt.value ? 'text-green-600' : 'text-gray-400'
                }`}
                aria-hidden="true"
              />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-100 mx-4" />

      {/* ▸ Categories */}
      <div className="px-4 py-3">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
          Categories
        </h3>
        <div className="space-y-0.5" role="group" aria-label="Category filter">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                onCategoryChange(cat.value);
                setMobileOpen(false);
              }}
              aria-pressed={selectedCategory === cat.value}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all ${
                selectedCategory === cat.value
                  ? 'bg-green-50 text-green-700 font-bold ring-1 ring-green-200'
                  : 'text-gray-700 hover:bg-gray-50 font-medium'
              }`}
            >
              <i
                className={`fa-solid ${cat.icon} w-4 text-center text-sm ${
                  selectedCategory === cat.value ? 'text-green-600' : 'text-gray-400'
                }`}
                aria-hidden="true"
              />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-100 mx-4" />

      {/* ▸ Quick Links */}
      <div className="px-4 py-3 pb-6">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
          Quick Links
        </h3>
        <div className="space-y-0.5">
          <Link
            href="/route-planner"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-gray-700 hover:bg-gray-50 font-medium transition-all"
          >
            <i className="fa-solid fa-route w-4 text-center text-sm text-gray-400" aria-hidden="true" />
            Route Planner
          </Link>
          {isLoggedIn && (
            <>
              <Link
                href="/saved"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-gray-700 hover:bg-gray-50 font-medium transition-all"
              >
                <i className="fa-solid fa-heart w-4 text-center text-sm text-gray-400" aria-hidden="true" />
                Saved Sales
              </Link>
              <Link
                href="/post"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-gray-700 hover:bg-gray-50 font-medium transition-all"
              >
                <i className="fa-solid fa-plus-circle w-4 text-center text-sm text-gray-400" aria-hidden="true" />
                Post a Sale
              </Link>
              <Link
                href="/messages"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-gray-700 hover:bg-gray-50 font-medium transition-all"
              >
                <i className="fa-solid fa-envelope w-4 text-center text-sm text-gray-400" aria-hidden="true" />
                Messages
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      {/* A11Y FIX: aria-label on aside landmark */}
      <aside className="hidden lg:block w-[260px] flex-shrink-0" aria-label="Filters">
        <div className="sticky top-[80px] bg-white rounded-2xl border border-gray-200/80 shadow-sm max-h-[calc(100vh-100px)] overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>

      {/* ===== MOBILE FILTER FAB ===== */}
      {/* A11Y FIX: aria-label on FAB */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open filters"
        className="lg:hidden fixed bottom-20 left-4 z-40 bg-green-600 text-white pl-3.5 pr-4 py-2.5 rounded-full shadow-lg shadow-green-600/30 flex items-center gap-2 text-sm font-bold hover:bg-green-700 active:scale-95 transition-all"
      >
        <i className="fa-solid fa-sliders" aria-hidden="true" />
        Filters
      </button>

      {/* ===== MOBILE DRAWER ===== */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Filter options"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-[300px] max-w-[85vw] bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
              <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <i className="fa-solid fa-sliders text-green-600" aria-hidden="true" />
                Filters
              </h2>
              {/* A11Y FIX: aria-label on close button */}
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close filters"
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <i className="fa-solid fa-xmark text-sm" aria-hidden="true" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
