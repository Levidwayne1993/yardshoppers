import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Yard Sales Near You",
  description:
    "Search and filter yard sales, garage sales, and estate sales by category, distance, and location. Find furniture, electronics, tools, antiques, and more at bargain prices near you.",
  alternates: {
    canonical: "/browse",
  },
  openGraph: {
    type: "website",
    url: "https://www.yardshoppers.com/browse",
    title: "Browse Yard Sales Near You | YardShoppers",
    description:
      "Search and filter yard sales, garage sales, and estate sales by category, distance, and location. Find bargain prices near you.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Browse Yard Sales on YardShoppers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Yard Sales Near You | YardShoppers",
    description:
      "Search and filter yard sales, garage sales, and estate sales by category, distance, and location.",
    images: ["/og-image.png"],
  },
};

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
