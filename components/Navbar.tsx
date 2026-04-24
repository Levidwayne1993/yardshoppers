"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchUnread(data.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUnread(session.user.id);
      else setUnreadCount(0);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Re-fetch unread count when navigating away from messages page
  useEffect(() => {
    if (user && pathname !== "/messages") {
      fetchUnread(user.id);
    }
    if (user && pathname === "/messages") {
      // Small delay to let the page mark messages as read
      const timer = setTimeout(() => fetchUnread(user.id), 2000);
      return () => clearTimeout(timer);
    }
  }, [pathname, user]);

  const fetchUnread = async (userId: string) => {
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("is_read", false);
    setUnreadCount(count || 0);
  };

  const mobileNav = [
    { href: "/", icon: "fa-house", label: "Home" },
    { href: "/browse", icon: "fa-magnifying-glass", label: "Browse" },
    {
      href: "/messages",
      icon: "fa-envelope",
      label: "Messages",
      badge: true,
    },
    { href: "/post", icon: "fa-plus", label: "Post" },
    {
      href: user ? "/dashboard" : "/login",
      icon: "fa-user",
      label: user ? "Account" : "Log In",
    },
  ];

  return (
    <>
      {/* ── A11Y FIX: added aria-label="Main navigation" ── */}
      <nav
        className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 flex-shrink-0"
            >
              <span className="text-2xl" aria-hidden="true">
                🏷️
              </span>
              <span className="text-xl font-bold text-ys-800 tracking-tight">
                YardShoppers
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/browse"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === "/browse"
                    ? "text-ys-700 bg-ys-50"
                    : "text-gray-600 hover:text-ys-700 hover:bg-ys-50"
                }`}
              >
                <i
                  className="fa-solid fa-magnifying-glass mr-1.5"
                  aria-hidden="true"
                />
                Browse Sales
              </Link>

              <Link
                href="/route-planner"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === "/route-planner"
                    ? "text-ys-700 bg-ys-50"
                    : "text-gray-600 hover:text-ys-700 hover:bg-ys-50"
                }`}
              >
                <i
                  className="fa-solid fa-route mr-1.5"
                  aria-hidden="true"
                />
                Route Planner
              </Link>

              <a
                href="/#how-it-works"
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-ys-700 hover:bg-ys-50 transition"
              >
                <i
                  className="fa-solid fa-circle-info mr-1.5"
                  aria-hidden="true"
                />
                How It Works
              </a>

              {user && (
                <Link
                  href="/messages"
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition ${
                    pathname === "/messages"
                      ? "text-ys-700 bg-ys-50"
                      : "text-gray-600 hover:text-ys-700 hover:bg-ys-50"
                  }`}
                >
                  <i
                    className="fa-solid fa-envelope mr-1.5"
                    aria-hidden="true"
                  />
                  Messages
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 left-[72px] bg-[#FF6B35] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
                      aria-label={`${unreadCount} unread messages`}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {user && (
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    pathname === "/dashboard"
                      ? "text-ys-700 bg-ys-50"
                      : "text-gray-600 hover:text-ys-700 hover:bg-ys-50"
                  }`}
                >
                  <i
                    className="fa-solid fa-user mr-1.5"
                    aria-hidden="true"
                  />
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
                  <i
                    className="fa-solid fa-plus mr-1.5"
                    aria-hidden="true"
                  />
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

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 pb-4 pt-2 space-y-1">
            <Link
              href="/browse"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-ys-50 transition"
            >
              <i
                className="fa-solid fa-magnifying-glass mr-2 text-ys-600"
                aria-hidden="true"
              />
              Browse Sales
            </Link>
            <Link
              href="/route-planner"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-ys-50 transition"
            >
              <i
                className="fa-solid fa-route mr-2 text-ys-600"
                aria-hidden="true"
              />
              Route Planner
            </Link>
            <a
              href="/#how-it-works"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-ys-50 transition"
            >
              <i
                className="fa-solid fa-circle-info mr-2 text-ys-600"
                aria-hidden="true"
              />
              How It Works
            </a>
            {user && (
              <Link
                href="/messages"
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-ys-50 transition"
              >
                <i
                  className="fa-solid fa-envelope mr-2 text-ys-600"
                  aria-hidden="true"
                />
                Messages
                {unreadCount > 0 && (
                  <span
                    className="ml-auto bg-[#FF6B35] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
                    aria-label={`${unreadCount} unread messages`}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            {user && (
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-ys-50 transition"
              >
                <i
                  className="fa-solid fa-user mr-2 text-ys-600"
                  aria-hidden="true"
                />
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
                  <i
                    className="fa-solid fa-plus mr-1.5"
                    aria-hidden="true"
                  />
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

      {/* Mobile bottom nav bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-14 px-1">
          {mobileNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition ${
                  isActive
                    ? "text-ys-700"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <div className="relative">
                  <i
                    className={`fa-solid ${item.icon} text-base ${
                      isActive ? "text-ys-700" : ""
                    }`}
                    aria-hidden="true"
                  />
                  {item.badge && unreadCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2.5 bg-[#FF6B35] text-white text-[8px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-0.5"
                      aria-label={`${unreadCount} unread`}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer so page content doesn't hide behind the fixed bottom nav */}
      <div className="md:hidden h-14" />
    </>
  );
}
