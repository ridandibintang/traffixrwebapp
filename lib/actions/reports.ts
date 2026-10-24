"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { firstIssue, optStr, str, type FormState } from "@/lib/form";
import { assembleReport, autoSummaries } from "@/lib/reports/assemble";
import { createClient } from "@/lib/supabase/server";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Opens the cycle's report, creating it (with auto summaries) on first use. */
export async function openReportAction(clientId: string, cycleId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: existing } = await supabase.from("reports").select("id").eq("cycle_id", cycleId).maybeSingle();
  if (existing) redirect(`/clients/${clientId}/reports/${existing.id}`);

  const { data: cycle } = await supabase.from("cycles").select("*").eq("id", cycleId).eq("client_id", clientId).maybeSingle();
  if (!cycle) throw new Error("Cycle not found.");

  const { data: report, error } = await supabase
    .from("reports")
    .insert({ client_id: clientId, cycle_id: cycleId, period_start: cycle.start_date, period_end: cycle.end_date })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const data = await assembleReport(supabase, report);
  if (data) await supabase.from("reports").update(autoSummaries(data)).eq("id", report.id);

  revalidatePath(`/clients/${clientId}`, "layout");
  revalidatePath("/reports");
  redirect(`/clients/${clientId}/reports/${report.id}`);
}

const reportSchema = z
  .object({
    period_start: z.string().regex(ISO_DATE, "Period start is required"),
    period_end: z.string().regex(ISO_DATE, "Period end is required"),
    status: z.enum(["draft", "final"]),
    done_summary: z.string().nullable(),
    offpage_summary: z.string().nullable(),
    performance_summary: z.string().nullable(),
    next_plan: z.string().nullable(),
    notes: z.string().nullable(),
  })
  .refine((r) => r.period_end >= r.period_start, { message: "Period end must be on or after the start", path: ["period_end"] });

export async function updateReportAction(reportId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = reportSchema.safeParse({
    period_start: str(fd, "period_start"),
    period_end: str(fd, "period_end"),
    status: str(fd, "status") || "draft",
    done_summary: optStr(fd, "done_summary"),
    offpage_summary: optStr(fd, "offpage_summary"),
    performance_summary: optStr(fd, "performance_summary"),
    next_plan: optStr(fd, "next_plan"),
    notes: optStr(fd, "notes"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.from("reports").update(parsed.data).eq("id", reportId).select("client_id").single();
  if (error) return { error: error.message };

  revalidatePath(`/clients/${data.client_id}`, "layout");
  revalidatePath("/reports");
  redirect(`/clients/${data.client_id}/reports/${reportId}?saved=1`);
}

/** Overwrites the four summaries with fresh auto-generated text. */
export async function regenerateSummariesAction(reportId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: report } = await supabase.from("reports").select("*").eq("id", reportId).maybeSingle();
  if (!report) throw new Error("Report not found.");
  const data = await assembleReport(supabase, report);
  if (data) {
    const { error } = await supabase.from("reports").update(autoSummaries(data)).eq("id", reportId);
    if (error) throw new Error(error.message);
  }
  revalidatePath(`/clients/${report.client_id}/reports/${reportId}`);
  redirect(`/clients/${report.client_id}/reports/${reportId}?regenerated=1`);
}

export async function deleteReportAction(reportId: string, clientId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("reports").delete().eq("id", reportId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`, "layout");
  revalidatePath("/reports");
  redirect(`/clients/${clientId}/reports`);
}
