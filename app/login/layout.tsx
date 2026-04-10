import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Log in to YardShoppers to post yard sales, save listings, plan routes, and connect with local buyers and sellers in your area.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
