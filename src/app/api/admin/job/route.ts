import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { runJob } from "@/lib/jobs";
import { runOutreach, smtpTest } from "@/lib/outreach";
import { db } from "@/lib/db";
import { SITE_URL, LEGAL } from "@/lib/config";
export const maxDuration = 60;
export async function POST(req: Request) {
  if (!(await isAdmin())) return new NextResponse("forbidden", { status: 403 });
  const job = String((await req.formData()).get("job") || "");
  let logs: string[] = [];
  if (job === "outreach-dry") await runOutreach({ dryRun: true, log: (s) => logs.push(s), maxPerRun: 20 });
  else if (job === "smtp-test") await smtpTest(process.env.ADMIN_EMAIL || LEGAL.email, (s) => logs.push(s));
  else logs = await runJob(job, 55000);
  await db.set("admin:lastlog", { job, at: new Date().toISOString(), logs: logs.slice(-80) }, 60 * 60 * 24);
  return NextResponse.redirect(`${SITE_URL}/admin#log`, 303);
}
