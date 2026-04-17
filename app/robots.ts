import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/saved",
          "/login",
          "/signup",
          "/post",
          "/api/",
          "/auth/",
        ],
      },
    ],
    sitemap: "https://www.yardshoppers.com/sitemap.xml",
  };
}
