// ============================================================
// PLACE IN: components/admin/CityFixer.tsx
// City extraction tool for aggregated sales with missing cities
// ============================================================

"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase-browser";
import { STATE_NAME_TO_ABBR } from "@/lib/stateMap";

const supabase = createClient();

const STATE_ABBRS = new Set(Object.values(STATE_NAME_TO_ABBR));

// Common street suffixes to help identify where street ends and city begins
const STREET_SUFFIXES = new Set([
  "street", "st", "avenue", "ave", "road", "rd", "drive", "dr",
  "boulevard", "blvd", "lane", "ln", "court", "ct", "circle", "cir",
  "place", "pl", "way", "terrace", "ter", "trail", "trl", "pike",
  "highway", "hwy", "parkway", "pkwy", "alley", "aly", "bend",
  "crossing", "xing", "loop", "pass", "path", "ridge", "row",
  "run", "square", "sq", "turnpike", "tpke", "walk", "commons",
]);

interface FixCandidate {
  id: string;
  address: string;
  state: string | null;
  currentCity: string | null;
  extractedCity: string | null;
  extractedState: string | null;
  title: string;
  confidence: "high" | "medium" | "low";
  selected: boolean;
}

/**
 * Attempts to extract a city (and optionally state) from a US address string.
 *
 * Handles formats like:
 *   "5201 Commonwealth Street Detroit, MI, 48208"
 *   "123 Main St, Detroit, MI 48208"
 *   "456 Oak Ave, Apt 2, Portland, OR 97201"
 *   "789 Elm Dr NW, Atlanta, GA"
 */
function extractCityFromAddress(
  address: string,
  existingState: string | null
): { city: string | null; state: string | null; confidence: "high" | "medium" | "low" } {
  if (!address || !address.trim()) {
    return { city: null, state: null, confidence: "low" };
  }

  const cleaned = address.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(",").map((s) => s.trim());

  // ── Strategy 1: Comma-separated, find state abbreviation ──
  for (let i = 0; i < parts.length; i++) {
    const segment = parts[i];
    // Match a 2-letter state code (optionally followed by zip)
    const stateMatch = segment.match(/^([A-Z]{2})(?:\s+\d{5})?$/i);
    if (stateMatch) {
      const foundState = stateMatch[1].toUpperCase();
      if (STATE_ABBRS.has(foundState)) {
        // City is the segment before this
        if (i > 0) {
          let cityCandidate = parts[i - 1].trim();

          // If city candidate starts with a number, it's likely "123 Main St CityName"
          // Try to extract just the city from the end
          if (/^\d/.test(cityCandidate)) {
            cityCandidate = extractCityFromStreetLine(cityCandidate);
          }

          // Remove zip codes or numbers at the end
          cityCandidate = cityCandidate.replace(/\s+\d{5}(-\d{4})?$/, "").trim();

          if (cityCandidate && cityCandidate.length > 1 && !/^\d+$/.test(cityCandidate)) {
            return {
              city: titleCase(cityCandidate),
              state: foundState,
              confidence: "high",
            };
          }
        }
      }
    }

    // Also check for "City, ST ZIP" or "City ST" within a single segment
    const inlineMatch = segment.match(
      /^(.+?)\s+([A-Z]{2})(?:\s+\d{5}(-\d{4})?)?$/i
    );
    if (inlineMatch) {
      const possibleState = inlineMatch[2].toUpperCase();
      if (STATE_ABBRS.has(possibleState)) {
        let cityCandidate = inlineMatch[1].trim();

        if (/^\d/.test(cityCandidate)) {
          cityCandidate = extractCityFromStreetLine(cityCandidate);
        }

        if (cityCandidate && cityCandidate.length > 1 && !/^\d+$/.test(cityCandidate)) {
          return {
            city: titleCase(cityCandidate),
            state: possibleState,
            confidence: "high",
          };
        }
      }
    }
  }

  // ── Strategy 2: No state found via commas — try last comma-part as city ──
  if (parts.length >= 2) {
    // Check if the last or second-to-last part looks like a city name
    for (let i = parts.length - 1; i >= 1; i--) {
      const candidate = parts[i]
        .replace(/\s+\d{5}(-\d{4})?$/, "")
        .trim();
      if (
        candidate &&
        candidate.length > 1 &&
        !/^\d+$/.test(candidate) &&
        !STATE_ABBRS.has(candidate.toUpperCase()) &&
        !/^(apt|suite|unit|ste|bldg|floor|fl|#)\s/i.test(candidate)
      ) {
        return {
          city: titleCase(candidate),
          state: existingState,
          confidence: "medium",
        };
      }
    }
  }

  // ── Strategy 3: No commas — try to parse "Street City ST ZIP" ──
  if (parts.length === 1) {
    const words = cleaned.split(/\s+/);
    // Find state abbreviation
    for (let i = words.length - 1; i >= 1; i--) {
      const word = words[i].replace(/[.,]/g, "").toUpperCase();
      if (STATE_ABBRS.has(word)) {
        // City is the word(s) between the last street suffix and the state
        let cityStart = 0;
        for (let j = 0; j < i; j++) {
          const w = words[j].toLowerCase().replace(/[.,]/g, "");
          if (STREET_SUFFIXES.has(w)) {
            cityStart = j + 1;
          }
        }
        if (cityStart > 0 && cityStart < i) {
          const cityWords = words.slice(cityStart, i);
          const city = cityWords.join(" ").replace(/[.,]/g, "").trim();
          if (city && city.length > 1) {
            return {
              city: titleCase(city),
              state: word,
              confidence: "medium",
            };
          }
        }
      }
    }
  }

  return { city: null, state: existingState, confidence: "low" };
}

/**
 * Given a line like "5201 Commonwealth Street Detroit",
 * tries to extract just the city from after the street suffix.
 */
function extractCityFromStreetLine(line: string): string {
  const words = line.split(/\s+/);
  let lastSuffixIndex = -1;

  for (let i = 0; i < words.length; i++) {
    const w = words[i].toLowerCase().replace(/[.,]/g, "");
    if (STREET_SUFFIXES.has(w)) {
      lastSuffixIndex = i;
    }
  }

  if (lastSuffixIndex >= 0 && lastSuffixIndex < words.length - 1) {
    return words.slice(lastSuffixIndex + 1).join(" ").replace(/[.,]/g, "").trim();
  }

  // No suffix found — return last word(s) as a guess
  if (words.length >= 3) {
    // Take everything after the first 2 words (likely street number + name)
    return words.slice(2).join(" ").replace(/[.,]/g, "").trim();
  }

  return line;
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function CityFixer() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<FixCandidate[]>([]);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(0);
  const [showOnlyHigh, setShowOnlyHigh] = useState(false);
  const [done, setDone] = useState(false);

  // ── Scan for fixable records ──
  useEffect(() => {
    async function scan() {
      setLoading(true);

      // Fetch records with missing city but with an address
      const { data, error } = await supabase
        .from("external_sales")
        .select("id, title, address, city, state")
        .or("city.is.null,city.eq.")
        .not("address", "is", null)
        .not("address", "eq", "")
        .order("collected_at", { ascending: false })
        .limit(5000);

      if (error) {
        console.error("CityFixer scan failed:", error);
        setLoading(false);
        return;
      }

      const results: FixCandidate[] = (data || []).map((row: any) => {
        const { city, state, confidence } = extractCityFromAddress(
          row.address,
          row.state
        );
        return {
          id: row.id,
          address: row.address,
          state: row.state,
          currentCity: row.city,
          extractedCity: city,
          extractedState: state,
          title: row.title || "Untitled",
          confidence,
          selected: confidence === "high", // Auto-select high confidence
        };
      });

      // Only show results where we actually extracted a city
      setCandidates(results.filter((r) => r.extractedCity));
      setLoading(false);
    }

    scan();
  }, []);

  // ── Filtered view ──
  const visibleCandidates = useMemo(() => {
    if (showOnlyHigh) return candidates.filter((c) => c.confidence === "high");
    return candidates;
  }, [candidates, showOnlyHigh]);

  const selectedCount = candidates.filter((c) => c.selected).length;
  const highCount = candidates.filter((c) => c.confidence === "high").length;
  const mediumCount = candidates.filter((c) => c.confidence === "medium").length;

  // ── Toggle selection ──
  function toggleSelect(id: string) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  }

  function selectAll() {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: true })));
  }

  function selectNone() {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: false })));
  }

  function selectHighOnly() {
    setCandidates((prev) =>
      prev.map((c) => ({ ...c, selected: c.confidence === "high" }))
    );
  }

  // ── Apply fixes ──
  async function applyFixes() {
    const toFix = candidates.filter((c) => c.selected && c.extractedCity);
    if (toFix.length === 0) return;

    const confirmed = confirm(
      `Apply city fix to ${toFix.length} listing${toFix.length !== 1 ? "s" : ""}? This will update the city field.`
    );
    if (!confirmed) return;

    setApplying(true);
    setApplied(0);

    // Process in batches of 50
    for (let i = 0; i < toFix.length; i += 50) {
      const batch = toFix.slice(i, i + 50);

      await Promise.all(
        batch.map(async (candidate) => {
          const updates: any = { city: candidate.extractedCity };
          if (candidate.extractedState && !candidate.state) {
            updates.state = candidate.extractedState;
          }

          const { error } = await supabase
            .from("external_sales")
            .update(updates)
            .eq("id", candidate.id);

          if (error) {
            console.error(`Failed to fix ${candidate.id}:`, error);
          }
        })
      );

      setApplied((prev) => prev + batch.length);
    }

    // Remove fixed items from the list
    setCandidates((prev) => prev.filter((c) => !c.selected));
    setApplying(false);
    setDone(true);
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
        <i className="fa-solid fa-spinner fa-spin text-ys-700 text-xl mb-3" />
        <p className="text-sm text-gray-500">
          Scanning listings for missing cities...
        </p>
      </div>
    );
  }

  // ── No candidates ──
  if (candidates.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <i className="fa-solid fa-check text-green-500 text-xl" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">
          {done ? "All fixes applied!" : "No fixable listings found"}
        </h3>
        <p className="text-sm text-gray-500">
          {done
            ? "The city field has been updated for all selected listings."
            : "All listings with addresses already have cities assigned."}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Summary bar ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">
              <i className="fa-solid fa-wrench text-ys-700 mr-2 text-xs" />
              City Fixer — {candidates.length} fixable listing
              {candidates.length !== 1 ? "s" : ""} found
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold mr-2">
                <i className="fa-solid fa-circle-check text-[8px]" />
                {highCount} high confidence
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                <i className="fa-solid fa-circle-question text-[8px]" />
                {mediumCount} medium confidence
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={selectHighOnly}
              className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-xs font-semibold transition"
            >
              Select High Only
            </button>
            <button
              onClick={selectAll}
              className="px-3 py-2 bg-ys-50 hover:bg-ys-100 text-ys-800 rounded-xl text-xs font-semibold transition"
            >
              Select All ({candidates.length})
            </button>
            <button
              onClick={selectNone}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
            >
              Deselect All
            </button>
            <button
              onClick={() => setShowOnlyHigh(!showOnlyHigh)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                showOnlyHigh
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {showOnlyHigh ? "Showing High Only" : "Show All"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Apply button ── */}
      {selectedCount > 0 && (
        <div className="bg-ys-50 border border-ys-200 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-ys-900">
            <i className="fa-solid fa-wand-magic-sparkles mr-2 text-xs" />
            {selectedCount} listing{selectedCount !== 1 ? "s" : ""} selected for city fix
          </p>
          <button
            onClick={applyFixes}
            disabled={applying}
            className="px-5 py-2.5 bg-ys-700 hover:bg-ys-800 text-white rounded-xl text-sm font-bold transition flex items-center gap-2"
          >
            {applying ? (
              <>
                <i className="fa-solid fa-spinner fa-spin text-xs" />
                Applying... ({applied}/{selectedCount})
              </>
            ) : (
              <>
                <i className="fa-solid fa-check text-xs" />
                Apply {selectedCount} Fix{selectedCount !== 1 ? "es" : ""}
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Candidate list ── */}
      <div className="space-y-2">
        {visibleCandidates.map((c) => (
          <div
            key={c.id}
            className={`bg-white border rounded-xl p-3 flex items-start gap-3 transition ${
              c.selected
                ? "border-ys-400 ring-1 ring-ys-200"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleSelect(c.id)}
              className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition ${
                c.selected
                  ? "bg-ys-600 text-white"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
            >
              {c.selected && <i className="fa-solid fa-check text-[10px]" />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {c.title}
                </p>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    c.confidence === "high"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {c.confidence === "high" ? (
                    <i className="fa-solid fa-circle-check text-[8px]" />
                  ) : (
                    <i className="fa-solid fa-circle-question text-[8px]" />
                  )}
                  {c.confidence}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                <div>
                  <span className="text-gray-400 font-medium">Address: </span>
                  <span className="text-gray-600">{c.address}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Extracted City: </span>
                  <span className="text-ys-700 font-bold">{c.extractedCity}</span>
                  {c.extractedState && !c.state && (
                    <span className="text-purple-600 font-bold ml-1">
                      + State: {c.extractedState}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {visibleCandidates.length > 20 && (
        <p className="text-center text-xs text-gray-400 mt-4">
          Showing {visibleCandidates.length} candidates
        </p>
      )}
    </div>
  );
}
