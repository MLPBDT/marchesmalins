import { stripe, priceFor } from "./stripe";
import { PLANS, PlanId, SITE_URL, BRAND } from "./config";
import { Subscriber, blankSub, saveSub, subByEmail, getSub, logEvent, sign } from "./models";
import { db } from "./db";
import { sendEmail, layout, button } from "./email";
import { welcomeEmail } from "./alerts";
import { tradeById, DEPTS } from "./trades";

export function cleanChoice(plan: PlanId, trades: string[], depts: string[], keywords: string[] = []) {
  const p = PLANS[plan];
  const t = [...new Set(trades)].filter((x) => tradeById(x)).slice(0, p.maxTrades);
  let d = [...new Set(depts)].filter((x) => DEPTS[x] || x === "FR");
  if (plan !== "pro") d = d.filter((x) => x !== "FR");
  d = d.slice(0, p.maxDepts);
  const k = plan === "pro" ? keywords.map((s) => s.trim()).filter((s) => s.length >= 3).slice(0, 10) : [];
  return { trades: t, depts: d, keywords: k };
}

async function upsert(email: string, company: string, plan: PlanId, choice: ReturnType<typeof cleanChoice>, source?: string) {
  const s = (await subByEmail(email)) || blankSub(email, company, plan);
  s.company = company || s.company;
  // never downgrade a paying subscriber from the free form
  if (!(s.status === "active" && s.plan !== "gratuit" && plan === "gratuit")) { s.trades = choice.trades; s.depts = choice.depts; s.keywords = choice.keywords; }
  if (source) s.source = source;
  await saveSub(s);
  return s;
}

export async function signupFree(email: string, company: string, choice: ReturnType<typeof cleanChoice>, source?: string) {
  const s = await upsert(email, company, "gratuit", choice, source);
  if (s.status === "active" && s.confirmed) return s;
  const link = `${SITE_URL}/api/confirm/${sign({ s: s.id }, 60 * 60 * 24 * 7)}`;
  await sendEmail(s.email, `Confirmez votre alerte marchés publics — ${BRAND}`, layout("Un clic pour activer votre alerte", `
<p>Vous avez demandé à recevoir les marchés publics qui correspondent à votre métier. Confirmez votre adresse pour activer l'alerte :</p>
<p>${button(link, "Activer mon alerte")}</p>
<p style="font-size:13px;color:#6b7280">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message : rien ne vous sera envoyé.</p>`));
  await logEvent("signup_free", { sub: s.id, source });
  return s;
}

export async function confirmFree(subId: string) {
  const s = await getSub(subId);
  if (!s) return null;
  if (!s.confirmed || s.status !== "active") {
    s.confirmed = true;
    if (s.status === "pending" || s.status === "unsubscribed") { s.status = "active"; s.plan = s.plan || "gratuit"; }
    await saveSub(s);
    await welcomeEmail(s);
    await logEvent("confirmed", { sub: s.id });
  }
  return s;
}

export async function createCheckout(input: { email: string; company: string; plan: PlanId; choice: ReturnType<typeof cleanChoice>; source?: string }) {
  const s = await upsert(input.email, input.company, input.plan, input.choice, input.source);
  const session = await stripe().checkout.sessions.create({
    mode: "subscription", customer_email: s.email, line_items: [{ price: priceFor(input.plan), quantity: 1 }],
    payment_method_collection: "always", locale: "fr", billing_address_collection: "required",
    custom_text: { submit: { message: "14 jours gratuits : aucun prélèvement avant la fin de l'essai. Annulable à tout moment en 1 clic." } },
    subscription_data: { trial_period_days: 14, metadata: { plan: input.plan, sub: s.id } },
    metadata: { plan: input.plan, sub: s.id, email: s.email },
    success_url: `${SITE_URL}/bienvenue?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/commencer?plan=${input.plan}&annule=1`,
  });
  return session.url!;
}

// Idempotent: webhook + success page.
export async function activateFromSession(sessionId: string): Promise<Subscriber | null> {
  const lock = await db.get<string>(`session-sub:${sessionId}`);
  if (lock) return getSub(lock);
  const sess = await stripe().checkout.sessions.retrieve(sessionId);
  if (sess.status !== "complete") return null;
  const s = (sess.metadata?.sub && (await getSub(sess.metadata.sub))) || (await subByEmail(sess.customer_details?.email || ""));
  if (!s) return null;
  s.plan = (sess.metadata?.plan || "solo") as PlanId;
  s.status = "active"; s.confirmed = true;
  s.stripeCustomerId = (sess.customer as string) || s.stripeCustomerId;
  s.stripeSubscriptionId = (sess.subscription as string) || s.stripeSubscriptionId;
  await saveSub(s);
  await db.set(`session-sub:${sessionId}`, s.id);
  await db.set(`stripe-sub:${s.stripeSubscriptionId}`, s.id);
  if (s.source) { const p = await db.get<any>(`prospect:${s.source}`); if (p) { p.status = "converted"; await db.set(`prospect:${s.source}`, p, 60 * 60 * 24 * 60); } }
  await logEvent("new_paid", { sub: s.id, plan: s.plan, source: s.source });
  await welcomeEmail(s);
  if (process.env.ADMIN_EMAIL) await sendEmail(process.env.ADMIN_EMAIL, `💶 Nouvel abonné ${BRAND} : ${s.company} (${s.plan})`, layout("Nouvel abonné", `<p>${s.company} — ${s.email} — ${s.plan} — ${s.trades.join(", ")} — ${s.depts.join(", ")}</p>`));
  return s;
}

export async function portalUrl(s: Subscriber) {
  const p = await stripe().billingPortal.sessions.create({ customer: s.stripeCustomerId!, return_url: `${SITE_URL}/compte`, ...(process.env.STRIPE_PORTAL_CONFIG ? { configuration: process.env.STRIPE_PORTAL_CONFIG } : {}) });
  return p.url;
}
