import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { activateFromSession } from "@/lib/billing";
import { db } from "@/lib/db";
import { getSub, saveSub, logEvent, sign } from "@/lib/models";
import { sendEmail, layout, button } from "@/lib/email";
import { SITE_URL, BRAND } from "@/lib/config";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") || "";
  const body = await req.text();
  let evt;
  try { evt = stripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || ""); }
  catch (e: any) { return new NextResponse(`bad signature: ${e.message}`, { status: 400 }); }
  const obj: any = evt.data.object;
  const subFor = async (id: string) => { const sid = await db.get<string>(`stripe-sub:${id}`); return sid ? getSub(sid) : null; };
  switch (evt.type) {
    case "checkout.session.completed": await activateFromSession(obj.id); break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const s = await subFor(obj.id);
      if (s) {
        const st = obj.status as string;
        if (evt.type.endsWith("deleted") || st === "canceled") { s.plan = "gratuit"; s.status = "active"; s.depts = s.depts.filter((d) => d !== "FR").slice(0, 1); s.trades = s.trades.slice(0, 1); s.keywords = []; } // falls back to the free weekly alert
        else if (st === "past_due" || st === "unpaid") s.status = "past_due";
        else if (st === "active" || st === "trialing") s.status = "active";
        await saveSub(s);
        await logEvent("sub_status", { sub: s.id, status: st, plan: s.plan });
      }
      break;
    }
    case "invoice.payment_failed": {
      const s = obj.subscription ? await subFor(obj.subscription) : null;
      if (s) await sendEmail(s.email, `Problème de paiement — ${BRAND}`, layout("Votre paiement n'est pas passé", `<p>Votre dernier paiement a échoué. Vos alertes continuent quelques jours, le temps de mettre à jour votre carte.</p><p>${button(`${SITE_URL}/auth/${sign({ s: s.id }, 60 * 60 * 24 * 7)}?next=/compte`, "Mettre à jour ma carte")}</p>`));
      break;
    }
  }
  return NextResponse.json({ ok: true });
}
