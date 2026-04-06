"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { FiSearch, FiMenu } from "react-icons/fi";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const supabase = createClientComponentClient();

  // ⭐ Load logged-in user
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    loadUser();
  }, []);

  // ⭐ Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-5 px-5 py-3">

        {/* Logo */}
        <Link
          href="/"
          className="flex flex-shrink-0 items-center gap-2 text-xl font-bold text-emerald-700"
        >
          <span className="text-2xl text-emerald-400">🛒</span>
          <span>
            Yard<span className="text-emerald-400">Shoppers</span>
          </span>
        </Link>

        {/* Search (desktop) */}
        <div className="hidden flex-1 max-w-md items-center md:flex">
          <div className="relative w-full">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search local yard sales, items, neighborhoods..."
              className="w-full rounded-full border-2 border-gray-200 bg-gray-50 px-10 py-2 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>

        {/* Desktop links */}
        <div className="hidden items-center gap-2 md:flex">

          <Link
            href="/browse"
            className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-800"
          >
            Browse sales
          </Link>

          {/* ⭐ NOT LOGGED IN */}
          {!user && (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-800"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-800"
              >
                Sign up
              </Link>
            </>
          )}

          {/* ⭐ LOGGED IN */}
          {user && (
            <>
              <Link
                href="/saved"
                className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-800"
              >
                Saved
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-800"
              >
                My account
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
              >
                Logout
              </button>
            </>
          )}

          <Link
            href="/post"
            className="flex items-center gap-1 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-md"
          >
            Post a sale
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="inline-flex items-center rounded-full p-2 text-xl text-gray-600 hover:bg-gray-100 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <FiMenu />
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-5 pb-4 pt-2 md:hidden">

          {/* Mobile search */}
          <div className="mb-3">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search yard sales..."
                className="w-full rounded-full border-2 border-gray-200 bg-gray-50 px-10 py-2 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </div>

          {/* Mobile links */}
          <div className="flex flex-col gap-2">

            <Link
              href="/browse"
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Browse sales
            </Link>

            {/* ⭐ NOT LOGGED IN */}
            {!user && (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Sign up
                </Link>
              </>
            )}

            {/* ⭐ LOGGED IN */}
            {user && (
              <>
                <Link
                  href="/saved"
                  className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Saved
                </Link>

                <Link
                  href="/dashboard"
                  className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  My account
                </Link>

                <button
                  onClick={handleLogout}
                  className="rounded-full px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            )}

            <Link
              href="/post"
              className="rounded-full bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Post a sale
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
