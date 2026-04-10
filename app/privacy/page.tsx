import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how YardShoppers collects, uses, and protects your personal information. Your privacy matters to us.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-gray-400 mb-10">
        Last updated: April 9, 2026
      </p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
          <p>When you use YardShoppers, we may collect the following information:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Account information:</strong> Name, email address, and display name when you create an account.</li>
            <li><strong>Listing information:</strong> Sale details, photos, address, categories, dates, and times you provide when posting a listing.</li>
            <li><strong>Location data:</strong> Your approximate location (with your permission) to show nearby yard sales.</li>
            <li><strong>Usage data:</strong> Pages visited, features used, and interactions to improve our service.</li>
            <li><strong>Payment data:</strong> If you purchase a boosted listing, payment is processed securely through Stripe. We do not store your credit card details.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To display and operate yard sale listings</li>
            <li>To show you relevant sales near your location</li>
            <li>To process payments for premium features</li>
            <li>To communicate with you about your account or listings</li>
            <li>To improve and personalize your experience</li>
            <li>To prevent fraud and enforce our Terms of Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Information Sharing</h2>
          <p>
            We do not sell your personal information. We may share limited data with:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Service providers:</strong> Hosting (Vercel), database (Supabase), payments (Stripe), and analytics tools that help us run YardShoppers.</li>
            <li><strong>Other users:</strong> Your display name and listing details are visible to anyone browsing YardShoppers.</li>
            <li><strong>Legal requirements:</strong> If required by law or to protect the rights and safety of our users.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cookies &amp; Tracking</h2>
          <p>
            We use essential cookies to keep you logged in and remember your preferences.
            We may use analytics tools to understand how people use YardShoppers. You
            can disable cookies in your browser settings, but some features may not
            work properly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Security</h2>
          <p>
            We take reasonable measures to protect your data, including encrypted
            connections (HTTPS), secure authentication through Supabase, and
            PCI-compliant payment processing through Stripe. However, no system
            is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Opt out of non-essential communications</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:support@yardshoppers.com" className="text-ys-800 font-semibold hover:underline">
              support@yardshoppers.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Children&apos;s Privacy</h2>
          <p>
            YardShoppers is not intended for children under the age of 13. We do
            not knowingly collect personal information from children. If you
            believe a child has provided us with personal data, please contact us
            and we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of significant changes by posting a notice on our website. Your
            continued use of YardShoppers after changes are posted constitutes
            your acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at{" "}
            <a href="mailto:support@yardshoppers.com" className="text-ys-800 font-semibold hover:underline">
              support@yardshoppers.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
