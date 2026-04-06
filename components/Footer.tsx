import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-6">
      <div className="mx-auto max-w-6xl px-5">
        {/* GRID */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 mb-12">
          
          {/* BRAND */}
          <div>
            <div className="flex items-center gap-2 text-white text-xl font-bold mb-3">
              <span className="text-emerald-400 text-2xl">🛒</span>
              Yard<span className="text-emerald-400">Shoppers</span>
            </div>

            <p className="text-sm leading-relaxed">
              The nationwide marketplace for yard sales, garage sales, and estate sales. 
              Find hidden treasures in your neighborhood or post your own sale to reach thousands of local buyers.
            </p>

            <div className="flex gap-3 mt-4">
              <a className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
              <a className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition">
                <i className="fa-brands fa-instagram"></i>
              </a>
              <a className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition">
                <i className="fa-brands fa-tiktok"></i>
              </a>
              <a className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition">
                <i className="fa-brands fa-x-twitter"></i>
              </a>
            </div>
          </div>

          {/* EXPLORE */}
          <div>
            <h4 className="text-white font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/browse" className="hover:text-emerald-400">Browse Sales</Link></li>
              <li><Link href="/post" className="hover:text-emerald-400">Post a Sale</Link></li>
              <li><Link href="#" className="hover:text-emerald-400">Sale Map</Link></li>
              <li><Link href="#" className="hover:text-emerald-400">This Weekend</Link></li>
              <li><Link href="#" className="hover:text-emerald-400">Estate Sales</Link></li>
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-emerald-400">About Us</Link></li>
              <li><Link href="#" className="hover:text-emerald-400">How It Works</Link></li>
              <li><Link href="#" className="hover:text-emerald-400">Blog</Link></li>
              <li><Link href="#" className="hover:text-emerald-400">Contact</Link></li>
              <li><Link href="#" className="hover:text-emerald-400">Careers</Link></li>
            </ul>
          </div>

          {/* SUPPORT */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-emerald-400">Help Center</Link></li>
              <li><Link href="#" className="hover:text-emerald-400">Safety Tips</Link></li>
              <li><Link href="#" className="hover:text-emerald-400">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-emerald-400">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-emerald-400">Advertise With Us</Link></li>
            </ul>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between text-xs text-gray-500">
          <span>© 2026 YardShoppers.com — All Rights Reserved.</span>
          <span className="mt-2 md:mt-0">
            Made with <span className="text-red-500">♥</span> for treasure hunters everywhere
          </span>
        </div>
      </div>
    </footer>
  );
}
