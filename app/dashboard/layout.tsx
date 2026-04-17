import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Manage your yard sale listings, view stats, and track your activity on YardShoppers.",
  alternates: {
    canonical: "/dashboard",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
