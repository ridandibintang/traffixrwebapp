import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { BacklinkStatusBadge, GbpStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { formatMonth, formatShortDate } from "@/lib/dates";
import { GBP_POST_TYPE } from "@/lib/labels";
import { getDashboardData } from "@/lib/queries/dashboard";

// Cross-client view of the two off-page routines. Editing happens on each
// client's Backlinks and GBP posts tabs.
export default async function OffPagePage() {
  await requireAdmin();
  const data = await getDashboardData();
  const clientName = new Map(data.clients.map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader
        title="Off-page"
        description={`Backlinks for ${formatMonth(data.monthStart)} and GBP posts for the next two weeks.`}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Backlinks this month</CardTitle>
            <CardDescription>Every client should have its monthly quota logged here.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.backlinksThisMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground">No backlinks logged for this month yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.backlinksThisMonth.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        <Link href={`/clients/${b.client_id}/backlinks`} className="hover:underline">
                          {clientName.get(b.client_id) ?? "—"}
                        </Link>
                      </TableCell>
                      <TableCell>{b.source_domain}</TableCell>
                      <TableCell className="max-w-56 truncate text-muted-foreground" title={b.target_url}>
                        {b.target_url}
                      </TableCell>
                      <TableCell><BacklinkStatusBadge status={b.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming GBP posts</CardTitle>
            <CardDescription>Scheduled from this week through the next two weeks.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.gbpPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.gbpPosts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground">{formatShortDate(p.scheduled_date)}</TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/clients/${p.client_id}/gbp`} className="hover:underline">
                          {clientName.get(p.client_id) ?? "—"}
                        </Link>
                      </TableCell>
                      <TableCell>{p.title || <span className="text-muted-foreground">(untitled)</span>}</TableCell>
                      <TableCell>{GBP_POST_TYPE[p.post_type]}</TableCell>
                      <TableCell><GbpStatusBadge status={p.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
