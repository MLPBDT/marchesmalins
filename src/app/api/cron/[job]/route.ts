import { NextResponse } from "next/server";
import { runJob } from "@/lib/jobs";
import { logEvent } from "@/lib/models";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Called by Vercel Cron / Upstash QStash / cron-job.org with Authorization: Bearer CRON_SECRET (or ?key=)
async function handle(req: Request, { params }: { params: Promise<{ job: string }> }) {
  const { job } = await params;
  const auth = req.headers.get("authorization") || "";
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.CRON_SECRET || (auth !== `Bearer ${process.env.CRON_SECRET}` && key !== process.env.CRON_SECRET)) return new NextResponse("unauthorized", { status: 401 });
  const logs = await runJob(job, 50000);
  if (logs.some((l) => l.startsWith("ERREUR"))) await logEvent("job_error", { job, logs: logs.slice(-5) });
  return NextResponse.json({ job, logs });
}
export const GET = handle;
export const POST = handle;
