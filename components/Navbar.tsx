"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u);
      setLoading(false);
    }
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🏷️</span>
          <span className="text-xl font-extrabold text-ys-900 tracking-tight hidden sm:inline">
            Yard<span className="text-ys-700">Shoppers</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/browse"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-ys-800 rounded-lg hover:bg-ys-50 transition-all"
          >
            Browse Sales
          </Link>
          <a
            href="#how-it-works"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-ys-800 rounded-lg hover:bg-ys-50 transition-all"
          >
            How It Works
          </a>
          {!loading && user && (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-ys-800 rounded-lg hover:bg-ys-50 transition-all flex items-center gap-1.5"
            >
              <i className="fa-solid fa-user text-xs" />
              My Account
            </Link>
          )}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-9 bg-gray-100 rounded-lg animate-pulse" />
          ) : user ? (
            <>
              <Link
                href="/post"
                className="flex items-center gap-2 bg-ys-800 hover:bg-ys-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg"
              >
                <i className="fa-solid fa-plus text-xs" />
                Post a Sale
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
              >
                <i className="fa-solid fa-right-from-bracket text-xs" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-ys-800 transition"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-ys-800 hover:bg-ys-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg"
              >
                Sign up free
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
          aria-label="Menu"
        >
          <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"} text-lg text-gray-700`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1">
          <Link
            href="/browse"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-ys-50 hover:text-ys-800 rounded-lg transition"
          >
            Browse Sales
          </Link>
          <a
            href="#how-it-works"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-ys-50 hover:text-ys-800 rounded-lg transition"
          >
            How It Works
          </a>

          <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
            {loading ? (
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-ys-800 hover:bg-ys-50 rounded-lg transition"
                >
                  <i className="fa-solid fa-user text-xs" />
                  My Account
                </Link>
                <Link
                  href="/post"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-ys-800 hover:bg-ys-50 rounded-lg transition"
                >
                  <i className="fa-solid fa-plus text-xs" />
                  Post a Sale
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <i className="fa-solid fa-right-from-bracket text-xs" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-ys-50 rounded-lg transition"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm font-semibold text-ys-800 bg-ys-50 rounded-lg text-center"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
