import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { DEPTS, TRADES } from "@/lib/trades";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = ["", "/marches", "/commencer", "/cgv", "/mentions-legales", "/confidentialite"];
  const d = Object.keys(DEPTS).map((k) => `/marches/${k}`);
  const dt = Object.keys(DEPTS).flatMap((k) => TRADES.map((t) => `/marches/${k}/${t.id}`));
  return [...base, ...d, ...dt].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "daily", priority: p === "" ? 1 : p.split("/").length > 3 ? 0.5 : 0.7 }));
}
