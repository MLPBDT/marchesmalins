import type { Notice } from "@/lib/boamp";
import { deptName } from "@/lib/trades";
export function NoticeList({ list }: { list: Notice[] }) {
  return (
    <div className="space-y-3">
      {list.map((n) => {
        const dl = n.deadline ? Math.ceil((+new Date(n.deadline) - Date.now()) / 864e5) : null;
        return (
          <a key={n.id} href={n.url} target="_blank" rel="noopener nofollow" className="card block p-4 hover:border-brand-500">
            <div className="text-xs text-slate-500">{n.acheteur} · {n.depts.map(deptName).join(", ")} · publié le {new Date(n.published).toLocaleDateString("fr-FR")}</div>
            <div className="mt-0.5 font-semibold">{n.objet}</div>
            <div className={`mt-1 text-sm ${dl != null && dl <= 7 ? "text-red-700" : "text-slate-600"}`}>{n.deadline ? `Date limite : ${new Date(n.deadline).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })} (dans ${dl} j)` : "Date limite : voir l'avis"} · {n.procedure || n.types.join(", ").toLowerCase()}</div>
          </a>
        );
      })}
    </div>
  );
}
