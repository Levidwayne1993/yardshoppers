"use client";

import { useState, useEffect } from "react";

type ConsentLevel = "all" | "essential" | null;

/* ── Extend Window so TypeScript knows about gtag ── */
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // If user already made a choice, don't show the banner
    const consent = localStorage.getItem("ys_cookie_consent");
    if (!consent) {
      // Small delay so it doesn't flash on initial load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      // Apply saved consent on page load
      applyConsent(consent as ConsentLevel);
    }
  }, []);

  function applyConsent(level: ConsentLevel) {
    if (typeof window === "undefined" || typeof window.gtag !== "function")
      return;

    if (level === "all") {
      // Grant all tracking
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    } else {
      // Essential only — deny tracking cookies
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
  }

  function handleAcceptAll() {
    localStorage.setItem("ys_cookie_consent", "all");
    localStorage.setItem("ys_cookie_consent_date", new Date().toISOString());
    applyConsent("all");
    setVisible(false);
  }

  function handleEssentialOnly() {
    localStorage.setItem("ys_cookie_consent", "essential");
    localStorage.setItem("ys_cookie_consent_date", new Date().toISOString());
    applyConsent("essential");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-[9999] p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200 p-5 sm:p-6">
        {/* ── Header ── */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl" aria-hidden="true">🍪</span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              We value your privacy
            </h2>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              We use cookies to improve your experience, analyze site traffic,
              and show you relevant ads. You can accept all cookies or choose
              essential cookies only.{" "}
              <a
                href="/privacy"
                className="text-green-700 underline hover:text-green-800"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        {/* ── Expandable details ── */}
        {showDetails && (
          <div className="mb-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 space-y-3">
            <div>
              <p className="font-medium text-gray-900">
                Essential Cookies (always active)
              </p>
              <p>
                Required for the site to function — authentication, security,
                and basic preferences. These cannot be disabled.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Analytics Cookies</p>
              <p>
                Help us understand how visitors use YardShoppers so we can
                improve the experience. Powered by Google Analytics.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Advertising Cookies</p>
              <p>
                Used to show you relevant ads and measure campaign performance.
                May be set by Google Ads or Meta.
              </p>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleAcceptAll}
            className="flex-1 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Accept All
          </button>
          <button
            onClick={handleEssentialOnly}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Essential Only
          </button>
          <button
            onClick={() => setShowDetails((d) => !d)}
            className="text-sm text-gray-500 underline hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded px-2 py-1"
          >
            {showDetails ? "Hide Details" : "Cookie Details"}
          </button>
        </div>
      </div>
    </div>
  );
}
