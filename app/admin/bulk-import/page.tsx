'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type {
  ParsedListing,
  DuplicateCheckResult,
  IntraBatchDuplicate,
} from '@/lib/duplicate-detection';

// ---- Local types ----

interface ScanSummary {
  total: number;
  flagged: number;
  clear: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  intraBatchDuplicateCount: number;
  existingListingsScanned: number;
}

type Step = 'upload' | 'scanning' | 'review' | 'importing' | 'complete';

// ---- CSV parser ----

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    return row;
  });
}

// ---- Probability badge ----

function ProbBadge({ p }: { p: number }) {
  let bg = 'bg-green-100 text-green-800';
  let label = 'Clear';
  if (p >= 75) { bg = 'bg-red-100 text-red-700'; label = `${p}% Likely Duplicate`; }
  else if (p >= 40) { bg = 'bg-yellow-100 text-yellow-800'; label = `${p}% Possible Duplicate`; }
  else if (p >= 20) { bg = 'bg-blue-100 text-blue-700'; label = `${p}% Low Risk`; }
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${bg}`}>{label}</span>;
}

// ============================================================
// Page Component
// ============================================================

export default function BulkImportPage() {
  const supabase = createClient();

  // Auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Wizard step
  const [step, setStep] = useState<Step>('upload');

  // CSV
  const [csvData, setCsvData] = useState<ParsedListing[]>([]);
  const [fileName, setFileName] = useState('');

  // Duplicate scan results
  const [dupResults, setDupResults] = useState<DuplicateCheckResult[]>([]);
  const [intraBatch, setIntraBatch] = useState<IntraBatchDuplicate[]>([]);
  const [summary, setSummary] = useState<ScanSummary | null>(null);

  // Review selections
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Import progress
  const [progress, setProgress] = useState({ current: 0, total: 0, successes: 0, errors: [] as string[] });

  // ---- Admin check ----
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.email === 'levistocks93@gmail.com');
      setAuthLoading(false);
    })();
  }, [supabase]);

  // ---- CSV file handler ----
  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      const parsed: ParsedListing[] = rows.map((r, i) => ({
        title: r.title || '',
        description: r.description || '',
        address: r.address || '',
        city: r.city || '',
        state: r.state || '',
        zip_code: r.zip_code || '',
        sale_date: r.sale_date || '',
        start_time: r.start_time || '',
        end_time: r.end_time || '',
        category: r.category || '',
        image_url: r.image_url || '',
        rowIndex: i,
      }));
      setCsvData(parsed);
    };
    reader.readAsText(file);
  }, []);

  // ---- Scan for duplicates ----
  const runScan = useCallback(async () => {
    setStep('scanning');
    try {
      const res = await fetch('/api/admin/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listings: csvData }),
      });
      if (!res.ok) throw new Error('Scan failed');
      const data = await res.json();

      setDupResults(data.results);
      setIntraBatch(data.intraBatchDuplicates);
      setSummary(data.summary);

      // Pre-select all "clear" rows + flagged rows under 40%
      const autoSelected = new Set<number>();
      (data.results as DuplicateCheckResult[]).forEach(r => {
        if (r.status === 'clear' || r.highestProbability < 40) {
          autoSelected.add(r.rowIndex);
        }
      });
      setSelected(autoSelected);
      setStep('review');
    } catch (err) {
      console.error(err);
      alert('Duplicate scan failed. Check console.');
      setStep('upload');
    }
  }, [csvData]);

  // ---- Toggle helpers ----
  const toggleRow = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };
  const toggleExpand = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };
  const selectAllClear = () => {
    const s = new Set<number>();
    dupResults.forEach(r => { if (r.status === 'clear') s.add(r.rowIndex); });
    setSelected(s);
  };
  const selectAll = () => {
    setSelected(new Set(csvData.map(r => r.rowIndex)));
  };
  const deselectAll = () => setSelected(new Set());

  // ---- Import selected listings ----
  const runImport = useCallback(async () => {
    const toImport = csvData.filter(r => selected.has(r.rowIndex));
    if (toImport.length === 0) return;

    setStep('importing');
    setProgress({ current: 0, total: toImport.length, successes: 0, errors: [] });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('Not authenticated'); setStep('review'); return; }

    let successes = 0;
    const errors: string[] = [];

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      try {
        // Geocode
        let latitude = null;
        let longitude = null;
        const fullAddress = `${row.address}, ${row.city}, ${row.state} ${row.zip_code}`;
        try {
          const geoRes = await fetch(`/api/geocode?address=${encodeURIComponent(fullAddress)}`);
          if (geoRes.ok) {
            const geo = await geoRes.json();
            latitude = geo.lat;
            longitude = geo.lon;
          }
        } catch { /* geocode failure is non-fatal */ }

        // Insert listing
        const { data: listing, error: insertErr } = await supabase.from('listings').insert({
          title: row.title,
          description: row.description,
          address: row.address,
          city: row.city,
          state: row.state,
          zip_code: row.zip_code,
          sale_date: row.sale_date,
          start_time: row.start_time || null,
          end_time: row.end_time || null,
          category: row.category || 'Other',
          user_id: user.id,
          latitude,
          longitude,
        }).select().single();

        if (insertErr) throw insertErr;

        // Attach image if provided
        if (row.image_url && listing) {
          await supabase.from('listing_photos').insert({
            listing_id: listing.id,
            photo_url: row.image_url,
            position: 0,
          });
        }

        successes++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Row ${row.rowIndex + 1} (${row.title}): ${message}`);
      }

      setProgress({ current: i + 1, total: toImport.length, successes, errors: [...errors] });
    }

    setStep('complete');
  }, [csvData, selected, supabase]);

  // ---- Auth gate ----
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D6A4F]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">Admin access required.</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1B4332]">Bulk Import with Duplicate Detection</h1>
          <p className="text-gray-500 mt-1">Upload → Scan → Review → Import</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {(['upload', 'scanning', 'review', 'importing', 'complete'] as Step[]).map((s, i) => {
            const labels = ['Upload CSV', 'Scanning', 'Review', 'Importing', 'Done'];
            const isCurrent = step === s;
            const isPast = ['upload', 'scanning', 'review', 'importing', 'complete'].indexOf(step) > i;
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isPast ? 'bg-[#2D6A4F] text-white' : isCurrent ? 'bg-[#40916C] text-white ring-4 ring-green-200' : 'bg-gray-200 text-gray-500'}`}>
                  {isPast ? '✓' : i + 1}
                </div>
                <span className={`text-sm hidden sm:inline ${isCurrent ? 'font-semibold text-[#1B4332]' : 'text-gray-400'}`}>{labels[i]}</span>
                {i < 4 && <div className={`flex-1 h-0.5 ${isPast ? 'bg-[#2D6A4F]' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>

        {/* ========== STEP 1: UPLOAD ========== */}
        {step === 'upload' && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h2 className="text-xl font-semibold text-[#1B4332] mb-4">Upload CSV File</h2>
            <p className="text-gray-500 text-sm mb-6">
              Required columns: <code className="bg-gray-100 px-1 rounded text-xs">title, description, address, city, state, zip_code, sale_date</code><br />
              Optional: <code className="bg-gray-100 px-1 rounded text-xs">start_time, end_time, category, image_url</code>
            </p>

            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-[#40916C] hover:bg-green-50 transition">
              <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
              <div className="text-4xl mb-3">📁</div>
              {fileName ? (
                <p className="font-medium text-[#2D6A4F]">{fileName} — {csvData.length} listings parsed</p>
              ) : (
                <p className="text-gray-400">Click to select a CSV file</p>
              )}
            </label>

            {csvData.length > 0 && (
              <>
                {/* Preview */}
                <div className="mt-6 border rounded-lg overflow-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">#</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Title</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Address</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">City</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 10).map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                          <td className="px-3 py-2 font-medium">{r.title}</td>
                          <td className="px-3 py-2">{r.address}</td>
                          <td className="px-3 py-2">{r.city}, {r.state}</td>
                          <td className="px-3 py-2">{r.sale_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 10 && (
                    <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50">
                      Showing 10 of {csvData.length} rows
                    </div>
                  )}
                </div>

                <button onClick={runScan} className="mt-6 bg-[#2D6A4F] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1B4332] transition flex items-center gap-2">
                  🔍 Scan {csvData.length} Listings for Duplicates
                </button>
              </>
            )}
          </div>
        )}

        {/* ========== STEP 2: SCANNING ========== */}
        {step === 'scanning' && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#2D6A4F] mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Scanning for Duplicates...</h2>
            <p className="text-gray-500">Analyzing {csvData.length} listings against your database using address matching, date comparison, description similarity, and keyword analysis.</p>
          </div>
        )}

        {/* ========== STEP 3: REVIEW ========== */}
        {step === 'review' && summary && (
          <div className="space-y-6">

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
                <div className="text-3xl font-bold text-[#1B4332]">{summary.total}</div>
                <div className="text-sm text-gray-500 mt-1">Total Listings</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl shadow-sm p-5 text-center">
                <div className="text-3xl font-bold text-green-700">{summary.clear}</div>
                <div className="text-sm text-green-600 mt-1">Clear</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm p-5 text-center">
                <div className="text-3xl font-bold text-yellow-700">{summary.mediumRisk + summary.lowRisk}</div>
                <div className="text-sm text-yellow-600 mt-1">Possible Duplicates</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm p-5 text-center">
                <div className="text-3xl font-bold text-red-700">{summary.highRisk}</div>
                <div className="text-sm text-red-600 mt-1">Likely Duplicates</div>
              </div>
            </div>

            {/* Scanned Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
              Scanned against <strong>{summary.existingListingsScanned}</strong> existing listings in your database.
              {summary.intraBatchDuplicateCount > 0 && (
                <span className="ml-1">Found <strong>{summary.intraBatchDuplicateCount}</strong> potential duplicate(s) within this CSV batch.</span>
              )}
            </div>

            {/* Intra-batch duplicates */}
            {intraBatch.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                <h3 className="font-semibold text-orange-800 mb-3">⚠️ Duplicates Within This CSV Batch</h3>
                <div className="space-y-2">
                  {intraBatch.map((d, i) => (
                    <div key={i} className="bg-white rounded-lg border border-orange-200 px-4 py-3 text-sm">
                      <span className="font-medium">Row {d.rowIndexA + 1}</span> ↔ <span className="font-medium">Row {d.rowIndexB + 1}</span>
                      <span className="ml-2"><ProbBadge p={d.probability} /></span>
                      <div className="text-xs text-gray-500 mt-1">{d.reasons.join(' · ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bulk selection buttons */}
            <div className="flex flex-wrap gap-3">
              <button onClick={selectAll} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition">Select All</button>
              <button onClick={selectAllClear} className="px-4 py-2 text-sm rounded-lg border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition">Select Only Clear</button>
              <button onClick={deselectAll} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition">Deselect All</button>
              <div className="ml-auto text-sm text-gray-500 self-center">{selected.size} of {csvData.length} selected for import</div>
            </div>

            {/* Listings review table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-3 text-left w-10">
                        <input
                          type="checkbox"
                          checked={selected.size === csvData.length}
                          onChange={() => selected.size === csvData.length ? deselectAll() : selectAll()}
                          className="rounded"
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-xs text-gray-500 font-medium">#</th>
                      <th className="px-3 py-3 text-left text-xs text-gray-500 font-medium">Title</th>
                      <th className="px-3 py-3 text-left text-xs text-gray-500 font-medium">Address</th>
                      <th className="px-3 py-3 text-left text-xs text-gray-500 font-medium">Date</th>
                      <th className="px-3 py-3 text-left text-xs text-gray-500 font-medium">Status</th>
                      <th className="px-3 py-3 text-left text-xs text-gray-500 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dupResults.map(result => {
                      const r = result.listing;
                      const isFlagged = result.status === 'flagged';
                      const isExpanded = expanded.has(r.rowIndex);
                      const rowBg = isFlagged
                        ? result.highestProbability >= 75
                          ? 'bg-red-50'
                          : result.highestProbability >= 40
                            ? 'bg-yellow-50'
                            : 'bg-blue-50'
                        : '';

                      return (
                        <Fragment key={r.rowIndex}>
                          <tr className={`border-t hover:bg-gray-50 transition ${rowBg}`}>
                            <td className="px-3 py-3">
                              <input
                                type="checkbox"
                                checked={selected.has(r.rowIndex)}
                                onChange={() => toggleRow(r.rowIndex)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-3 py-3 text-gray-400">{r.rowIndex + 1}</td>
                            <td className="px-3 py-3 font-medium max-w-[200px] truncate">{r.title}</td>
                            <td className="px-3 py-3 text-gray-600 max-w-[200px] truncate">{r.address}, {r.city}</td>
                            <td className="px-3 py-3">{r.sale_date}</td>
                            <td className="px-3 py-3"><ProbBadge p={result.highestProbability} /></td>
                            <td className="px-3 py-3">
                              {isFlagged && (
                                <button onClick={() => toggleExpand(r.rowIndex)} className="text-gray-400 hover:text-gray-700 transition text-lg">
                                  {isExpanded ? '▲' : '▼'}
                                </button>
                              )}
                            </td>
                          </tr>

                          {/* Expanded match details */}
                          {isFlagged && isExpanded && (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 bg-gray-50 border-t">
                                <div className="space-y-3">
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {result.matches.length} Potential Match{result.matches.length > 1 ? 'es' : ''} Found in Database
                                  </div>
                                  {result.matches.map((match, mi) => (
                                    <div key={mi} className="bg-white rounded-lg border p-4">
                                      <div className="flex items-start justify-between mb-3">
                                        <div>
                                          <div className="font-semibold text-gray-800">{match.existingTitle}</div>
                                          <div className="text-sm text-gray-500">{match.existingAddress}, {match.existingCity} · {match.existingSaleDate}</div>
                                        </div>
                                        <ProbBadge p={match.probability} />
                                      </div>

                                      {/* Breakdown bars */}
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                                        <div>
                                          <div className="text-gray-500 mb-1">Address</div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${match.breakdown.addressScore}%` }} />
                                          </div>
                                          <div className="text-gray-600 mt-0.5">{match.breakdown.addressScore}%</div>
                                        </div>
                                        <div>
                                          <div className="text-gray-500 mb-1">Date</div>
                                          <div className={`font-semibold ${match.breakdown.dateMatch ? 'text-red-600' : 'text-green-600'}`}>
                                            {match.breakdown.dateMatch ? 'Same Date' : 'Different'}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-gray-500 mb-1">Description</div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${match.breakdown.descriptionScore}%` }} />
                                          </div>
                                          <div className="text-gray-600 mt-0.5">{match.breakdown.descriptionScore}%</div>
                                        </div>
                                        <div>
                                          <div className="text-gray-500 mb-1">Title</div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${match.breakdown.titleScore}%` }} />
                                          </div>
                                          <div className="text-gray-600 mt-0.5">{match.breakdown.titleScore}%</div>
                                        </div>
                                        <div>
                                          <div className="text-gray-500 mb-1">Keywords</div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${match.breakdown.keywordOverlap}%` }} />
                                          </div>
                                          <div className="text-gray-600 mt-0.5">{match.breakdown.keywordOverlap}%</div>
                                        </div>
                                      </div>

                                      {/* Reasons */}
                                      <div className="mt-3 flex flex-wrap gap-1.5">
                                        {match.reasons.map((reason, ri) => (
                                          <span key={ri} className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{reason}</span>
                                        ))}
                                      </div>

                                      {/* Side-by-side descriptions */}
                                      <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 mb-1">Incoming Description</div>
                                          <div className="text-xs text-gray-600 bg-green-50 border border-green-200 rounded p-2 max-h-24 overflow-auto">{r.description || '(empty)'}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 mb-1">Existing Description</div>
                                          <div className="text-xs text-gray-600 bg-red-50 border border-red-200 rounded p-2 max-h-24 overflow-auto">{match.existingDescription || '(empty)'}</div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import button */}
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border p-5">
              <button onClick={() => { setStep('upload'); setCsvData([]); setDupResults([]); setIntraBatch([]); setSummary(null); }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
                ← Back to Upload
              </button>
              <button onClick={runImport} disabled={selected.size === 0}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition flex items-center gap-2 ${selected.size > 0 ? 'bg-[#2D6A4F] hover:bg-[#1B4332]' : 'bg-gray-300 cursor-not-allowed'}`}>
                🚀 Import {selected.size} Listing{selected.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* ========== STEP 4: IMPORTING ========== */}
        {step === 'importing' && (
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <h2 className="text-xl font-semibold text-[#1B4332] mb-6">Importing Listings...</h2>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-[#2D6A4F] h-4 rounded-full transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{progress.current} of {progress.total}</span>
              <span className="text-green-600">{progress.successes} successful</span>
              {progress.errors.length > 0 && <span className="text-red-600">{progress.errors.length} errors</span>}
            </div>
            {progress.errors.length > 0 && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-auto text-sm text-red-700">
                {progress.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>
        )}

        {/* ========== STEP 5: COMPLETE ========== */}
        {step === 'complete' && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-[#1B4332] mb-2">Import Complete!</h2>
            <div className="flex justify-center gap-8 my-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{progress.successes}</div>
                <div className="text-sm text-gray-500">Successfully Imported</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{progress.errors.length}</div>
                <div className="text-sm text-gray-500">Errors</div>
              </div>
            </div>
            {progress.errors.length > 0 && (
              <div className="text-left bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-h-48 overflow-auto text-sm text-red-700">
                <div className="font-semibold mb-2">Error Details:</div>
                {progress.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
            <button
              onClick={() => { setStep('upload'); setCsvData([]); setDupResults([]); setIntraBatch([]); setSummary(null); setProgress({ current: 0, total: 0, successes: 0, errors: [] }); }}
              className="bg-[#2D6A4F] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1B4332] transition">
              Import More Listings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
