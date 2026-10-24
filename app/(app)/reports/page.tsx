import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ReportStatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatRange } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("*, client:clients(name), cycle:cycles(number, meeting_date)")
    .order("period_start", { ascending: false });

  return (
    <>
      <PageHeader
        title="Reports"
        description="Two-week client reports across all clients. Create one from a cycle page."
      />
      {(reports ?? []).length === 0 ? (
        <EmptyState title="No reports yet" description="Open a client's cycle and click Report." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Meeting</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports!.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  <Link href={`/clients/${r.client_id}/reports/${r.id}`} className="hover:underline">{r.client?.name}</Link>
                </TableCell>
                <TableCell>Cycle {r.cycle?.number ?? "?"}</TableCell>
                <TableCell className="text-muted-foreground">{formatRange(r.period_start, r.period_end)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(r.cycle?.meeting_date)}</TableCell>
                <TableCell><ReportStatusBadge status={r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
