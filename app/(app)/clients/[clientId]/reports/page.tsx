import Link from "next/link";
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
import { formatDate, formatRange } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export default async function ClientReportsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("*, cycle:cycles(number, meeting_date)")
    .eq("client_id", clientId)
    .order("period_start", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Reports</h2>
        <p className="text-sm text-muted-foreground">
          One report per cycle. Open a cycle and click Report to create it.
        </p>
      </div>

      {(reports ?? []).length === 0 ? (
        <EmptyState title="No reports yet" description="Reports are created from the cycle page once the cycle is in review." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cycle</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Meeting</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports!.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  <Link href={`/clients/${clientId}/reports/${r.id}`} className="hover:underline">
                    Cycle {r.cycle?.number ?? "?"} report
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatRange(r.period_start, r.period_end)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(r.cycle?.meeting_date)}</TableCell>
                <TableCell><ReportStatusBadge status={r.status} /></TableCell>
                <TableCell className="text-muted-foreground">{formatDate(r.updated_at.slice(0, 10))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
