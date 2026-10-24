import Link from "next/link";
import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
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
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { getAllAudits, getAuditStateCounts } from "@/lib/queries/audits";

export default async function AuditsPage() {
  await requireAdmin();
  const audits = await getAllAudits();
  const counts = await getAuditStateCounts(audits.map((a) => a.id));

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Audits"
          description="Screaming Frog crawls across all clients. Import a new crawl from the client's Audits tab."
        />
        <LinkButton href="/audits/rules" variant="outline">
          <ListChecks />
          Issue rules
        </LinkButton>
      </div>

      {audits.length === 0 ? (
        <EmptyState
          title="No crawls yet"
          description="Open a client, go to Audits, and import the Bulk Export > Issues > All CSV files."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Crawl date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Cycle</TableHead>
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
                    <Link href={`/clients/${a.client_id}/audits/${a.id}`} className="hover:underline">{a.client?.name}</Link>
                  </TableCell>
                  <TableCell>{formatDate(a.crawl_date)}</TableCell>
                  <TableCell><AuditTypeBadge type={a.type} /></TableCell>
                  <TableCell className="text-muted-foreground">{a.cycle ? `Cycle ${a.cycle.number}` : "—"}</TableCell>
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
    </>
  );
}
