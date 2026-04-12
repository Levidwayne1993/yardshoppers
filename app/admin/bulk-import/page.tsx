'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

// ─── Admin Lock ───────────────────────────────────────────────
const ADMIN_EMAIL = 'erwin-levi@outlook.com';

// ─── Category Mapping ─────────────────────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  'garage sale': 'garage-sales',
  'garage sales': 'garage-sales',
  'yard sale': 'garage-sales',
  'yard sales': 'garage-sales',
  'estate sale': 'estate-sales',
  'estate sales': 'estate-sales',
  'moving sale': 'moving-sales',
  'moving sales': 'moving-sales',
  'multi-family': 'multi-family-sales',
  'multi-family sale': 'multi-family-sales',
  'multi-family sales': 'multi-family-sales',
  'community sale': 'neighborhood-sales',
  'community sales': 'neighborhood-sales',
  'neighborhood sale': 'neighborhood-sales',
  'neighborhood sales': 'neighborhood-sales',
  'church sale': 'church-charity-sales',
  'charity sale': 'church-charity-sales',
  'church/charity': 'church-charity-sales',
  'church/charity sales': 'church-charity-sales',
  'barn sale': 'barn-sales',
  'barn sales': 'barn-sales',
  'storage unit': 'storage-unit-sales',
  'storage unit sale': 'storage-unit-sales',
  'storage unit sales': 'storage-unit-sales',
  'flea market': 'flea-markets',
  'flea markets': 'flea-markets',
  'auction': 'auctions',
  'auctions': 'auctions',
  'antique': 'antique-sales',
  'antique sale': 'antique-sales',
  'antique sales': 'antique-sales',
  'antiques': 'antique-sales',
  'online': 'online-sales',
  'online sale': 'online-sales',
  'online sales': 'online-sales',
  'other': 'other',
};

const CATEGORY_LABELS: Record<string, string> = {
  'garage-sales': 'Garage Sales',
  'estate-sales': 'Estate Sales',
  'moving-sales': 'Moving Sales',
  'multi-family-sales': 'Multi-Family Sales',
  'neighborhood-sales': 'Neighborhood Sales',
  'church-charity-sales': 'Church/Charity Sales',
  'barn-sales': 'Barn Sales',
  'storage-unit-sales': 'Storage Unit Sales',
  'flea-markets': 'Flea Markets',
  'auctions': 'Auctions',
  'antique-sales': 'Antique Sales',
  'online-sales': 'Online Sales',
  'other': 'Other',
};

// ─── Types ────────────────────────────────────────────────────
interface ParsedListing {
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  date: string;
  rawDate: string;
  startTime: string;
  endTime: string;
  rawStartTime: string;
  rawEndTime: string;
  category: string;
  categorySlug: string;
  description: string;
  sourceUrl: string;
  selected: boolean;
  status?: 'pending' | 'importing' | 'success' | 'failed' | 'duplicate';
  error?: string;
}

interface ImportResults {
  total: number;
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

// ─── Parsing Helpers ──────────────────────────────────────────
function mapCategory(input: string): string {
  const lower = input.toLowerCase().trim();
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower];
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }
  return 'other';
}

function parseTime(input: string): string {
  if (!input) return '';
  const cleaned = input.trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/);
  if (!match) return '';
  let hours = parseInt(match[1]);
  const minutes = match[2] || '00';
  const period = match[3];
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

function parseDate(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const mdyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    return `${mdyMatch[3]}-${mdyMatch[1].padStart(2, '0')}-${mdyMatch[2].padStart(2, '0')}`;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
}

function parseListings(text: string): ParsedListing[] {
  const blocks = text.split('===SALE===').filter((b) => b.trim());
  const listings: ParsedListing[] = [];

  for (const block of blocks) {
    const content = block.split('===END===')[0].trim();
    if (!content) continue;

    const listing: Partial<ParsedListing> = { selected: true, status: 'pending' };
    const lines = content.split('\n');
    let isDescription = false;
    let descLines: string[] = [];

    for (const line of lines) {
      if (isDescription) {
        descLines.push(line);
        continue;
      }

      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const key = line.substring(0, colonIdx).trim().toLowerCase();
      const value = line.substring(colonIdx + 1).trim();

      switch (key) {
        case 'title':
          listing.title = value;
          break;
        case 'address':
          listing.address = value;
          break;
        case 'city':
          listing.city = value;
          break;
        case 'state':
          listing.state = value;
          break;
        case 'zip':
          listing.zip = value;
          break;
        case 'date':
          listing.rawDate = value;
          listing.date = parseDate(value);
          break;
        case 'start':
        case 'start time':
          listing.rawStartTime = value;
          listing.startTime = parseTime(value);
          break;
        case 'end':
        case 'end time':
          listing.rawEndTime = value;
          listing.endTime = parseTime(value);
          break;
        case 'category':
          listing.category = value;
          listing.categorySlug = mapCategory(value);
          break;
        case 'source':
        case 'source url':
        case 'url':
          listing.sourceUrl = value;
          break;
        case 'description':
          isDescription = true;
          if (value) descLines.push(value);
          break;
      }
    }

    listing.description = descLines.join('\n').trim();

    if (listing.title && (listing.city || listing.address)) {
      listings.push({
        title: listing.title || '',
        address: listing.address || '',
        city: listing.city || '',
        state: listing.state || '',
        zip: listing.zip || '',
        date: listing.date || '',
        rawDate: listing.rawDate || '',
        startTime: listing.startTime || '',
        endTime: listing.endTime || '',
        rawStartTime: listing.rawStartTime || '',
        rawEndTime: listing.rawEndTime || '',
        category: listing.category || 'Other',
        categorySlug: listing.categorySlug || 'other',
        description: listing.description || '',
        sourceUrl: listing.sourceUrl || '',
        selected: true,
        status: 'pending',
      });
    }
  }

  return listings;
}

// ─── Sample Format ────────────────────────────────────────────
const SAMPLE_FORMAT = `===SALE===
Title: Big Garage Sale
Address: 1326 NE Buffalo St
City: Portland
State: OR
Zip: 97211
Date: 04/12/2026
Start: 9:00 AM
End: 2:00 PM
Category: Garage Sales
Description: Multi-family sale with furniture, tools, clothing, and more. 16 photos posted.
Source: https://portland.craigslist.org/mlt/gms/123456.html
===END===

===SALE===
Title: Estate Sale - Everything Must Go
Address: 2769 NW Savier St
City: Portland
State: OR
Zip: 97210
Date: 04/11/2026
Start: 10:00 AM
End: 4:00 PM
Category: Estate Sales
Description: Lifetime art collection, vintage furniture, Waterford Crystal. Sign the list at 7am for priority entry.
Source: https://estatesales.net/OR/Portland/sale/12345
===END===`;

// ─── Main Component ───────────────────────────────────────────
export default function BulkImportPage() {
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ParsedListing[]>([]);
  const [phase, setPhase] = useState<'paste' | 'preview' | 'importing' | 'done'>('paste');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [showFormat, setShowFormat] = useState(false);
  const [parseError, setParseError] = useState('');

  const router = useRouter();
  const supabase = createClient();

  // ── Auth Check ──────────────────────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email === ADMIN_EMAIL) {
        setAuthorized(true);
      }
      setAuthLoading(false);
    }
    checkAuth();
  }, []);

  // ── Parse Handler ───────────────────────────────────────────
  const handleParse = useCallback(() => {
    setParseError('');
    if (!rawText.trim()) {
      setParseError('Paste your listings data first.');
      return;
    }
    if (!rawText.includes('===SALE===')) {
      setParseError(
        'No listings found. Make sure each listing is wrapped in ===SALE=== and ===END=== tags.'
      );
      return;
    }
    const listings = parseListings(rawText);
    if (listings.length === 0) {
      setParseError(
        'Could not parse any valid listings. Each listing needs at least a Title and City.'
      );
      return;
    }
    setParsed(listings);
    setPhase('preview');
  }, [rawText]);

  // ── Toggle Selection ────────────────────────────────────────
  const toggleListing = (index: number) => {
    setParsed((prev) =>
      prev.map((l, i) => (i === index ? { ...l, selected: !l.selected } : l))
    );
  };

  const toggleAll = () => {
    const allSelected = parsed.every((l) => l.selected);
    setParsed((prev) => prev.map((l) => ({ ...l, selected: !allSelected })));
  };

  const selectedCount = parsed.filter((l) => l.selected).length;

  // ── Import Handler ──────────────────────────────────────────
  const handleImport = async () => {
    const selected = parsed.filter((l) => l.selected);
    if (selected.length === 0) return;

    setPhase('importing');
    setProgress(0);

    setParsed((prev) =>
      prev.map((l) => (l.selected ? { ...l, status: 'importing' } : l))
    );

    try {
      const response = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listings: selected.map((l) => ({
            title: l.title,
            address: l.address,
            city: l.city,
            state: l.state,
            zip: l.zip,
            date: l.date,
            startTime: l.startTime,
            endTime: l.endTime,
            categorySlug: l.categorySlug,
            description: l.description,
            sourceUrl: l.sourceUrl,
          })),
        }),
      });

      const data: ImportResults & { details?: { title: string; status: string; error?: string }[] } =
        await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0] || 'Import failed');
      }

      setResults(data);

      if (data.details) {
        setParsed((prev) => {
          const updated = [...prev];
          let detailIdx = 0;
          for (let i = 0; i < updated.length; i++) {
            if (updated[i].selected && detailIdx < data.details!.length) {
              const detail = data.details![detailIdx];
              updated[i] = {
                ...updated[i],
                status: detail.status as any,
                error: detail.error,
              };
              detailIdx++;
            }
          }
          return updated;
        });
      } else {
        setParsed((prev) =>
          prev.map((l) => (l.selected ? { ...l, status: 'success' } : l))
        );
      }

      setProgress(100);
      setPhase('done');
    } catch (error: any) {
      setResults({
        total: selected.length,
        success: 0,
        failed: selected.length,
        duplicates: 0,
        errors: [error.message],
      });
      setParsed((prev) =>
        prev.map((l) =>
          l.selected ? { ...l, status: 'failed', error: error.message } : l
        )
      );
      setPhase('done');
    }
  };

  // ── Reset ───────────────────────────────────────────────────
  const handleReset = () => {
    setRawText('');
    setParsed([]);
    setPhase('paste');
    setProgress(0);
    setResults(null);
    setParseError('');
  };

  // ── Loading State ───────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2E7D32] border-t-transparent" />
      </div>
    );
  }

  // ── Unauthorized ────────────────────────────────────────────
  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">This page is restricted to YardShoppers administrators.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[#2E7D32] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#256829] transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ─── Main UI ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-[#2E7D32] text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bulk Import</h1>
              <p className="text-white/70 text-sm">Admin — Paste &amp; publish yard sale listings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ── Format Guide (Collapsible) ────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowFormat(!showFormat)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-gray-900">Paste Format Guide</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transform transition-transform ${showFormat ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showFormat && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mt-3 mb-2">
                Each listing must be wrapped in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">===SALE===</code> and <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">===END===</code> tags. Paste as many listings as you want — they all get imported at once.
              </p>
              <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto font-mono whitespace-pre-wrap">
                {SAMPLE_FORMAT}
              </pre>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
                <div><strong>Required:</strong> Title, City (minimum)</div>
                <div><strong>Date formats:</strong> 04/12/2026, 2026-04-12, April 12 2026</div>
                <div><strong>Time formats:</strong> 9:00 AM, 9am, 09:00, 14:00</div>
                <div><strong>Categories:</strong> {Object.values(CATEGORY_LABELS).join(', ')}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Phase: Paste ──────────────────────────────────── */}
        {phase === 'paste' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Paste Listings Data
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your ===SALE=== ... ===END=== formatted listings here..."
                className="w-full h-80 p-4 border border-gray-200 rounded-xl text-sm font-mono resize-y focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none transition-all"
              />
              {parseError && (
                <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {parseError}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {rawText.split('===SALE===').length - 1} listing block(s) detected
                </span>
                <button
                  onClick={handleParse}
                  disabled={!rawText.trim()}
                  className="bg-[#2E7D32] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#256829] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Parse Listings
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Phase: Preview / Importing / Done ─────────────── */}
        {(phase === 'preview' || phase === 'importing' || phase === 'done') && (
          <>
            {/* Summary Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#2E7D32]">{parsed.length}</span>
                    <span className="text-sm text-gray-500">listings parsed</span>
                  </div>
                  {phase === 'preview' && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>•</span>
                      <span className="font-medium text-gray-700">{selectedCount}</span> selected
                    </div>
                  )}
                  {results && (
                    <div className="flex items-center gap-3 text-sm">
                      {results.success > 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {results.success} imported
                        </span>
                      )}
                      {results.duplicates > 0 && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {results.duplicates} duplicates skipped
                        </span>
                      )}
                      {results.failed > 0 && (
                        <span className="flex items-center gap-1 text-red-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {results.failed} failed
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {phase === 'preview' && (
                    <>
                      <button
                        onClick={() => { setPhase('paste'); setParsed([]); }}
                        className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium transition-colors"
                      >
                        Back to Edit
                      </button>
                      <button
                        onClick={toggleAll}
                        className="text-[#2E7D32] hover:bg-green-50 px-4 py-2 rounded-xl border border-[#2E7D32] text-sm font-medium transition-colors"
                      >
                        {parsed.every((l) => l.selected) ? 'Deselect All' : 'Select All'}
                      </button>
                    </>
                  )}
                  {phase === 'done' && (
                    <button
                      onClick={handleReset}
                      className="bg-[#2E7D32] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#256829] transition-colors"
                    >
                      Import More
                    </button>
                  )}
                </div>
              </div>

              {phase === 'importing' && (
                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div className="bg-[#2E7D32] h-full rounded-full transition-all duration-500 animate-pulse" style={{ width: '100%' }} />
                    </div>
                    <span className="text-sm text-gray-500 font-medium">Importing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Listing Cards */}
            <div className="space-y-3">
              {parsed.map((listing, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                    listing.status === 'success'
                      ? 'border-green-200 bg-green-50/30'
                      : listing.status === 'failed'
                      ? 'border-red-200 bg-red-50/30'
                      : listing.status === 'duplicate'
                      ? 'border-amber-200 bg-amber-50/30'
                      : listing.selected
                      ? 'border-[#2E7D32]/30'
                      : 'border-gray-100 opacity-50'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      {phase === 'preview' && (
                        <button onClick={() => toggleListing(index)} className="mt-1 flex-shrink-0">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${listing.selected ? 'bg-[#2E7D32] border-[#2E7D32]' : 'border-gray-300'}`}>
                            {listing.selected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      )}

                      {/* Status Icon */}
                      {(phase === 'importing' || phase === 'done') && (
                        <div className="mt-1 flex-shrink-0">
                          {listing.status === 'success' && (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                          )}
                          {listing.status === 'failed' && (
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </div>
                          )}
                          {listing.status === 'duplicate' && (
                            <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01" /></svg>
                            </div>
                          )}
                          {listing.status === 'importing' && (
                            <div className="w-5 h-5 animate-spin rounded-full border-2 border-[#2E7D32] border-t-transparent" />
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900 text-base">{listing.title}</h3>
                          <span className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-[#2E7D32]/10 text-[#2E7D32]">
                            {CATEGORY_LABELS[listing.categorySlug] || listing.category}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-sm">
                          {(listing.address || listing.city) && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate">{[listing.address, listing.city, listing.state, listing.zip].filter(Boolean).join(', ')}</span>
                            </div>
                          )}
                          {listing.date && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {listing.rawDate || listing.date}
                            </div>
                          )}
                          {(listing.rawStartTime || listing.rawEndTime) && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {[listing.rawStartTime, listing.rawEndTime].filter(Boolean).join(' – ')}
                            </div>
                          )}
                        </div>

                        {listing.description && (
                          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{listing.description}</p>
                        )}

                        {listing.error && (
                          <p className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">Error: {listing.error}</p>
                        )}

                        {listing.sourceUrl && (
                          <a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-[#2E7D32] hover:underline">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Original Source
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Import Button (sticky bottom bar) */}
            {phase === 'preview' && selectedCount > 0 && (
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 -mx-4 px-4 py-4 mt-6 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    <strong className="text-gray-900">{selectedCount}</strong> listing{selectedCount !== 1 ? 's' : ''} ready to import
                  </span>
                  <button
                    onClick={handleImport}
                    className="bg-[#2E7D32] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#256829] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 shadow-lg shadow-green-200"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import {selectedCount} Listing{selectedCount !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            )}

            {/* Errors List */}
            {phase === 'done' && results && results.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <h3 className="font-semibold text-red-800 mb-2">Import Errors</h3>
                <ul className="text-sm text-red-600 space-y-1">
                  {results.errors.map((err, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
