import { TRADES, DEPTS } from "@/lib/trades";
import { PLANS, PlanId } from "@/lib/config";

export function SignupForm({ plan = "gratuit", trade, dept, email, source, compact = false }: { plan?: PlanId; trade?: string; dept?: string; email?: string; source?: string; compact?: boolean }) {
  return (
    <form action="/api/signup" method="post" className="space-y-4">
      {source && <input type="hidden" name="source" value={source} />}
      {!compact && (
        <div>
          <span className="label">Formule</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(PLANS) as PlanId[]).map((id) => (
              <label key={id} className="card flex cursor-pointer items-start gap-2 p-3 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
                <input type="radio" name="plan" value={id} defaultChecked={id === plan} className="mt-1" />
                <span><b>{PLANS[id].name}</b> — {PLANS[id].price ? `${PLANS[id].price} €/mois` : "0 €"}<br /><span className="text-slate-500">{PLANS[id].features[0]}</span></span>
              </label>
            ))}
          </div>
        </div>
      )}
      {compact && <input type="hidden" name="plan" value={plan} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="trade">Votre métier</label>
          <select id="trade" name="trades" className="input" defaultValue={trade || ""} required>
            <option value="" disabled>Choisir…</option>
            {TRADES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {!compact && <>
            <label className="label mt-3" htmlFor="trade2">2ᵉ métier (facultatif, Solo et Pro)</label>
            <select id="trade2" name="trades" className="input" defaultValue="">
              <option value="">—</option>
              {TRADES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </>}
        </div>
        <div>
          <label className="label" htmlFor="dept">Département</label>
          <select id="dept" name="depts" className="input" defaultValue={dept || ""} required>
            <option value="" disabled>Choisir…</option>
            {Object.entries(DEPTS).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
          </select>
          {!compact && <>
            <label className="label mt-3" htmlFor="dept2">Départements voisins (facultatif, Solo et Pro)</label>
            <div className="grid grid-cols-2 gap-2">
              {[0, 1].map((i) => (
                <select key={i} name="depts" className="input" defaultValue="">
                  <option value="">—</option>
                  <option value="FR">Toute la France (Pro)</option>
                  {Object.entries(DEPTS).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
                </select>
              ))}
            </div>
          </>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="email">Email professionnel</label><input id="email" className="input" type="email" name="email" required defaultValue={email} placeholder="contact@votre-entreprise.fr" /></div>
        <div><label className="label" htmlFor="company">Entreprise</label><input id="company" className="input" name="company" required placeholder="Nom de l'entreprise" /></div>
      </div>
      {!compact && <div><label className="label" htmlFor="kw">Mots-clés en plus (Pro, séparés par des virgules)</label><input id="kw" className="input" name="keywords" placeholder="ex. étanchéité, photovoltaïque" /></div>}
      <button className="btn btn-primary w-full">{plan === "gratuit" && compact ? "Recevoir l'alerte gratuite du lundi" : "Continuer"}</button>
      <p className="text-xs text-slate-500">Formule gratuite : un email de confirmation, puis un récap chaque lundi. Solo et Pro : 14 jours d&apos;essai, carte demandée, sans engagement. Désinscription en un clic.</p>
    </form>
  );
}
