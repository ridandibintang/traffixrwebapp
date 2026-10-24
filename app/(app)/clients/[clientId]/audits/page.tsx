import Link from "next/link";
import { Upload } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { AuditTypeBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { getAuditStateCounts, getClientAudits } from "@/lib/queries/audits";

export default async function ClientAuditsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const audits = await getClientAudits(clientId);
  const counts = await getAuditStateCounts(audits.map((a) => a.id));
  const base = `/clients/${clientId}/audits`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Audits</h2>
          <p className="text-sm text-muted-foreground">One row per Screaming Frog crawl. Each crawl is compared with the previous one of the same type.</p>
        </div>
        <LinkButton href={`${base}/new`} size="sm"><Upload />Import crawl</LinkButton>
      </div>

      {audits.length === 0 ? (
        <EmptyState
          title="No crawls imported yet"
          description="Crawl the site in Screaming Frog, export Bulk Export > Issues > All, and upload the CSV files here."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Crawl date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead className="text-right">URLs</TableHead>
              <TableHead className="text-right">Findings</TableHead>
              <TableHead className="text-right">New</TableHead>
              <TableHead className="text-right">Persisting</TableHead>
              <TableHead className="text-right">Fixed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audits.map((a) => {
              const c = counts.get(a.id);
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <Link href={`${base}/${a.id}`} className="hover:underline">{formatDate(a.crawl_date)}</Link>
                  </TableCell>
                  <TableCell><AuditTypeBadge type={a.type} /></TableCell>
                  <TableCell className="text-muted-foreground">{a.cycle ? `Cycle ${a.cycle.number}` : "—"}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{a.total_urls ?? "—"}</TableCell>
                  <TableCell className="text-right">{c?.total ?? 0}</TableCell>
                  <TableCell className="text-right">{c?.new ?? 0}</TableCell>
                  <TableCell className="text-right">{c?.persisting ?? 0}</TableCell>
                  <TableCell className="text-right">{c?.fixed ?? 0}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
