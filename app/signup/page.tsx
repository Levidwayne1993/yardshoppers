"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // ⭐ Supabase client goes RIGHT HERE
  const supabase = createClientComponentClient();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border">

        {/* Title */}
        <h1 className="text-3xl font-bold mb-6 text-center">Create Account</h1>

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
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Signup Button */}
        <button
          onClick={async () => {
            if (password !== confirm) {
              alert("Passwords do not match");
              return;
            }

            const { error } = await supabase.auth.signUp({
              email,
              password,
            });

            if (error) {
              alert(error.message);
              return;
            }

            // Redirect to login page after successful signup
            window.location.href = "/login";
          }}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          Create Account
        </button>

        {/* Divider */}
        <div className="text-center my-4 text-gray-500">or</div>

        {/* Google Signup */}
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
          Sign up with Google
        </button>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-green-700 font-medium hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
