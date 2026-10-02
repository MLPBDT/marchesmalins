import { verify, getSub, saveSub, logEvent } from "./models";
import { suppress, getProspect, saveProspect } from "./prospects";
// Subscribers (token {s}) → alerts paused. Prospects (token {e,p}) → suppression list.
export async function doUnsub(token: string) {
  const t = verify<{ e?: string; p?: string; s?: string }>(token);
  if (!t) return false;
  if (t.s) { const s = await getSub(t.s); if (s) { s.status = "unsubscribed"; await saveSub(s); await logEvent("unsub", { sub: s.id }); } }
  if (t.e) { await suppress(t.e); const p = t.p ? await getProspect(t.p) : null; if (p) { p.status = "unsubscribed"; await saveProspect(p); } }
  return true;
}
