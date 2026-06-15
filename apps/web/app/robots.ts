import type { MetadataRoute } from "next";

const BASE = process.env.NEXTAUTH_URL || process.env.APP_URL || "https://tickets.daowave.pt";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/promotor/", "/api/", "/checkout/", "/account/", "/auth/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
