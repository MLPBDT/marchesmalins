import { ingest, backfill } from "./boamp";
import { DEPTS } from "./trades";
import { runDigests } from "./alerts";
import { runOutreach } from "./outreach";
import { sourceStep } from "./prospects";
import { db } from "./db";

export async function runJob(job: string, budgetMs = 50000): Promise<string[]> {
  const t0 = Date.now();
  const logs: string[] = [];
  const log = (s: string) => logs.push(s);
  const left = () => budgetMs - (Date.now() - t0);
  try {
    if (job === "ingest") await ingest(log);
    else if (job === "backfill") await backfill(log, left, Object.keys(DEPTS));
    else if (job === "digest") await runDigests(log, left);
    else if (job === "outreach") await runOutreach({ log, maxPerRun: 2 });
    else if (job === "prospect") {
      const target = Number(process.env.PROSPECTS_PER_DAY || 25);
      const k = `prospected:${new Date().toISOString().slice(0, 10)}`;
      const done = (await db.get<number>(k)) || 0;
      if (done >= target) return [`objectif du jour atteint (${done})`];
      const got = await sourceStep(log, left, target - done);
      await db.set(k, done + got, 60 * 60 * 30);
    } else return [`job inconnu: ${job}`];
  } catch (e: any) { log(`ERREUR: ${e.message}`); }
  return logs;
}
