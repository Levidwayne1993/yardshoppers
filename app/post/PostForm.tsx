"use client";

import { useTransition } from "react";
import { createListing } from "./actions";

export default function PostForm() {
  const [isPending, startTransition] = useTransition();

  return (
    <main className="bg-white min-h-screen px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Post a Yard Sale
        </h1>

        <form
          action={(formData) => {
            startTransition(() => createListing(formData));
          }}
          className="space-y-6"
        >
          {/* TITLE */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Sale Title
            </label>
            <input
              name="title"
              type="text"
              placeholder="Huge Multi-Family Yard Sale"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          </div>

          {/* CITY */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              City
            </label>
            <input
              name="city"
              type="text"
              placeholder="Olympia"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          </div>

          {/* STATE */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              State
            </label>
            <input
              name="state"
              type="text"
              placeholder="WA"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          </div>

          {/* DATE */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Date
            </label>
            <input
              name="date"
              type="date"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          </div>

          {/* TIME */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Time
            </label>
            <input
              name="time"
              type="time"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Tell buyers what to expect..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 h-32"
              required
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? "Posting..." : "Submit Sale"}
          </button>
        </form>
      </div>
    </main>
  );
}
