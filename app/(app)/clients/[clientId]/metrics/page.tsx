import { FileUp, PenLine } from "lucide-react";
import { DeleteButton } from "@/components/shared/delete-button";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteSnapshotSetAction } from "@/lib/actions/metrics";
import { formatRange } from "@/lib/dates";
import { METRIC_SOURCE_SHORT } from "@/lib/labels";
import { getSnapshotSets } from "@/lib/queries/metrics";

const n = new Intl.NumberFormat("en-US");
const pct = (v: number | null | undefined) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`);

export default async function MetricsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const sets = await getSnapshotSets(clientId);
  const base = `/clients/${clientId}/metrics`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Performance metrics</h2>
          <p className="text-sm text-muted-foreground">
            Search Console and GA4 numbers per period. Reports compare a period with the one before it.
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton href={`${base}/manual`} variant="outline" size="sm"><PenLine />Enter totals</LinkButton>
          <LinkButton href={`${base}/import`} size="sm"><FileUp />Import CSV</LinkButton>
        </div>
      </div>

      {sets.length === 0 ? (
        <EmptyState
          title="No metrics yet"
          description="Import the Search Console CSV export (Dates, Queries, Pages) and the GA4 traffic acquisition export, or type the totals in by hand."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Clicks / Sessions</TableHead>
              <TableHead className="text-right">Impressions / Engaged</TableHead>
              <TableHead className="text-right">CTR / Eng. rate</TableHead>
              <TableHead className="text-right">Position / Key events</TableHead>
              <TableHead className="text-right">Queries</TableHead>
              <TableHead className="text-right">Pages</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sets.map((s) => {
              const t = s.totals ?? {};
              const isGsc = s.source === "gsc";
              return (
                <TableRow key={`${s.source}${s.period_start}${s.period_end}`}>
                  <TableCell><Badge variant="outline">{METRIC_SOURCE_SHORT[s.source]}</Badge></TableCell>
                  <TableCell className="font-medium">{formatRange(s.period_start, s.period_end)}</TableCell>
                  <TableCell className="text-right">{t.clicks != null || t.sessions != null ? n.format((isGsc ? t.clicks : t.sessions) ?? 0) : "—"}</TableCell>
                  <TableCell className="text-right">{(isGsc ? t.impressions : t.engaged_sessions) != null ? n.format((isGsc ? t.impressions : t.engaged_sessions) ?? 0) : "—"}</TableCell>
                  <TableCell className="text-right">{pct(isGsc ? t.ctr : t.engagement_rate)}</TableCell>
                  <TableCell className="text-right">{isGsc ? (t.position ?? "—") : (t.key_events ?? "—")}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{s.queries.length || "—"}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{s.pages.length || "—"}</TableCell>
                  <TableCell>
                    <DeleteButton
                      action={deleteSnapshotSetAction.bind(null, clientId, s.source, s.period_start, s.period_end)}
                      label="Delete"
                      size="xs"
                      confirmText="Delete this period's metrics (totals, queries and pages)?"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
