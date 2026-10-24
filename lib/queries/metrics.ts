import { createClient } from "@/lib/supabase/server";
import type { MetricSnapshot, MetricSource } from "@/lib/types";

export type GscTotals = { clicks: number; impressions: number; ctr: number; position: number };
export type Ga4Totals = { sessions: number; engaged_sessions: number | null; key_events: number | null; engagement_rate: number | null };

export type SnapshotSet = {
  source: MetricSource;
  period_start: string;
  period_end: string;
  totals: Record<string, number | null> | null;
  queries: MetricSnapshot[];
  pages: MetricSnapshot[];
};

function asMetrics(value: unknown): Record<string, number | null> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, number | null>) : null;
}

export function groupSnapshots(rows: MetricSnapshot[]): SnapshotSet[] {
  const sets = new Map<string, SnapshotSet>();
  for (const r of rows) {
    const key = `${r.source}|${r.period_start}|${r.period_end}`;
    let set = sets.get(key);
    if (!set) {
      set = { source: r.source, period_start: r.period_start, period_end: r.period_end, totals: null, queries: [], pages: [] };
      sets.set(key, set);
    }
    if (r.dimension_type === "total") set.totals = asMetrics(r.metrics);
    else if (r.dimension_type === "query") set.queries.push(r);
    else set.pages.push(r);
  }
  const byMetric = (a: MetricSnapshot, b: MetricSnapshot) => {
    const ma = asMetrics(a.metrics) ?? {};
    const mb = asMetrics(b.metrics) ?? {};
    return (mb.clicks ?? mb.sessions ?? 0) - (ma.clicks ?? ma.sessions ?? 0);
  };
  for (const s of sets.values()) {
    s.queries.sort(byMetric);
    s.pages.sort(byMetric);
  }
  return [...sets.values()].sort((a, b) => b.period_end.localeCompare(a.period_end) || a.source.localeCompare(b.source));
}

export async function getSnapshotSets(clientId: string): Promise<SnapshotSet[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("metric_snapshots")
    .select("*")
    .eq("client_id", clientId)
    .order("period_end", { ascending: false });
  return groupSnapshots(data ?? []);
}

export type PerformanceWindow = {
  current: SnapshotSet | null;
  previous: SnapshotSet | null;
};

/**
 * For a report period: the snapshot set that matches the period (exact match
 * first, else the one overlapping most) and the latest set that ended before
 * the period started, per source.
 */
export async function getPerformance(
  clientId: string,
  periodStart: string,
  periodEnd: string,
): Promise<Record<MetricSource, PerformanceWindow>> {
  const sets = await getSnapshotSets(clientId);
  const pick = (source: MetricSource): PerformanceWindow => {
    const ofSource = sets.filter((s) => s.source === source);
    const exact = ofSource.find((s) => s.period_start === periodStart && s.period_end === periodEnd);
    const overlapping = ofSource
      .filter((s) => s.period_start <= periodEnd && s.period_end >= periodStart)
      .sort((a, b) => overlapDays(b, periodStart, periodEnd) - overlapDays(a, periodStart, periodEnd));
    const current = exact ?? overlapping[0] ?? null;
    const previous =
      ofSource
        .filter((s) => s.period_end < (current?.period_start ?? periodStart))
        .sort((a, b) => b.period_end.localeCompare(a.period_end))[0] ?? null;
    return { current, previous };
  };
  return { gsc: pick("gsc"), ga4: pick("ga4") };
}

function overlapDays(s: SnapshotSet, start: string, end: string) {
  const a = Math.max(Date.parse(s.period_start), Date.parse(start));
  const b = Math.min(Date.parse(s.period_end), Date.parse(end));
  return Math.max(0, (b - a) / 86_400_000 + 1);
}
