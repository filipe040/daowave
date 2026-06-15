import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/company";

const BASE = getAppBaseUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/promotor/",
        "/organizer/",
        "/api/",
        "/checkout/",
        "/account/",
        "/auth/",
        "/validator/",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
