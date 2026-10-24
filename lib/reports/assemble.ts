// Assembles a two-week report from data already in the app:
//   1. Work done: tasks done in the cycle, articles published in the period,
//      crawl findings fixed in the cycle's audits.
//   2. Off-page: backlinks that went live and GBP posts published in the period.
//   3. Organic performance: GSC and GA4 snapshots for the period vs the previous one.
//   4. Next plan: next cycle's tasks, articles in the pipeline, upcoming GBP posts
//      and backlinks.
// autoSummaries() turns the numbers into editable English paragraphs.
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, formatDate, formatMonth, startOfMonth } from "@/lib/dates";
import { TASK_CATEGORY } from "@/lib/labels";
import { normaliseIssueName } from "@/lib/audits/parse";
import { getPerformance, type PerformanceWindow } from "@/lib/queries/metrics";
import { fetchAll } from "@/lib/supabase/fetch-all";
import type { ArticleStatus, Backlink, Client, Cycle, Database, GbpPost, MetricSource, PriorityLevel, Report, TaskCategory } from "@/lib/types";

type Db = SupabaseClient<Database>;

export type DoneTask = { title: string; category: TaskCategory; urls: number; assignee: string | null };
export type ReportData = {
  report: Report;
  client: Client;
  cycle: Cycle | null;
  nextCycle: Cycle | null;
  done: {
    tasks: DoneTask[];
    byCategory: { category: TaskCategory; count: number; urls: number }[];
    totalUrls: number;
    articles: { title: string; published_url: string | null; published_at: string | null; writer: string | null }[];
    fixedFindings: { issue_name: string; count: number }[];
    fixedTotal: number;
  };
  offpage: { backlinks: Backlink[]; gbpPosts: GbpPost[] };
  performance: Record<MetricSource, PerformanceWindow>;
  next: {
    tasks: { title: string; category: TaskCategory; priority: PriorityLevel; due_date: string | null }[];
    articles: { title: string; status: ArticleStatus; writer: string | null }[];
    gbpPosts: GbpPost[];
    backlinks: Backlink[];
  };
};

export async function assembleReport(supabase: Db, report: Report): Promise<ReportData | null> {
  const [{ data: client }, { data: cycle }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", report.client_id).maybeSingle(),
    supabase.from("cycles").select("*").eq("id", report.cycle_id).maybeSingle(),
  ]);
  if (!client) return null;

  const { period_start: start, period_end: end } = report;
  const nextMonthStart = startOfMonth(addDays(end, 1));

  const [
    { data: doneTasks },
    { data: publishedArticles },
    { data: audits },
    { data: liveBacklinks },
    { data: publishedPosts },
    { data: nextCycle },
    { data: pipelineArticles },
    { data: upcomingPosts },
    { data: plannedBacklinks },
    performance,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("title, category, affected_urls, assignee:profiles!tasks_assignee_id_fkey(full_name)")
      .eq("cycle_id", report.cycle_id)
      .eq("status", "done")
      .order("category"),
    supabase
      .from("articles")
      .select("title, published_url, published_at, writer:profiles!articles_writer_id_fkey(full_name)")
      .eq("client_id", report.client_id)
      .eq("status", "published")
      .gte("published_at", `${start}T00:00:00`)
      .lte("published_at", `${end}T23:59:59`),
    supabase.from("audits").select("id").eq("cycle_id", report.cycle_id),
    supabase
      .from("backlinks")
      .select("*")
      .eq("client_id", report.client_id)
      .eq("status", "live")
      .gte("live_at", start)
      .lte("live_at", end)
      .order("live_at"),
    supabase
      .from("gbp_posts")
      .select("*")
      .eq("client_id", report.client_id)
      .eq("status", "published")
      .gte("scheduled_date", start)
      .lte("scheduled_date", end)
      .order("scheduled_date"),
    cycle
      ? supabase.from("cycles").select("*").eq("client_id", report.client_id).eq("number", cycle.number + 1).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("articles")
      .select("title, status, writer:profiles!articles_writer_id_fkey(full_name)")
      .eq("client_id", report.client_id)
      .not("status", "in", "(published,draft)")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("gbp_posts")
      .select("*")
      .eq("client_id", report.client_id)
      .neq("status", "published")
      .gt("scheduled_date", end)
      .lte("scheduled_date", addDays(end, 30))
      .order("scheduled_date"),
    supabase
      .from("backlinks")
      .select("*")
      .eq("client_id", report.client_id)
      .in("status", ["planned", "ordered"])
      .gte("month", nextMonthStart)
      .order("month"),
    getPerformance(report.client_id, start, end),
  ]);

  // Fixed findings from this cycle's crawls, grouped by issue.
  const fixedByIssue = new Map<string, { issue_name: string; count: number }>();
  const auditIds = (audits ?? []).map((a) => a.id);
  if (auditIds.length) {
    const fixed = await fetchAll((from, to) =>
      supabase.from("audit_findings").select("issue_name").in("audit_id", auditIds).eq("state", "fixed").order("id").range(from, to),
    );
    for (const f of fixed) {
      const key = normaliseIssueName(f.issue_name);
      const g = fixedByIssue.get(key) ?? { issue_name: f.issue_name, count: 0 };
      g.count += 1;
      fixedByIssue.set(key, g);
    }
  }
  const fixedFindings = [...fixedByIssue.values()].sort((a, b) => b.count - a.count);

  const tasks: DoneTask[] = (doneTasks ?? []).map((t) => ({
    title: t.title,
    category: t.category,
    urls: t.affected_urls.length,
    assignee: t.assignee?.full_name ?? null,
  }));
  const byCategoryMap = new Map<TaskCategory, { category: TaskCategory; count: number; urls: number }>();
  for (const t of tasks) {
    const c = byCategoryMap.get(t.category) ?? { category: t.category, count: 0, urls: 0 };
    c.count += 1;
    c.urls += t.urls;
    byCategoryMap.set(t.category, c);
  }

  let nextTasks: ReportData["next"]["tasks"] = [];
  if (nextCycle) {
    const { data } = await supabase
      .from("tasks")
      .select("title, category, priority, due_date")
      .eq("cycle_id", nextCycle.id)
      .in("status", ["todo", "in_progress"])
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true, nullsFirst: false });
    nextTasks = data ?? [];
  }

  return {
    report,
    client,
    cycle,
    nextCycle,
    done: {
      tasks,
      byCategory: [...byCategoryMap.values()].sort((a, b) => b.count - a.count),
      totalUrls: tasks.reduce((s, t) => s + t.urls, 0),
      articles: (publishedArticles ?? []).map((a) => ({ ...a, writer: a.writer?.full_name ?? null })),
      fixedFindings,
      fixedTotal: fixedFindings.reduce((s, f) => s + f.count, 0),
    },
    offpage: { backlinks: liveBacklinks ?? [], gbpPosts: publishedPosts ?? [] },
    performance,
    next: {
      tasks: nextTasks,
      articles: (pipelineArticles ?? []).map((a) => ({ title: a.title, status: a.status, writer: a.writer?.full_name ?? null })),
      gbpPosts: upcomingPosts ?? [],
      backlinks: plannedBacklinks ?? [],
    },
  };
}

// ---------------------------------------------------------------------------
// Numbers -> sentences
// ---------------------------------------------------------------------------
const fmt = new Intl.NumberFormat("en-US");

export function delta(current: number | null | undefined, previous: number | null | undefined) {
  if (current == null || previous == null) return null;
  const diff = current - previous;
  const pct = previous === 0 ? null : (diff / previous) * 100;
  return { diff, pct };
}

export function deltaText(current: number | null | undefined, previous: number | null | undefined, opts: { lowerIsBetter?: boolean; decimals?: number } = {}) {
  const d = delta(current, previous);
  if (!d) return "";
  const sign = d.diff > 0 ? "+" : "";
  const value = opts.decimals != null ? d.diff.toFixed(opts.decimals) : fmt.format(Math.round(d.diff));
  const pct = d.pct == null ? "" : ` (${sign}${d.pct.toFixed(1)}%)`;
  return ` ${sign}${value}${pct} vs the previous period`;
}

function list(items: string[], max = 5) {
  if (items.length <= max) return items.join(", ");
  return `${items.slice(0, max).join(", ")} and ${items.length - max} more`;
}

export function autoSummaries(d: ReportData) {
  const period = `${formatDate(d.report.period_start)} to ${formatDate(d.report.period_end)}`;

  // 1. Work done
  const doneParts: string[] = [];
  if (d.done.tasks.length) {
    const breakdown = d.done.byCategory.map((c) => `${c.count} ${TASK_CATEGORY[c.category].toLowerCase()}`).join(", ");
    doneParts.push(`Completed ${d.done.tasks.length} task${d.done.tasks.length === 1 ? "" : "s"} (${breakdown})${d.done.totalUrls ? ` touching ${fmt.format(d.done.totalUrls)} URLs` : ""}.`);
  } else {
    doneParts.push("No tasks were marked done in this cycle yet.");
  }
  if (d.done.articles.length) {
    doneParts.push(`Published ${d.done.articles.length} article${d.done.articles.length === 1 ? "" : "s"}: ${list(d.done.articles.map((a) => `"${a.title}"`), 3)}.`);
  }
  if (d.done.fixedTotal) {
    doneParts.push(`The latest crawl shows ${fmt.format(d.done.fixedTotal)} issue${d.done.fixedTotal === 1 ? "" : "s"} fixed since the previous crawl (${list(d.done.fixedFindings.map((f) => `${f.issue_name}: ${f.count}`), 4)}).`);
  }

  // 2. Off-page
  const offParts: string[] = [];
  if (d.offpage.backlinks.length) {
    offParts.push(`${d.offpage.backlinks.length} backlink${d.offpage.backlinks.length === 1 ? "" : "s"} went live from ${list([...new Set(d.offpage.backlinks.map((b) => b.source_domain))])}.`);
  } else {
    offParts.push("No new backlinks went live in this period.");
  }
  offParts.push(
    d.offpage.gbpPosts.length
      ? `${d.offpage.gbpPosts.length} Google Business Profile post${d.offpage.gbpPosts.length === 1 ? "" : "s"} published.`
      : "No Google Business Profile posts were published in this period.",
  );

  // 3. Performance
  const perfParts: string[] = [];
  const gsc = d.performance.gsc.current?.totals;
  const gscPrev = d.performance.gsc.previous?.totals;
  if (gsc) {
    perfParts.push(
      `Search Console (${period}): ${fmt.format(gsc.clicks ?? 0)} clicks${deltaText(gsc.clicks, gscPrev?.clicks)}, ${fmt.format(gsc.impressions ?? 0)} impressions${deltaText(gsc.impressions, gscPrev?.impressions)}, CTR ${((gsc.ctr ?? 0) * 100).toFixed(1)}%, average position ${(gsc.position ?? 0).toFixed(1)}${deltaText(gsc.position, gscPrev?.position, { decimals: 1 })}.`,
    );
    const topQueries = d.performance.gsc.current?.queries.slice(0, 3).map((q) => q.dimension_value).filter(Boolean) as string[];
    if (topQueries?.length) perfParts.push(`Top queries: ${topQueries.join(", ")}.`);
  }
  const ga4 = d.performance.ga4.current?.totals;
  const ga4Prev = d.performance.ga4.previous?.totals;
  if (ga4) {
    perfParts.push(
      `GA4: ${fmt.format(ga4.sessions ?? 0)} organic sessions${deltaText(ga4.sessions, ga4Prev?.sessions)}${ga4.key_events != null ? `, ${fmt.format(ga4.key_events)} key events${deltaText(ga4.key_events, ga4Prev?.key_events)}` : ""}.`,
    );
  }
  if (!gsc && !ga4) perfParts.push("No performance data has been imported for this period yet.");

  // 4. Next plan
  const nextParts: string[] = [];
  if (d.nextCycle) {
    const cats = [...new Set(d.next.tasks.map((t) => TASK_CATEGORY[t.category].toLowerCase()))];
    nextParts.push(
      d.next.tasks.length
        ? `Cycle ${d.nextCycle.number} (${formatDate(d.nextCycle.start_date)} to ${formatDate(d.nextCycle.end_date)}): ${d.next.tasks.length} task${d.next.tasks.length === 1 ? "" : "s"} planned${cats.length ? ` across ${list(cats)}` : ""}.`
        : `Cycle ${d.nextCycle.number} is set up but has no tasks yet.`,
    );
  } else {
    nextParts.push("The next cycle has not been created yet.");
  }
  if (d.next.articles.length) nextParts.push(`${d.next.articles.length} article${d.next.articles.length === 1 ? "" : "s"} in the content pipeline.`);
  if (d.next.gbpPosts.length) nextParts.push(`${d.next.gbpPosts.length} GBP post${d.next.gbpPosts.length === 1 ? "" : "s"} scheduled for the coming weeks.`);
  if (d.next.backlinks.length) nextParts.push(`${d.next.backlinks.length} backlink${d.next.backlinks.length === 1 ? "" : "s"} planned for ${formatMonth(d.next.backlinks[0].month)}.`);

  return {
    done_summary: doneParts.join(" "),
    offpage_summary: offParts.join(" "),
    performance_summary: perfParts.join(" "),
    next_plan: nextParts.join(" "),
  };
}
