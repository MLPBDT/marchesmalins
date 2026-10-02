import { NextResponse } from "next/server";
import { currentSub } from "@/lib/session";
import { cleanChoice } from "@/lib/billing";
import { saveSub } from "@/lib/models";
import { SITE_URL } from "@/lib/config";
export async function POST(req: Request) {
  const s = await currentSub();
  if (!s) return NextResponse.redirect(`${SITE_URL}/compte/connexion`, 303);
  const f = await req.formData();
  if (f.get("action") === "pause") { s.status = s.status === "unsubscribed" ? "active" : "unsubscribed"; await saveSub(s); return NextResponse.redirect(`${SITE_URL}/compte`, 303); }
  const c = cleanChoice(s.plan, f.getAll("trades").map(String).filter(Boolean), f.getAll("depts").map(String).filter(Boolean), String(f.get("keywords") || "").split(","));
  if (c.trades.length && c.depts.length) { s.trades = c.trades; s.depts = c.depts; s.keywords = c.keywords; await saveSub(s); }
  return NextResponse.redirect(`${SITE_URL}/compte?ok=1`, 303);
}
