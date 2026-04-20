import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageViewTracker from "@/components/PageViewTracker";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

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
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
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
        url: "/og-image.png",
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
    images: ["/og-image.png"],
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
        sameAs: [],
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
        <link
          rel="preconnect"
          href="https://cdnjs.cloudflare.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          media="print"
          // @ts-ignore
          onLoad="this.media='all'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans bg-white text-gray-900 min-h-screen flex flex-col">
        <PageViewTracker />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
