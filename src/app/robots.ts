import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/compte", "/admin", "/api/", "/desinscription/", "/bienvenue", "/merci", "/auth/"] }], sitemap: `${SITE_URL}/sitemap.xml` };
}
