"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ⭐ Supabase client goes RIGHT HERE
  const supabase = createClientComponentClient();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border">

        {/* Title */}
        <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Login Button */}
        <button
          onClick={async () => {
            const { error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) {
              alert(error.message);
              return;
            }

            window.location.href = "/";
          }}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          Login
        </button>

        {/* Divider */}
        <div className="text-center my-4 text-gray-500">or</div>

        {/* Google Login */}
        <button
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${window.location.origin}/`,
              },
            });
          }}
          className="w-full bg-white border py-3 rounded-lg shadow-sm hover:bg-gray-100 transition"
        >
          Continue with Google
        </button>

        {/* Signup Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don’t have an account?{" "}
          <a href="/signup" className="text-green-700 font-medium hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
