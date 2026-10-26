import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { DEPTS, TRADES, matches } from "@/lib/trades";
import { openNotices } from "@/lib/boamp";
import { ATTRIB_PAGES, isLive } from "@/lib/decp";

export const dynamic = "force-dynamic";
export const revalidate = 21600; // 6 h

// Seules les pages qui ont au moins un marché ouvert vont dans le sitemap (les autres sont en noindex).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = ["", "/marches", "/commencer", "/cgv", "/mentions-legales", "/confidentialite", "/veille-marches-publics-gratuite", "/alternative-vecteur-plus"];
  const pages: string[] = [];
  for (const d of Object.keys(DEPTS)) {
    const list = await openNotices(d).catch(() => []);
    if (list.length) pages.push(`/marches/${d}`);
    for (const t of TRADES) {
      if (list.some((n) => matches(t, `${n.objet} ${n.desc.join(" ")}`, n.types, []))) pages.push(`/marches/${d}/${t.id}`);
    }
  }
  // pages « marchés attribués » : publiées 2 par semaine (dates dans ATTRIB_PAGES)
  for (const p of ATTRIB_PAGES) if (isLive(p.dept, p.trade)) pages.push(`/marches-attribues/${p.dept}/${p.trade}`);
  return [...base, ...pages].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "daily", priority: p === "" ? 1 : p.split("/").length > 3 ? 0.5 : 0.7 }));
}
