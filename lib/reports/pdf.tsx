// Renders a report as PDF with @react-pdf/renderer. Same four sections as the
// web preview; brand colour #1F3864 matches the content brief documents.
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatDate, formatRange, formatShortDate } from "@/lib/dates";
import { GBP_POST_TYPE, TASK_CATEGORY } from "@/lib/labels";
import { delta, type ReportData } from "@/lib/reports/assemble";

const NAVY = "#1F3864";
const GREY = "#666666";
const BORDER = "#CCCCCC";
const LABEL_BG = "#D5E8F0";

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: "#111111", lineHeight: 1.4 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 4 },
  subtitle: { fontSize: 11, color: GREY, marginBottom: 20 },
  sectionBar: { backgroundColor: NAVY, color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 12, paddingVertical: 5, paddingHorizontal: 8, marginTop: 18, marginBottom: 8 },
  summary: { marginBottom: 8 },
  subheading: { fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 8, marginBottom: 4 },
  table: { borderWidth: 1, borderColor: BORDER, marginBottom: 6 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER },
  rowLast: { flexDirection: "row" },
  head: { backgroundColor: LABEL_BG, fontFamily: "Helvetica-Bold" },
  cell: { paddingVertical: 4, paddingHorizontal: 6 },
  right: { textAlign: "right" },
  muted: { color: GREY },
  empty: { color: GREY, fontStyle: "italic", marginBottom: 6 },
  bullet: { flexDirection: "row", marginBottom: 2 },
  bulletDot: { width: 10 },
  footer: { position: "absolute", bottom: 24, left: 48, right: 48, fontSize: 8, color: GREY, flexDirection: "row", justifyContent: "space-between" },
});

const n = new Intl.NumberFormat("en-US");
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

type Col = { label: string; width: string; align?: "right" };

function Table({ cols, rows }: { cols: Col[]; rows: string[][] }) {
  return (
    <View style={s.table}>
      <View style={[s.row, s.head]}>
        {cols.map((c) => (
          <Text key={c.label} style={[s.cell, { width: c.width }, c.align === "right" ? s.right : {}]}>{c.label}</Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={i === rows.length - 1 ? s.rowLast : s.row} wrap={false}>
          {r.map((v, j) => (
            <Text key={j} style={[s.cell, { width: cols[j].width }, cols[j].align === "right" ? s.right : {}]}>{v}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={{ marginBottom: 6 }}>
      {items.map((it, i) => (
        <View key={i} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={{ flex: 1 }}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

function change(current: number | null | undefined, previous: number | null | undefined, format: (v: number) => string, decimals?: number) {
  const d = delta(current, previous);
  if (!d) return "—";
  const sign = d.diff > 0 ? "+" : "";
  const value = decimals != null ? d.diff.toFixed(decimals) : format(Math.abs(d.diff)).replace(/^/, d.diff < 0 ? "-" : "");
  return `${decimals != null ? sign + value : (d.diff > 0 ? "+" : "") + value}${d.pct != null ? ` (${sign}${d.pct.toFixed(1)}%)` : ""}`;
}

export function ReportDocument({ data }: { data: ReportData }) {
  const { report, client, cycle, done, offpage, performance, next, nextCycle } = data;
  const gsc = performance.gsc;
  const ga4 = performance.ga4;

  const perfRows: string[][] = [];
  if (gsc.current) {
    const c = gsc.current.totals ?? {};
    const p = gsc.previous?.totals ?? {};
    perfRows.push(["Clicks", n.format(c.clicks ?? 0), p.clicks != null ? n.format(p.clicks) : "—", change(c.clicks, p.clicks, (v) => n.format(v))]);
    perfRows.push(["Impressions", n.format(c.impressions ?? 0), p.impressions != null ? n.format(p.impressions) : "—", change(c.impressions, p.impressions, (v) => n.format(v))]);
    perfRows.push(["CTR", pct(c.ctr ?? 0), p.ctr != null ? pct(p.ctr) : "—", delta(c.ctr, p.ctr) ? `${(delta(c.ctr, p.ctr)!.diff * 100).toFixed(1)} pp` : "—"]);
    perfRows.push(["Average position", (c.position ?? 0).toFixed(1), p.position != null ? p.position.toFixed(1) : "—", change(c.position, p.position, (v) => v.toFixed(1), 1)]);
  }
  if (ga4.current) {
    const c = ga4.current.totals ?? {};
    const p = ga4.previous?.totals ?? {};
    perfRows.push(["Organic sessions", n.format(c.sessions ?? 0), p.sessions != null ? n.format(p.sessions) : "—", change(c.sessions, p.sessions, (v) => n.format(v))]);
    if (c.engaged_sessions != null) perfRows.push(["Engaged sessions", n.format(c.engaged_sessions), p.engaged_sessions != null ? n.format(p.engaged_sessions) : "—", change(c.engaged_sessions, p.engaged_sessions, (v) => n.format(v))]);
    if (c.key_events != null) perfRows.push(["Key events", n.format(c.key_events), p.key_events != null ? n.format(p.key_events) : "—", change(c.key_events, p.key_events, (v) => n.format(v))]);
  }

  const topQueries = gsc.current?.queries.slice(0, 10) ?? [];
  const topPages = (gsc.current?.pages.length ? gsc.current.pages : ga4.current?.pages ?? []).slice(0, 10);
  const metricsOf = (m: unknown) => (m && typeof m === "object" ? (m as Record<string, number>) : {});

  return (
    <Document title={`${client.name} SEO report · Cycle ${cycle?.number ?? ""}`} author="Traffixr">
      <Page size="LETTER" style={s.page}>
        <Text style={s.title}>{client.name}: SEO Report</Text>
        <Text style={s.subtitle}>
          {cycle ? `Cycle ${cycle.number} · ` : ""}
          {formatRange(report.period_start, report.period_end)}
          {cycle?.meeting_date ? ` · Meeting ${formatDate(cycle.meeting_date)}` : ""}
          {` · ${report.status === "final" ? "Final" : "Draft"}`}
        </Text>

        <Text style={s.sectionBar}>1. Work completed</Text>
        {report.done_summary ? <Text style={s.summary}>{report.done_summary}</Text> : null}
        {done.tasks.length ? (
          <Table
            cols={[{ label: "Task", width: "55%" }, { label: "Category", width: "20%" }, { label: "URLs", width: "10%", align: "right" }, { label: "Owner", width: "15%" }]}
            rows={done.tasks.map((t) => [t.title, TASK_CATEGORY[t.category], t.urls ? String(t.urls) : "—", t.assignee ?? "—"])}
          />
        ) : (
          <Text style={s.empty}>No tasks marked done in this cycle.</Text>
        )}
        {done.articles.length ? (
          <>
            <Text style={s.subheading}>Articles published</Text>
            <Bullets items={done.articles.map((a) => `${a.title}${a.writer ? ` (${a.writer})` : ""}${a.published_url ? ` — ${a.published_url}` : ""}`)} />
          </>
        ) : null}
        {done.fixedFindings.length ? (
          <>
            <Text style={s.subheading}>Crawl issues fixed ({n.format(done.fixedTotal)})</Text>
            <Bullets items={done.fixedFindings.map((f) => `${f.issue_name}: ${f.count}`)} />
          </>
        ) : null}

        <Text style={s.sectionBar}>2. Off-page</Text>
        {report.offpage_summary ? <Text style={s.summary}>{report.offpage_summary}</Text> : null}
        {offpage.backlinks.length ? (
          <Table
            cols={[{ label: "Source", width: "25%" }, { label: "Target page", width: "40%" }, { label: "Anchor", width: "20%" }, { label: "Live", width: "15%" }]}
            rows={offpage.backlinks.map((b) => [b.source_domain, b.target_url, b.anchor_text ?? "—", formatShortDate(b.live_at)])}
          />
        ) : (
          <Text style={s.empty}>No backlinks went live in this period.</Text>
        )}
        {offpage.gbpPosts.length ? (
          <>
            <Text style={s.subheading}>Google Business Profile posts</Text>
            <Bullets items={offpage.gbpPosts.map((p) => `${formatShortDate(p.scheduled_date)} · ${p.title || "(untitled)"} · ${GBP_POST_TYPE[p.post_type]}`)} />
          </>
        ) : null}

        <Text style={s.sectionBar}>3. Organic performance</Text>
        {report.performance_summary ? <Text style={s.summary}>{report.performance_summary}</Text> : null}
        {perfRows.length ? (
          <Table
            cols={[
              { label: "Metric", width: "34%" },
              { label: gsc.current ? formatRange(gsc.current.period_start, gsc.current.period_end) : "This period", width: "22%", align: "right" },
              { label: gsc.previous ? formatRange(gsc.previous.period_start, gsc.previous.period_end) : "Previous", width: "22%", align: "right" },
              { label: "Change", width: "22%", align: "right" },
            ]}
            rows={perfRows}
          />
        ) : (
          <Text style={s.empty}>No performance data imported for this period.</Text>
        )}
        {topQueries.length ? (
          <>
            <Text style={s.subheading}>Top queries</Text>
            <Table
              cols={[{ label: "Query", width: "60%" }, { label: "Clicks", width: "20%", align: "right" }, { label: "Position", width: "20%", align: "right" }]}
              rows={topQueries.map((q) => [q.dimension_value ?? "", n.format(metricsOf(q.metrics).clicks ?? 0), (metricsOf(q.metrics).position ?? 0).toFixed(1)])}
            />
          </>
        ) : null}
        {topPages.length ? (
          <>
            <Text style={s.subheading}>Top pages</Text>
            <Table
              cols={[{ label: "Page", width: "75%" }, { label: gsc.current?.pages.length ? "Clicks" : "Sessions", width: "25%", align: "right" }]}
              rows={topPages.map((p) => [(p.dimension_value ?? "").replace(/^https?:\/\/[^/]+/, "") || "/", n.format(metricsOf(p.metrics).clicks ?? metricsOf(p.metrics).sessions ?? 0)])}
            />
          </>
        ) : null}

        <Text style={s.sectionBar}>4. Plan for the next cycle</Text>
        {report.next_plan ? <Text style={s.summary}>{report.next_plan}</Text> : null}
        {nextCycle && next.tasks.length ? (
          <Table
            cols={[{ label: "Task", width: "55%" }, { label: "Category", width: "20%" }, { label: "Priority", width: "12%" }, { label: "Due", width: "13%" }]}
            rows={next.tasks.map((t) => [t.title, TASK_CATEGORY[t.category], t.priority, formatShortDate(t.due_date)])}
          />
        ) : (
          <Text style={s.empty}>{nextCycle ? `Cycle ${nextCycle.number} has no tasks yet.` : "The next cycle has not been created yet."}</Text>
        )}
        {next.articles.length ? (
          <>
            <Text style={s.subheading}>Content pipeline</Text>
            <Bullets items={next.articles.map((a) => `${a.title} (${a.status.replace("_", " ")}${a.writer ? `, ${a.writer}` : ""})`)} />
          </>
        ) : null}
        {next.gbpPosts.length ? (
          <>
            <Text style={s.subheading}>GBP posts scheduled</Text>
            <Bullets items={next.gbpPosts.map((p) => `${formatShortDate(p.scheduled_date)} · ${p.title || "(untitled)"}`)} />
          </>
        ) : null}
        {next.backlinks.length ? (
          <>
            <Text style={s.subheading}>Backlinks planned</Text>
            <Bullets items={next.backlinks.map((b) => `${b.source_domain} (${b.status})`)} />
          </>
        ) : null}

        {report.notes ? (
          <>
            <Text style={s.sectionBar}>Notes</Text>
            <Text>{report.notes}</Text>
          </>
        ) : null}

        <View style={s.footer} fixed>
          <Text>Traffixr · {client.name}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderReportPdf(data: ReportData): Promise<Buffer> {
  const buffer = await renderToBuffer(<ReportDocument data={data} />);
  return Buffer.from(buffer);
}

export function reportFilename(data: ReportData) {
  const safe = (v: string) => v.trim().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "");
  return `${safe(data.client.name)}_SEO_Report_Cycle_${data.cycle?.number ?? "x"}_${data.report.period_end}.pdf`;
}
