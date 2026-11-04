import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.APP_URL ?? "http://127.0.0.1:3000";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    ],
    sitemap: `${siteUrl.replace(/\/+$/, "")}/sitemap.xml`,
  };
}
