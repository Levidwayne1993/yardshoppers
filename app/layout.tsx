import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageViewTracker from "@/components/PageViewTracker";
import CookieConsent from "@/components/CookieConsent";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-P3N8VNGV";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.yardshoppers.com"),
  title: {
    default: "YardShoppers — Discover Yard Sales Near You",
    template: "%s | YardShoppers",
  },
  description:
    "Find amazing yard sales, garage sales, and estate sales in your area. Post your sale for free and reach thousands of local buyers.",
  keywords: [
    "yard sales",
    "garage sales",
    "estate sales",
    "yard sales near me",
    "garage sales near me",
    "used items for sale",
    "local yard sales",
    "community sales",
    "secondhand deals",
    "yard sale finder",
  ],
  authors: [{ name: "YardShoppers" }],
  creator: "YardShoppers",
  publisher: "YardShoppers",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.yardshoppers.com",
    siteName: "YardShoppers",
    title: "YardShoppers — Discover Yard Sales Near You",
    description:
      "Find amazing yard sales, garage sales, and estate sales in your area. Post your sale for free and reach thousands of local buyers.",
    images: [
      {
        url: "https://www.yardshoppers.com/og-image.png",

        width: 1200,
        height: 630,
        alt: "YardShoppers — Discover Yard Sales Near You",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YardShoppers — Discover Yard Sales Near You",
    description:
      "Find amazing yard sales, garage sales, and estate sales in your area. Post your sale for free and reach thousands of local buyers.",
    images: ["https://www.yardshoppers.com/og-image.png"],
    creator: "@yardshoppers",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "YardShoppers",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.yardshoppers.com/#organization",
        name: "YardShoppers",
        url: "https://www.yardshoppers.com",
        logo: {
          "@type": "ImageObject",
          url: "https://www.yardshoppers.com/icon-512x512.png",
          width: 512,
          height: 512,
        },
        sameAs: [
          "https://www.facebook.com/yardshoppers",
          "https://www.instagram.com/yardshoppers",
          "https://www.tiktok.com/@yardshoppers",
          "https://x.com/yardshoppers",
          "https://www.youtube.com/@yardshoppers",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://www.yardshoppers.com/#website",
        url: "https://www.yardshoppers.com",
        name: "YardShoppers",
        description:
          "Find amazing yard sales, garage sales, and estate sales in your area.",
        publisher: {
          "@id": "https://www.yardshoppers.com/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate:
              "https://www.yardshoppers.com/browse?search={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en" className={poppins.variable}>
      <head>
        <meta name="theme-color" content="#15803d" />
        <meta name="geo.region" content="US" />

        {/* ── DNS prefetch for Font Awesome + GTM ── */}
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        <link
          rel="dns-prefetch"
          href="https://www.googletagmanager.com"
        />

        {/* ── GTM Consent Mode v2 defaults (MUST come BEFORE GTM script) ── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              window.gtag = function(){window.dataLayer.push(arguments);};
              window.gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'wait_for_update': 500
              });
              try {
                if (localStorage.getItem('ys_cookie_consent') === 'all') {
                  window.gtag('consent', 'update', {
                    'analytics_storage': 'granted',
                    'ad_storage': 'granted',
                    'ad_user_data': 'granted',
                    'ad_personalization': 'granted'
                  });
                }
              } catch(e) {}
            `,
          }}
        />

        {/* ── Google Tag Manager — PERF: lazyOnload cuts ~224ms TBT ── */}
        <Script
          id="gtm-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `,
          }}
        />

        {/* ── FIX #3: Font Awesome — LOAD NORMALLY ──
             The old code used media="print" + onLoad="this.media='all'"
             but onLoad as a string doesn't work in React/Next.js JSX.
             The stylesheet stayed as media="print" forever = icons never
             rendered on screen. Just load it normally. ── */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          crossOrigin="anonymous"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      </head>

      <body className="font-sans bg-white text-gray-900 min-h-screen flex flex-col">
        {/* ── Google Tag Manager (noscript fallback) ── */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <PageViewTracker />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
