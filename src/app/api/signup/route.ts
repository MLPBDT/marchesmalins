import { NextResponse } from "next/server";
import { PLANS, PlanId, SITE_URL, PAID } from "@/lib/config";
import { cleanChoice, signupFree, createCheckout } from "@/lib/billing";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const f = await req.formData();
  const plan = (String(f.get("plan") || "gratuit") in PLANS ? String(f.get("plan") || "gratuit") : "gratuit") as PlanId;
  const email = String(f.get("email") || "").trim().toLowerCase();
  const company = String(f.get("company") || "").trim().slice(0, 120);
  const source = String(f.get("source") || "") || undefined;
  const back = (err: string) => NextResponse.redirect(`${SITE_URL}/commencer?plan=${plan}&err=${encodeURIComponent(err)}`, 303);
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return back("Adresse email invalide.");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "x";
  if ((await db.incr(`signup-rl:${ip}`, 3600)) > 8) return back("Trop de demandes, réessayez dans une heure.");
  const choice = cleanChoice(plan, f.getAll("trades").map(String).filter(Boolean), f.getAll("depts").map(String).filter(Boolean), String(f.get("keywords") || "").split(","));
  if (!choice.trades.length || !choice.depts.length) return back("Choisissez au moins un métier et un département.");
  if (PAID.includes(plan)) {
    try { return NextResponse.redirect(await createCheckout({ email, company: company || email, plan, choice, source }), 303); }
    catch (e: any) { console.error(e); return back("Le paiement est momentanément indisponible. Commencez avec la formule gratuite, vous pourrez passer à Solo ensuite."); }
  }
  try { await signupFree(email, company || email, choice, source); }
  catch (e: any) { console.error(e); return back(`L'email de confirmation n'a pas pu partir (${String(e.message).slice(0, 120)}). Réessayez dans quelques minutes.`); }
  return NextResponse.redirect(`${SITE_URL}/merci`, 303);
}
