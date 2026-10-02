import crypto from "crypto";
import { db } from "./db";
import type { PlanId } from "./config";

export type SubStatus = "pending" | "active" | "past_due" | "canceled" | "unsubscribed";
export type Subscriber = {
  id: string; email: string; company: string; plan: PlanId; status: SubStatus; createdAt: string;
  trades: string[]; depts: string[]; keywords: string[];
  stripeCustomerId?: string; stripeSubscriptionId?: string;
  confirmed: boolean; lastDigestAt?: string; sent: string[]; // notice ids already sent (last 500)
  source?: string; // prospect slug if converted from outreach
};

export const newId = (p = "") => p + crypto.randomBytes(6).toString("hex");
export async function getSub(id: string) { return db.get<Subscriber>(`sub:${id}`); }
export async function saveSub(s: Subscriber) { s.sent = (s.sent || []).slice(-500); await db.set(`sub:${s.id}`, s); await db.sadd("subs", s.id); await db.set(`sub-email:${s.email.toLowerCase()}`, s.id); }
export async function subByEmail(email: string) { const id = await db.get<string>(`sub-email:${email.toLowerCase().trim()}`); return id ? getSub(id) : null; }
export async function allSubs(): Promise<Subscriber[]> { const ids = await db.smembers("subs"); return (await Promise.all(ids.map(getSub))).filter(Boolean) as Subscriber[]; }
export function blankSub(email: string, company: string, plan: PlanId): Subscriber {
  return { id: newId("s_"), email: email.toLowerCase().trim(), company, plan, status: "pending", createdAt: new Date().toISOString(), trades: [], depts: [], keywords: [], confirmed: false, sent: [] };
}

// ---- signed tokens ----
const SECRET = () => process.env.APP_SECRET || "dev-secret-change-me";
export function sign(payload: Record<string, any>, ttlSec = 60 * 60 * 24 * 14): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlSec * 1000 })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET()).update(body).digest("base64url").slice(0, 32);
  return `${body}.${sig}`;
}
export function verify<T = any>(token: string): (T & { exp: number }) | null {
  const [body, sig] = (token || "").split(".");
  if (!body || !sig) return null;
  const good = crypto.createHmac("sha256", SECRET()).update(body).digest("base64url").slice(0, 32);
  if (good.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null;
  const p = JSON.parse(Buffer.from(body, "base64url").toString());
  if (p.exp < Date.now()) return null;
  return p;
}

export async function logEvent(type: string, data: Record<string, any> = {}) {
  const k = `events:${new Date().toISOString().slice(0, 10)}`;
  const arr = ((await db.get<any[]>(k)) || []).slice(-500);
  arr.push({ t: new Date().toISOString(), type, ...data });
  await db.set(k, arr, 60 * 60 * 24 * 40);
}
