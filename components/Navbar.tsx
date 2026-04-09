"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🏷️</span>
            <span className="text-xl font-bold text-ys-800 tracking-tight">
              YardShoppers
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/browse"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-ys-700 hover:bg-ys-50 transition"
            >
              <i className="fa-solid fa-magnifying-glass mr-1.5" aria-hidden="true" />
              Browse Sales
            </Link>

            <Link
              href="/route-planner"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-ys-700 hover:bg-ys-50 transition"
            >
              <i className="fa-solid fa-route mr-1.5" aria-hidden="true" />
              Route Planner
            </Link>

            <a
              href="/#how-it-works"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-ys-700 hover:bg-ys-50 transition"
            >
              <i className="fa-solid fa-circle-info mr-1.5" aria-hidden="true" />
              How It Works
            </a>

            {user && (
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-ys-700 hover:bg-ys-50 transition"
              >
                <i className="fa-solid fa-user mr-1.5" aria-hidden="true" />
                My Account
              </Link>
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                href="/post"
                className="px-4 py-2 rounded-xl bg-ys-600 text-white text-sm font-semibold hover:bg-ys-700 transition shadow-sm"
              >
                <i className="fa-solid fa-plus mr-1.5" aria-hidden="true" />
                Post a Sale
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-ys-700 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl bg-ys-600 text-white text-sm font-semibold hover:bg-ys-700 transition shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
          >
            <i
              className={`fa-solid ${
                menuOpen ? "fa-xmark" : "fa-bars"
              } text-gray-600 text-lg`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pb-4 pt-2 space-y-1">
          <Link
            href="/browse"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-ys-50 transition"
          >
            <i className="fa-solid fa-magnifying-glass mr-2 text-ys-600" aria-hidden="true" />
            Browse Sales
          </Link>

          <Link
            href="/route-planner"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-ys-50 transition"
          >
            <i className="fa-solid fa-route mr-2 text-ys-600" aria-hidden="true" />
            Route Planner
          </Link>

          <a
            href="/#how-it-works"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-ys-50 transition"
          >
            <i className="fa-solid fa-circle-info mr-2 text-ys-600" aria-hidden="true" />
            How It Works
          </a>

          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-ys-50 transition"
            >
              <i className="fa-solid fa-user mr-2 text-ys-600" aria-hidden="true" />
              My Account
            </Link>
          )}

          <div className="pt-2 border-t border-gray-100">
            {user ? (
              <Link
                href="/post"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-center px-4 py-2.5 rounded-xl bg-ys-600 text-white text-sm font-semibold hover:bg-ys-700 transition"
              >
                <i className="fa-solid fa-plus mr-1.5" aria-hidden="true" />
                Post a Sale
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-xl bg-ys-600 text-white text-sm font-semibold hover:bg-ys-700 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
