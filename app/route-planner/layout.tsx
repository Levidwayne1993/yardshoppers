import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yard Sale Route Planner",
  description:
    "Plan the perfect yard sale route. Map out multiple garage sales, estate sales, and yard sales in your area and hit them all in one trip. Save time and find the best deals.",
  alternates: {
    canonical: "/route-planner",
  },
  openGraph: {
    type: "website",
    url: "https://www.yardshoppers.com/route-planner",
    title: "Yard Sale Route Planner | YardShoppers",
    description:
      "Map out multiple yard sales in your area and hit them all in one trip. Save time and find the best deals.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Plan Your Yard Sale Route on YardShoppers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yard Sale Route Planner | YardShoppers",
    description:
      "Map out multiple yard sales in your area and hit them all in one trip.",
    images: ["/og-image.png"],
  },
};

export default function RoutePlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
