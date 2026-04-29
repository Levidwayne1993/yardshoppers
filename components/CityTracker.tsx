'use client';

import { useState, useEffect, useMemo } from 'react';
import { cities } from '@/lib/cities';
import { OUTREACH_CATEGORIES } from '@/lib/outreach-templates';

const STORAGE_KEY = 'yardshoppers_outreach_tracker';

type CheckedState = Record<string, Record<string, boolean>>;

export default function CityTracker() {
  const [selectedCategory, setSelectedCategory] = useState(OUTREACH_CATEGORIES[0].id);
  const [checked, setChecked] = useState<CheckedState>({});
  const [search, setSearch] = useState('');
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(JSON.parse(saved));
    } catch {}
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {}
  }, [checked]);

  // Group cities by state
  const stateGroups = useMemo(() => {
    const groups: Record<string, { name: string; code: string; cities: { slug: string; name: string }[] }> = {};
    for (const city of cities) {
      if (!groups[city.stateCode]) {
        groups[city.stateCode] = { name: city.state, code: city.stateCode, cities: [] };
      }
      groups[city.stateCode].cities.push({ slug: city.slug, name: city.name });
    }
    // Sort states alphabetically
    const sorted = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    // Sort cities within each state
    sorted.forEach(s => s.cities.sort((a, b) => a.name.localeCompare(b.name)));
    return sorted;
  }, []);

  const totalCities = cities.length;

  // Count completed for selected category
  const completedCount = useMemo(() => {
    const catData = checked[selectedCategory] || {};
    return Object.values(catData).filter(Boolean).length;
  }, [checked, selectedCategory]);

  // Overall progress across ALL categories
  const overallProgress = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const cat of OUTREACH_CATEGORIES) {
      total += totalCities;
      const catData = checked[cat.id] || {};
      done += Object.values(catData).filter(Boolean).length;
    }
    return { total, done };
  }, [checked, totalCities]);

  // Filter states/cities by search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return stateGroups;
    const q = search.toLowerCase();
    return stateGroups
      .map(state => ({
        ...state,
        cities: state.cities.filter(
          c => c.name.toLowerCase().includes(q) || state.name.toLowerCase().includes(q)
        ),
      }))
      .filter(state => state.cities.length > 0);
  }, [stateGroups, search]);

  const toggleCity = (slug: string) => {
    setChecked(prev => ({
      ...prev,
      [selectedCategory]: {
        ...prev[selectedCategory],
        [slug]: !prev[selectedCategory]?.[slug],
      },
    }));
  };

  const toggleState = (stateCode: string) => {
    setExpandedStates(prev => ({ ...prev, [stateCode]: !prev[stateCode] }));
  };

  const checkAllInState = (stateCities: { slug: string }[]) => {
    setChecked(prev => {
      const catData = { ...prev[selectedCategory] };
      stateCities.forEach(c => (catData[c.slug] = true));
      return { ...prev, [selectedCategory]: catData };
    });
  };

  const uncheckAllInState = (stateCities: { slug: string }[]) => {
    setChecked(prev => {
      const catData = { ...prev[selectedCategory] };
      stateCities.forEach(c => (catData[c.slug] = false));
      return { ...prev, [selectedCategory]: catData };
    });
  };

  const getStateProgress = (stateCities: { slug: string }[]) => {
    const catData = checked[selectedCategory] || {};
    const done = stateCities.filter(c => catData[c.slug]).length;
    return { done, total: stateCities.length };
  };

  const getCategoryCount = (catId: string) => {
    const catData = checked[catId] || {};
    return Object.values(catData).filter(Boolean).length;
  };

  if (collapsed) {
    return (
      <div className="shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="w-10 h-10 bg-[#2D6A4F] text-white rounded-xl flex items-center justify-center hover:bg-[#1B4332] transition shadow-md"
          title="Open City Tracker"
        >
          📋
        </button>
      </div>
    );
  }

  const pct = totalCities > 0 ? Math.round((completedCount / totalCities) * 100) : 0;

  return (
    <div className="shrink-0 w-[320px] bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col max-h-[calc(100vh-6rem)] sticky top-8">
      {/* Header */}
      <div className="px-4 py-3 bg-[#1B4332] text-white">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold flex items-center gap-1.5">📋 City Tracker</h2>
          <button
            onClick={() => setCollapsed(true)}
            className="text-white/60 hover:text-white text-lg leading-none"
            title="Collapse"
          >
            ✕
          </button>
        </div>
        <div className="text-[10px] text-white/60">
          Overall: {overallProgress.done.toLocaleString()} / {overallProgress.total.toLocaleString()} across {OUTREACH_CATEGORIES.length} categories
        </div>
      </div>

      {/* Category Selector */}
      <div className="px-3 py-2 border-b bg-gray-50">
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-300 focus:border-green-400 outline-none"
        >
          {OUTREACH_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.label} ({getCategoryCount(cat.id)}/{totalCities})
            </option>
          ))}
        </select>
      </div>

      {/* Progress Bar */}
      <div className="px-3 py-2 border-b">
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
          <span>{completedCount} / {totalCities} cities</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              backgroundColor: pct === 100 ? '#16a34a' : pct > 50 ? '#2D6A4F' : '#f59e0b',
            }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search cities or states..."
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-400 outline-none"
        />
      </div>

      {/* State List */}
      <div className="flex-1 overflow-auto">
        {filteredGroups.map(state => {
          const { done, total } = getStateProgress(state.cities);
          const isExpanded = expandedStates[state.code];
          const allDone = done === total;

          return (
            <div key={state.code} className={`border-b last:border-b-0 ${allDone ? 'bg-green-50/50' : ''}`}>
              {/* State Header */}
              <button
                onClick={() => toggleState(state.code)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                  <span className="text-xs font-semibold text-[#1B4332]">{state.name}</span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    allDone
                      ? 'bg-green-100 text-green-800'
                      : done > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {done}/{total}
                </span>
              </button>

              {/* Cities */}
              {isExpanded && (
                <div className="pb-2">
                  {/* Bulk Actions */}
                  <div className="px-3 pb-1 flex gap-2">
                    <button
                      onClick={() => checkAllInState(state.cities)}
                      className="text-[10px] text-green-700 hover:underline"
                    >
                      ✅ Check all
                    </button>
                    <button
                      onClick={() => uncheckAllInState(state.cities)}
                      className="text-[10px] text-red-600 hover:underline"
                    >
                      ✕ Uncheck all
                    </button>
                  </div>
                  {state.cities.map(city => {
                    const isChecked = checked[selectedCategory]?.[city.slug] || false;
                    return (
                      <label
                        key={city.slug}
                        className="flex items-center gap-2 px-4 py-1 hover:bg-gray-50 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCity(city.slug)}
                          className="rounded border-gray-300 text-[#2D6A4F] focus:ring-green-300 h-3.5 w-3.5"
                        />
                        <span className={isChecked ? 'line-through text-gray-400' : 'text-gray-700'}>
                          {city.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {filteredGroups.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-gray-400">No cities match your search.</div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t bg-gray-50 text-[10px] text-gray-400 text-center">
        {stateGroups.length} states · {totalCities} cities · {OUTREACH_CATEGORIES.length} categories
      </div>
    </div>
  );
}
