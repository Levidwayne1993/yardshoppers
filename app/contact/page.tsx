// In ContactPage, change:
//   return ( <div className="max-w-3xl ...
// To:
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
          }),
        }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* ... rest of your contact page stays the same ... */}
      </div>
    </>
  );
