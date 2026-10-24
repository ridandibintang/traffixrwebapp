import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { BacklinkStatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMonth, formatShortDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Backlink } from "@/lib/types";

const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export default async function BacklinksPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: backlinks } = await supabase
    .from("backlinks")
    .select("*")
    .eq("client_id", clientId)
    .order("month", { ascending: false })
    .order("created_at");

  const byMonth = new Map<string, Backlink[]>();
  for (const b of backlinks ?? []) {
    byMonth.set(b.month, [...(byMonth.get(b.month) ?? []), b]);
  }
  const base = `/clients/${clientId}/backlinks`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Backlinks</h2>
          <p className="text-sm text-muted-foreground">One row per purchased link, grouped by monthly quota.</p>
        </div>
        <LinkButton href={`${base}/new`} size="sm">
          <Plus />
          Add backlink
        </LinkButton>
      </div>

      {byMonth.size === 0 ? (
        <EmptyState title="No backlinks logged" description="Add this month's planned links to track them to live." />
      ) : (
        [...byMonth.entries()].map(([month, rows]) => {
          const live = rows.filter((r) => r.status === "live").length;
          const cost = rows.reduce((sum, r) => sum + (r.cost ?? 0), 0);
          return (
            <section key={month} className="flex flex-col gap-2">
              <header className="flex items-baseline justify-between">
                <h3 className="font-medium">{formatMonth(month)}</h3>
                <p className="text-sm text-muted-foreground">
                  {rows.length} link{rows.length === 1 ? "" : "s"} · {live} live
                  {cost > 0 ? ` · cost ${money.format(cost)}` : ""}
                </p>
              </header>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Target page</TableHead>
                    <TableHead>Anchor</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Ordered</TableHead>
                    <TableHead>Live</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        <Link href={`${base}/${b.id}/edit`} className="hover:underline">
                          {b.source_domain}
                        </Link>
                        {b.source_url ? (
                          <a href={b.source_url} target="_blank" rel="noreferrer" className="ml-2 text-xs text-muted-foreground hover:underline">
                            open
                          </a>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-64 truncate text-muted-foreground" title={b.target_url}>
                        {b.target_url}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{b.anchor_text ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{b.cost != null ? money.format(b.cost) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatShortDate(b.ordered_at)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatShortDate(b.live_at)}</TableCell>
                      <TableCell><BacklinkStatusBadge status={b.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          );
        })
      )}
    </div>
  );
}
