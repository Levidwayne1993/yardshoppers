import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Have a question about YardShoppers? Get in touch with our team for support, feedback, or partnership inquiries.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is it free to post a yard sale on YardShoppers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! Posting a yard sale on YardShoppers is 100% free. You can optionally boost your listing for more visibility starting at $2.99.",
        },
      },
      {
        "@type": "Question",
        name: "How do I edit or delete my yard sale listing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Log in and go to your Seller Dashboard at yardshoppers.com/dashboard. You can edit details, update photos, or remove your listing at any time.",
        },
      },
      {
        "@type": "Question",
        name: "How do I report an inappropriate listing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Click the Report this listing link on any listing page, or email support@yardshoppers.com. We review all reports promptly.",
        },
      },
      {
        "@type": "Question",
        name: "Can I use YardShoppers on my phone?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. YardShoppers works on any device including phones, tablets, and desktops. You can add it to your home screen for quick access like a native app.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        <p className="text-gray-600 mb-8">
          Have a question, suggestion, or need help? We&apos;d love to hear from
          you. Reach out using any of the methods below and we&apos;ll get back
          to you as soon as possible.
        </p>

        <div className="space-y-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Email Us</h2>
            <p className="text-gray-600">
              For general inquiries, support, or feedback:
            </p>
            <a
              href="mailto:support@yardshoppers.com"
              className="text-green-600 hover:underline font-medium"
            >
              support@yardshoppers.com
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Report a Listing</h2>
            <p className="text-gray-600">
              Found something inappropriate? Use the &quot;Report&quot; button on
              any listing page, or email us directly and include the listing URL.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Partnerships</h2>
            <p className="text-gray-600">
              Interested in partnering with YardShoppers? Reach out at{" "}
              <a
                href="mailto:support@yardshoppers.com"
                className="text-green-600 hover:underline font-medium"
              >
                support@yardshoppers.com
              </a>{" "}
              and let&apos;s talk.
            </p>
          </div>
        </div>

        <div className="border-t pt-10">
          <h2 className="text-2xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqSchema.mainEntity.map((item, index) => (
              <details
                key={index}
                className="bg-white rounded-lg shadow p-4 cursor-pointer"
              >
                <summary className="font-semibold text-gray-800">
                  {item.name}
                </summary>
                <p className="mt-2 text-gray-600">
                  {item.acceptedAnswer.text}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
