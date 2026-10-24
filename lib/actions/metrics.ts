"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { firstIssue, optNumber, str, type FormState } from "@/lib/form";
import { ga4OrganicTotals, gscTotals, parseGa4Csv, parseGscCsv } from "@/lib/metrics/parse";
import { createClient } from "@/lib/supabase/server";
import type { DimensionType, MetricSource, TablesInsert } from "@/lib/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TOP_N = 50;

const periodSchema = z
  .object({
    source: z.enum(["gsc", "ga4"]),
    period_start: z.string().regex(ISO_DATE, "Period start is required"),
    period_end: z.string().regex(ISO_DATE, "Period end is required"),
  })
  .refine((p) => p.period_end >= p.period_start, { message: "Period end must be on or after the start", path: ["period_end"] });

export type MetricsImportState = FormState & { imported?: string[] };

/** Replaces the rows of the given dimension types for this client/source/period. */
async function replaceRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  scope: { client_id: string; source: MetricSource; period_start: string; period_end: string },
  rows: TablesInsert<"metric_snapshots">[],
) {
  const types = [...new Set(rows.map((r) => r.dimension_type ?? "total"))] as DimensionType[];
  if (types.length === 0) return null;
  const { error: delError } = await supabase
    .from("metric_snapshots")
    .delete()
    .eq("client_id", scope.client_id)
    .eq("source", scope.source)
    .eq("period_start", scope.period_start)
    .eq("period_end", scope.period_end)
    .in("dimension_type", types);
  if (delError) return delError.message;
  const { error } = await supabase.from("metric_snapshots").insert(rows);
  return error?.message ?? null;
}

export async function importMetricsAction(
  clientId: string,
  _prev: MetricsImportState,
  fd: FormData,
): Promise<MetricsImportState> {
  await requireAdmin();
  const parsed = periodSchema.safeParse({
    source: str(fd, "source"),
    period_start: str(fd, "period_start"),
    period_end: str(fd, "period_end"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { source, period_start, period_end } = parsed.data;

  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Choose at least one CSV export." };

  const scope = { client_id: clientId, source, period_start, period_end };
  const rows: TablesInsert<"metric_snapshots">[] = [];
  const imported: string[] = [];
  const problems: string[] = [];

  for (const f of files) {
    const text = await f.text();
    if (source === "gsc") {
      const p = parseGscCsv(text);
      if (p.kind === "unknown") {
        problems.push(`${f.name}: ${p.error}`);
        continue;
      }
      if (p.kind === "dates") {
        rows.push({ ...scope, dimension_type: "total", dimension_value: null, metrics: gscTotals(p.rows) });
        imported.push(`${f.name}: period totals from ${p.rows.length} days`);
      } else {
        const type: DimensionType = p.kind === "queries" ? "query" : "page";
        const top = [...p.rows].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, TOP_N);
        for (const r of top) rows.push({ ...scope, dimension_type: type, dimension_value: r.key, metrics: { clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position } });
        imported.push(`${f.name}: top ${top.length} ${p.kind}`);
      }
    } else {
      const p = parseGa4Csv(text);
      if (p.kind === "unknown") {
        problems.push(`${f.name}: ${p.error}`);
        continue;
      }
      if (p.kind === "channels") {
        const organic = ga4OrganicTotals(p.rows);
        if (!organic) {
          problems.push(`${f.name}: no "Organic Search" row found in the channel report.`);
          continue;
        }
        rows.push({ ...scope, dimension_type: "total", dimension_value: null, metrics: organic });
        imported.push(`${f.name}: organic totals (${organic.sessions} sessions)`);
      } else {
        const top = [...p.rows].sort((a, b) => b.sessions - a.sessions).slice(0, TOP_N);
        for (const r of top) rows.push({ ...scope, dimension_type: "page", dimension_value: r.key, metrics: { sessions: r.sessions, engaged_sessions: r.engaged_sessions, key_events: r.key_events } });
        imported.push(`${f.name}: top ${top.length} landing pages`);
      }
    }
  }

  if (rows.length === 0) return { error: problems.join(" ") || "Nothing recognised in these files." };

  const supabase = await createClient();
  const error = await replaceRows(supabase, scope, rows);
  if (error) return { error };

  revalidatePath(`/clients/${clientId}`, "layout");
  return { error: null, imported: [...imported, ...problems.map((p) => `Skipped ${p}`)] };
}

const manualSchema = z.object({
  clicks: z.number().min(0).nullable(),
  impressions: z.number().min(0).nullable(),
  position: z.number().min(0).nullable(),
  sessions: z.number().min(0).nullable(),
  engaged_sessions: z.number().min(0).nullable(),
  key_events: z.number().min(0).nullable(),
});

/** Totals typed in by hand (no CSV needed). */
export async function saveManualTotalsAction(
  clientId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const period = periodSchema.safeParse({
    source: str(fd, "source"),
    period_start: str(fd, "period_start"),
    period_end: str(fd, "period_end"),
  });
  if (!period.success) return { error: firstIssue(period.error) };
  const values = manualSchema.safeParse({
    clicks: optNumber(fd, "clicks"),
    impressions: optNumber(fd, "impressions"),
    position: optNumber(fd, "position"),
    sessions: optNumber(fd, "sessions"),
    engaged_sessions: optNumber(fd, "engaged_sessions"),
    key_events: optNumber(fd, "key_events"),
  });
  if (!values.success) return { error: firstIssue(values.error) };

  const { source, period_start, period_end } = period.data;
  const v = values.data;
  let metrics: Record<string, number | null>;
  if (source === "gsc") {
    if (v.clicks == null || v.impressions == null) return { error: "Clicks and impressions are required for Search Console." };
    metrics = { clicks: v.clicks, impressions: v.impressions, ctr: v.impressions > 0 ? v.clicks / v.impressions : 0, position: v.position ?? 0 };
  } else {
    if (v.sessions == null) return { error: "Organic sessions are required for GA4." };
    metrics = {
      sessions: v.sessions,
      engaged_sessions: v.engaged_sessions,
      key_events: v.key_events,
      engagement_rate: v.engaged_sessions != null && v.sessions > 0 ? v.engaged_sessions / v.sessions : null,
    };
  }

  const supabase = await createClient();
  const scope = { client_id: clientId, source, period_start, period_end };
  const error = await replaceRows(supabase, scope, [{ ...scope, dimension_type: "total", dimension_value: null, metrics }]);
  if (error) return { error };

  revalidatePath(`/clients/${clientId}`, "layout");
  redirect(`/clients/${clientId}/metrics`);
}

export async function deleteSnapshotSetAction(
  clientId: string,
  source: MetricSource,
  periodStart: string,
  periodEnd: string,
) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("metric_snapshots")
    .delete()
    .eq("client_id", clientId)
    .eq("source", source)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`, "layout");
  redirect(`/clients/${clientId}/metrics`);
}

/** Lets a form prefill the period from a GA4 export's comment header. */
export async function detectGa4PeriodAction(text: string) {
  const p = parseGa4Csv(text);
  return p.kind === "unknown" ? null : { start: p.startDate, end: p.endDate };
}
