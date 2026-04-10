import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pb-16 md:pb-0">
      {/* Top CTA Band */}
      <div className="bg-gradient-to-r from-ys-900 via-ys-800 to-ys-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h3 className="text-xl font-bold text-white">
              Ready to turn your clutter into cash?
            </h3>
            <p className="text-ys-300 text-sm mt-1">
              Post your yard sale in under 2 minutes — completely free.
            </p>
          </div>
          <Link
            href="/post"
            className="px-8 py-3 bg-white text-ys-800 font-semibold rounded-full hover:bg-ys-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Post a Sale — It&apos;s Free
          </Link>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl" aria-hidden="true">🏷️</span>
              <span className="text-lg font-extrabold text-white tracking-tight">
                Yard<span className="text-ys-500">Shoppers</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Your neighborhood marketplace for yard sales, garage sales, and
              estate sales. Buy local, save big, reduce waste.
            </p>
            <nav aria-label="Social media links" className="flex gap-3 mt-5">
              <a
                href="https://facebook.com/yardshoppers"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow YardShoppers on Facebook"
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-ys-800 flex items-center justify-center transition"
              >
                <i className="fa-brands fa-facebook-f text-sm" aria-hidden="true" />
              </a>
              <a
                href="https://instagram.com/yardshoppers"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow YardShoppers on Instagram"
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-ys-800 flex items-center justify-center transition"
              >
                <i className="fa-brands fa-instagram text-sm" aria-hidden="true" />
              </a>
              <a
                href="https://x.com/yardshoppers"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow YardShoppers on X"
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-ys-800 flex items-center justify-center transition"
              >
                <i className="fa-brands fa-x-twitter text-sm" aria-hidden="true" />
              </a>
              <a
                href="https://tiktok.com/@yardshoppers"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow YardShoppers on TikTok"
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-ys-800 flex items-center justify-center transition"
              >
                <i className="fa-brands fa-tiktok text-sm" aria-hidden="true" />
              </a>
            </nav>
          </div>

          {/* Explore */}
          <nav aria-label="Explore yard sales">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/browse" className="text-sm hover:text-white transition">
                  Browse Sales
                </Link>
              </li>
              <li>
                <Link href="/route-planner" className="text-sm hover:text-white transition">
                  <i className="fa-solid fa-route mr-1.5 text-ys-500" aria-hidden="true" />
                  Route Planner
                </Link>
              </li>
              <li>
                <Link href="/browse?category=Furniture" className="text-sm hover:text-white transition">
                  Furniture
                </Link>
              </li>
              <li>
                <Link href="/browse?category=Electronics" className="text-sm hover:text-white transition">
                  Electronics
                </Link>
              </li>
              <li>
                <Link href="/browse?category=Clothing" className="text-sm hover:text-white transition">
                  Clothing
                </Link>
              </li>
              <li>
                <Link href="/browse?category=Free+Stuff" className="text-sm hover:text-white transition">
                  Free Stuff
                </Link>
              </li>
            </ul>
          </nav>

          {/* Sellers */}
          <nav aria-label="Seller resources">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Sellers
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/post" className="text-sm hover:text-white transition">
                  Post a Sale
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm hover:text-white transition">
                  Seller Dashboard
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm hover:text-white transition">
                  Featured Listings
                </Link>
              </li>
              <li>
                <Link href="/tips" className="text-sm hover:text-white transition">
                  Selling Tips
                </Link>
              </li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company information">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="text-sm hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm hover:text-white transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} YardShoppers. All rights reserved.</p>
          <p>
            Made with <span className="text-red-400" aria-label="love">♥</span> for treasure hunters everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
