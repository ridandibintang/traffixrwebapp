import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArticleStatusBadge, CategoryBadge, PriorityBadge } from "@/components/shared/status-badge";
import { formatDate, formatRange, formatShortDate } from "@/lib/dates";
import { GBP_POST_TYPE } from "@/lib/labels";
import type { ReportData } from "@/lib/reports/assemble";
import { delta } from "@/lib/reports/assemble";

const n = new Intl.NumberFormat("en-US");

function Section({ number, title, summary, children }: { number: number; title: string; summary: string | null; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-semibold">
        {number}. {title}
      </h3>
      {summary ? <p className="text-sm whitespace-pre-wrap">{summary}</p> : null}
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

function Delta({ current, previous, lowerIsBetter, decimals = 0, percent }: { current: number | null | undefined; previous: number | null | undefined; lowerIsBetter?: boolean; decimals?: number; percent?: boolean }) {
  const d = delta(current, previous);
  if (!d) return <span className="text-muted-foreground">—</span>;
  const good = lowerIsBetter ? d.diff < 0 : d.diff > 0;
  const value = percent ? `${(d.diff * 100).toFixed(1)} pp` : decimals ? d.diff.toFixed(decimals) : n.format(Math.round(d.diff));
  return (
    <span className={d.diff === 0 ? "text-muted-foreground" : good ? "text-green-700 dark:text-green-400" : "text-destructive"}>
      {d.diff > 0 ? "+" : ""}
      {value}
      {d.pct != null && !percent ? ` (${d.diff > 0 ? "+" : ""}${d.pct.toFixed(1)}%)` : ""}
    </span>
  );
}

function MetricRow({ label, current, previous, format, lowerIsBetter, decimals, percent }: { label: string; current: number | null | undefined; previous: number | null | undefined; format: (v: number) => string; lowerIsBetter?: boolean; decimals?: number; percent?: boolean }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="text-right">{current != null ? format(current) : "—"}</TableCell>
      <TableCell className="text-right text-muted-foreground">{previous != null ? format(previous) : "—"}</TableCell>
      <TableCell className="text-right"><Delta current={current} previous={previous} lowerIsBetter={lowerIsBetter} decimals={decimals} percent={percent} /></TableCell>
    </TableRow>
  );
}

export function ReportView({ data }: { data: ReportData }) {
  const { report, done, offpage, performance, next, nextCycle } = data;
  const gsc = performance.gsc;
  const ga4 = performance.ga4;
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <div className="flex flex-col gap-8">
      <Section number={1} title="Work completed" summary={report.done_summary}>
        {done.tasks.length === 0 ? (
          <Empty text="No tasks marked done in this cycle." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">URLs</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {done.tasks.map((t, i) => (
                <TableRow key={i}>
                  <TableCell>{t.title}</TableCell>
                  <TableCell><CategoryBadge category={t.category} /></TableCell>
                  <TableCell className="text-right text-muted-foreground">{t.urls || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{t.assignee ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {done.articles.length > 0 ? (
          <div>
            <p className="mb-1 text-sm font-medium">Articles published</p>
            <ul className="list-disc pl-5 text-sm">
              {done.articles.map((a, i) => (
                <li key={i}>
                  {a.published_url ? <a href={a.published_url} target="_blank" rel="noreferrer" className="hover:underline">{a.title}</a> : a.title}
                  <span className="text-muted-foreground"> · {a.writer ?? "—"} · {a.published_at ? formatDate(a.published_at.slice(0, 10)) : ""}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {done.fixedFindings.length > 0 ? (
          <div>
            <p className="mb-1 text-sm font-medium">Crawl issues fixed ({n.format(done.fixedTotal)})</p>
            <ul className="list-disc pl-5 text-sm">
              {done.fixedFindings.map((f) => (
                <li key={f.issue_name}>{f.issue_name}: {f.count}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>

      <Section number={2} title="Off-page" summary={report.offpage_summary}>
        {offpage.backlinks.length === 0 ? (
          <Empty text="No backlinks went live in this period." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Target page</TableHead>
                <TableHead>Anchor</TableHead>
                <TableHead>Live</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offpage.backlinks.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.source_url ? <a href={b.source_url} target="_blank" rel="noreferrer" className="hover:underline">{b.source_domain}</a> : b.source_domain}</TableCell>
                  <TableCell className="max-w-64 truncate text-muted-foreground" title={b.target_url}>{b.target_url}</TableCell>
                  <TableCell className="text-muted-foreground">{b.anchor_text ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatShortDate(b.live_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {offpage.gbpPosts.length > 0 ? (
          <div>
            <p className="mb-1 text-sm font-medium">GBP posts published ({offpage.gbpPosts.length})</p>
            <ul className="list-disc pl-5 text-sm">
              {offpage.gbpPosts.map((p) => (
                <li key={p.id}>{formatShortDate(p.scheduled_date)} · {p.title || "(untitled)"} <span className="text-muted-foreground">· {GBP_POST_TYPE[p.post_type]}</span></li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>

      <Section number={3} title="Organic performance" summary={report.performance_summary}>
        {!gsc.current && !ga4.current ? (
          <Empty text="No metrics imported for this period. Add them on the Metrics tab." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">
                  This period
                  {gsc.current ? <span className="block text-xs font-normal text-muted-foreground">{formatRange(gsc.current.period_start, gsc.current.period_end)}</span> : null}
                </TableHead>
                <TableHead className="text-right">
                  Previous
                  {gsc.previous ? <span className="block text-xs font-normal text-muted-foreground">{formatRange(gsc.previous.period_start, gsc.previous.period_end)}</span> : null}
                </TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gsc.current ? (
                <>
                  <MetricRow label="Clicks" current={gsc.current.totals?.clicks} previous={gsc.previous?.totals?.clicks} format={(v) => n.format(v)} />
                  <MetricRow label="Impressions" current={gsc.current.totals?.impressions} previous={gsc.previous?.totals?.impressions} format={(v) => n.format(v)} />
                  <MetricRow label="CTR" current={gsc.current.totals?.ctr} previous={gsc.previous?.totals?.ctr} format={pct} percent />
                  <MetricRow label="Average position" current={gsc.current.totals?.position} previous={gsc.previous?.totals?.position} format={(v) => v.toFixed(1)} lowerIsBetter decimals={1} />
                </>
              ) : null}
              {ga4.current ? (
                <>
                  <MetricRow label="Organic sessions" current={ga4.current.totals?.sessions} previous={ga4.previous?.totals?.sessions} format={(v) => n.format(v)} />
                  <MetricRow label="Engaged sessions" current={ga4.current.totals?.engaged_sessions} previous={ga4.previous?.totals?.engaged_sessions} format={(v) => n.format(v)} />
                  <MetricRow label="Key events" current={ga4.current.totals?.key_events} previous={ga4.previous?.totals?.key_events} format={(v) => n.format(v)} />
                </>
              ) : null}
            </TableBody>
          </Table>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {gsc.current && gsc.current.queries.length > 0 ? (
            <div>
              <p className="mb-1 text-sm font-medium">Top queries</p>
              <Table>
                <TableHeader><TableRow><TableHead>Query</TableHead><TableHead className="text-right">Clicks</TableHead><TableHead className="text-right">Pos.</TableHead></TableRow></TableHeader>
                <TableBody>
                  {gsc.current.queries.slice(0, 10).map((q) => {
                    const m = (q.metrics ?? {}) as Record<string, number>;
                    return (
                      <TableRow key={q.id}>
                        <TableCell>{q.dimension_value}</TableCell>
                        <TableCell className="text-right">{n.format(m.clicks ?? 0)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{m.position?.toFixed(1) ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}
          {(gsc.current?.pages.length || ga4.current?.pages.length) ? (
            <div>
              <p className="mb-1 text-sm font-medium">Top pages</p>
              <Table>
                <TableHeader><TableRow><TableHead>Page</TableHead><TableHead className="text-right">{gsc.current?.pages.length ? "Clicks" : "Sessions"}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(gsc.current?.pages.length ? gsc.current.pages : ga4.current!.pages).slice(0, 10).map((p) => {
                    const m = (p.metrics ?? {}) as Record<string, number>;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="max-w-72 truncate" title={p.dimension_value ?? ""}>{(p.dimension_value ?? "").replace(/^https?:\/\/[^/]+/, "") || "/"}</TableCell>
                        <TableCell className="text-right">{n.format(m.clicks ?? m.sessions ?? 0)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </div>
      </Section>

      <Section number={4} title="Plan for the next cycle" summary={report.next_plan}>
        {!nextCycle ? (
          <Empty text="Create the next cycle to list its planned tasks here." />
        ) : next.tasks.length === 0 ? (
          <Empty text={`Cycle ${nextCycle.number} has no tasks yet.`} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {next.tasks.map((t, i) => (
                <TableRow key={i}>
                  <TableCell>{t.title}</TableCell>
                  <TableCell><CategoryBadge category={t.category} /></TableCell>
                  <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                  <TableCell className="text-muted-foreground">{formatShortDate(t.due_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {next.articles.length > 0 ? (
            <div>
              <p className="mb-1 text-sm font-medium">Content pipeline</p>
              <ul className="flex flex-col gap-1 text-sm">
                {next.articles.map((a, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <ArticleStatusBadge status={a.status} />
                    <span>{a.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {next.gbpPosts.length > 0 ? (
            <div>
              <p className="mb-1 text-sm font-medium">GBP posts scheduled</p>
              <ul className="list-disc pl-5 text-sm">
                {next.gbpPosts.map((p) => (
                  <li key={p.id}>{formatShortDate(p.scheduled_date)} · {p.title || "(untitled)"}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {next.backlinks.length > 0 ? (
            <div>
              <p className="mb-1 text-sm font-medium">Backlinks planned</p>
              <ul className="list-disc pl-5 text-sm">
                {next.backlinks.map((b) => (
                  <li key={b.id}>{b.source_domain} <Badge variant="outline">{b.status}</Badge></li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Section>

      {report.notes ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">Notes</h3>
          <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
        </section>
      ) : null}
    </div>
  );
}
