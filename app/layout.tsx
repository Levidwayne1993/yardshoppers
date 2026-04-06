import "./globals.css";
import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// ⭐ GLOBAL SEO + METADATA
export const metadata = {
  metadataBase: new URL("https://yardshoppers.com"),
  title: {
    default: "YardShoppers — Find Local Yard Sales Near You",
    template: "%s | YardShoppers",
  },
  description:
    "Discover local yard sales, garage sales, estate sales, and community events near you. Post your own yard sale for free and reach more local shoppers.",
  keywords: [
    "yard sales",
    "garage sales",
    "estate sales",
    "yard sales near me",
    "garage sales near me",
    "Olympia yard sales",
    "local yard sale listings",
    "post a yard sale",
    "community yard sale map",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://yardshoppers.com",
    siteName: "YardShoppers",
    title: "YardShoppers — Find Local Yard Sales Near You",
    description:
      "Browse local yard sales, garage sales, and estate sales. Post your own sale and reach more shoppers.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "YardShoppers — Local Yard Sales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YardShoppers — Find Local Yard Sales Near You",
    description:
      "Discover local yard sales, garage sales, and estate sales. Post your sale for free.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-800">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
