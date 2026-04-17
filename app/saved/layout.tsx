import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Listings",
  description:
    "View your saved yard sale, garage sale, and estate sale listings. Keep track of the sales you want to visit on YardShoppers.",
  alternates: {
    canonical: "/saved",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
