'use client';

import { Search, Menu } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full bg-brand-green text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        
        {/* Logo */}
        <div className="text-2xl font-bold tracking-tight">
          YardShoppers
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-white rounded-full px-4 py-2 w-1/2 shadow-sm">
          <Search className="text-gray-500 mr-2" size={18} />
          <input
            type="text"
            placeholder="Search yard sales..."
            className="w-full outline-none text-gray-700"
          />
        </div>

        {/* CTA + Menu */}
        <div className="flex items-center gap-4">
          <button className="hidden md:block bg-brand-orange text-white px-4 py-2 rounded-full font-semibold shadow hover:opacity-90 transition">
            Post a Sale
          </button>

          <Menu className="md:hidden" size={28} />
        </div>
      </div>
    </header>
  );
}
