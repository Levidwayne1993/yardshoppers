import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Have a question about YardShoppers? Get in touch with our team for support, feedback, or partnership inquiries.",
  alternates: {
    canonical: "/contact",
  },
  other: {
    "script:ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is it free to post a yard sale?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! Posting a sale on YardShoppers is 100% free. You can optionally boost your listing for more visibility.",
          },
        },
        {
          "@type": "Question",
          name: "How do I edit or delete my listing?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Log in and go to your Seller Dashboard. You can edit details, update photos, or remove your listing at any time.",
          },
        },
        {
          "@type": "Question",
          name: "How do I report an inappropriate listing?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Click the 'Report this listing' link on any listing page, or email us at support@yardshoppers.com. We review reports promptly.",
          },
        },
        {
          "@type": "Question",
          name: "Can I use YardShoppers on my phone?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Absolutely. YardShoppers works great on any device — phone, tablet, or desktop. You can even add it to your home screen for quick access.",
          },
        },
      ],
    }),
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
