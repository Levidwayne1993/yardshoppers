import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
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
                <Link href="/blog" className="text-sm hover:text-white transition">
                  Blog &amp; Tips
                </Link>
              </li>
              <li>
                <Link href="/route-planner" className="text-sm hover:text-white transition">
                  <i className="fa-solid fa-route mr-1.5 text-ys-500" aria-hidden="true" />
                  Route Planner
                </Link>
              </li>
              <li>
                <Link href="/yard-sales" className="text-sm hover:text-white transition">
                  Sales by City
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
                <Link href="/tips" className="text-sm hover:text-white transition">
                  Selling Tips
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm hover:text-white transition">
                  Featured Listings
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm hover:text-white transition">
                  Seller Dashboard
                </Link>
              </li>
            </ul>
          </nav>

          {/* Popular Cities */}
          <nav aria-label="Popular cities for yard sales">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Popular Cities
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/yard-sales/olympia-wa" className="text-sm hover:text-white transition">
                  Olympia, WA
                </Link>
              </li>
              <li>
                <Link href="/yard-sales/seattle-wa" className="text-sm hover:text-white transition">
                  Seattle, WA
                </Link>
              </li>
              <li>
                <Link href="/yard-sales/tacoma-wa" className="text-sm hover:text-white transition">
                  Tacoma, WA
                </Link>
              </li>
              <li>
                <Link href="/yard-sales/portland-or" className="text-sm hover:text-white transition">
                  Portland, OR
                </Link>
              </li>
              <li>
                <Link href="/yard-sales/los-angeles-ca" className="text-sm hover:text-white transition">
                  Los Angeles, CA
                </Link>
              </li>
              <li>
                <Link href="/yard-sales/houston-tx" className="text-sm hover:text-white transition">
                  Houston, TX
                </Link>
              </li>
              <li>
                <Link href="/yard-sales/chicago-il" className="text-sm hover:text-white transition">
                  Chicago, IL
                </Link>
              </li>
              <li>
                <Link href="/yard-sales" className="text-sm text-ys-500 hover:text-ys-400 transition font-medium">
                  View All Cities →
                </Link>
              </li>
            </ul>
          </nav>

          {/* Company + Social combined */}
          <div className="space-y-8">
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

            <nav aria-label="Social media links">
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Follow Us
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="https://instagram.com/yardshoppers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-white transition inline-flex items-center gap-2"
                    aria-label="Follow YardShoppers on Instagram"
                  >
                    <i className="fa-brands fa-instagram" aria-hidden="true" />
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://facebook.com/yardshoppers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-white transition inline-flex items-center gap-2"
                    aria-label="Follow YardShoppers on Facebook"
                  >
                    <i className="fa-brands fa-facebook" aria-hidden="true" />
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href="https://tiktok.com/@yardshoppers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-white transition inline-flex items-center gap-2"
                    aria-label="Follow YardShoppers on TikTok"
                  >
                    <i className="fa-brands fa-tiktok" aria-hidden="true" />
                    TikTok
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/yardshoppers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-white transition inline-flex items-center gap-2"
                    aria-label="Follow YardShoppers on X"
                  >
                    <i className="fa-brands fa-x-twitter" aria-hidden="true" />
                    X (Twitter)
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-ys-600 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-store text-xs text-white" aria-hidden="true" />
            </div>
            <span className="text-white font-bold text-sm">YardShoppers</span>
          </div>
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} YardShoppers. All rights reserved.
            Find yard sales and garage sales near you.
          </p>
        </div>
      </div>
    </footer>
  );
}
