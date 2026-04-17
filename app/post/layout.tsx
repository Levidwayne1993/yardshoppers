import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post a Yard Sale",
  description:
    "List your yard sale, garage sale, or estate sale for free on YardShoppers. Reach thousands of local buyers in your area with photos, location, and sale details.",
  alternates: {
    canonical: "/post",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function PostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
