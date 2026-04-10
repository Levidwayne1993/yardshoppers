import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the Terms of Service for YardShoppers. By using our platform, you agree to these terms governing yard sale listings, accounts, and community guidelines.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
        Terms of Service
      </h1>
      <p className="text-sm text-gray-400 mb-10">
        Last updated: April 9, 2026
      </p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using YardShoppers (&quot;the Service&quot;), you agree to be
            bound by these Terms of Service. If you do not agree to these terms,
            please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Accounts</h2>
          <p>
            You must create an account to post listings or save favorites. You
            are responsible for maintaining the security of your account and for
            all activity that occurs under it. You must be at least 13 years old
            to create an account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Listings &amp; Content</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You are solely responsible for the content of your listings, including descriptions, photos, pricing, and location accuracy.</li>
            <li>Listings must be for legitimate yard sales, garage sales, or estate sales.</li>
            <li>You may not post listings for prohibited items including firearms, ammunition, drugs, stolen goods, counterfeit items, or any items illegal to sell in your jurisdiction.</li>
            <li>We reserve the right to remove any listing at our discretion without notice.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Transactions</h2>
          <p>
            YardShoppers is a listing platform. All transactions between buyers
            and sellers happen in person at the yard sale. We are not a party to
            any transaction, do not guarantee any items, and are not responsible
            for disputes between buyers and sellers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Boosted Listings</h2>
          <p>
            Boosted listings are a paid feature that increases the visibility of
            your sale. Payments are processed securely through Stripe. Boosted
            listing fees are non-refundable once the boost is active. We do not
            guarantee any specific number of views or visitors from boosting.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Post false, misleading, or fraudulent listings</li>
            <li>Use the Service for commercial retail sales or ongoing business operations</li>
            <li>Harass, threaten, or abuse other users</li>
            <li>Attempt to scrape, crawl, or extract data from YardShoppers for commercial purposes</li>
            <li>Interfere with the operation of the Service or circumvent security measures</li>
            <li>Create multiple accounts to manipulate listings or reviews</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Intellectual Property</h2>
          <p>
            The YardShoppers name, logo, design, and code are the property of
            YardShoppers. You retain ownership of content you post (photos,
            descriptions) but grant us a non-exclusive, royalty-free license to
            display and distribute that content on our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Limitation of Liability</h2>
          <p>
            YardShoppers is provided &quot;as is&quot; without warranties of any kind. We
            are not liable for any damages arising from your use of the Service,
            including but not limited to loss of data, lost profits, or personal
            injury resulting from in-person transactions. Our total liability
            shall not exceed the amount you have paid us in the preceding 12
            months.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Termination</h2>
          <p>
            We may suspend or terminate your account at any time for violations
            of these Terms or for any reason at our sole discretion. You may
            delete your account at any time from your dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of
            YardShoppers after changes are posted constitutes acceptance of the
            updated Terms. We will notify users of significant changes via email
            or a notice on the site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact</h2>
          <p>
            Questions about these Terms? Reach out at{" "}
            <a href="mailto:support@yardshoppers.com" className="text-ys-800 font-semibold hover:underline">
              support@yardshoppers.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
