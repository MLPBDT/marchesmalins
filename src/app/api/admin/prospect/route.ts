import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { getProspect, saveProspect, suppress } from "@/lib/prospects";
import { SITE_URL } from "@/lib/config";
export async function POST(req: Request) {
  if (!(await isAdmin())) return new NextResponse("forbidden", { status: 403 });
  const f = await req.formData();
  const p = await getProspect(String(f.get("slug")));
  const st = String(f.get("status"));
  if (p && ["replied", "excluded", "unsubscribed", "ready"].includes(st)) { p.status = st as any; await saveProspect(p); if (st === "unsubscribed") await suppress(p.email); }
  return NextResponse.redirect(`${SITE_URL}/admin#prospects`, 303);
}
