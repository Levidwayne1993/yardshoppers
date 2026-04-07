"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";

export default function DashboardPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);
      setCheckingAuth(false);
    };

    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">My Account</h1>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Account Info</h2>
            <p className="text-gray-700">
              <span className="font-medium">Email:</span> {user.email}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/saved"
              className="w-full text-center bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              View Saved Listings
            </Link>
            <Link
              href="/browse"
              className="w-full text-center bg-white border py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Browse All Listings
            </Link>
            <Link
              href="/post"
              className="w-full text-center bg-emerald-700 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 transition"
            >
              Post a New Sale
            </Link>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
