import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryBadge, CycleStatusBadge, PriorityBadge } from "@/components/shared/status-badge";
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
import { formatDate, formatShortDate } from "@/lib/dates";
import { getDashboardData } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils";

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <Card className={cn(href && "transition-colors hover:bg-muted/40")}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function DashboardPage() {
  const user = await requireAdmin();
  const data = await getDashboardData();

  const overdue = data.tasksDue.filter((t) => t.due_date! < data.today);
  const dueThisWeek = data.tasksDue.filter((t) => t.due_date! >= data.today);
  const meetingsSoon = data.cycles.filter(
    (c) => c.meeting_date && c.meeting_date >= data.today && c.meeting_date <= data.in7Days,
  );

  // Off-page status per active client: backlinks this month, GBP post this week.
  const offPage = data.clients.map((client) => {
    const links = data.backlinksThisMonth.filter((b) => b.client_id === client.id);
    const postsThisWeek = data.gbpPosts.filter(
      (p) => p.client_id === client.id && p.scheduled_date <= data.weekEnd,
    );
    return {
      client,
      links: links.length,
      live: links.filter((b) => b.status === "live").length,
      postsThisWeek: postsThisWeek.length,
    };
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.profile.full_name || user.email}. Week of ${formatDate(data.weekStart)}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tasks due this week" value={dueThisWeek.length} />
        <Stat label="Overdue tasks" value={overdue.length} />
        <Stat label="Meetings in the next 7 days" value={meetingsSoon.length} />
        <Stat label="Articles waiting for review" value={data.articlesWaitingReview} href="/content" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Tasks due this week</CardTitle>
            <CardDescription>Open tasks across all clients, overdue first.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.tasksDue.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing due this week.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.tasksDue.map((t) => {
                    const isOverdue = t.due_date! < data.today;
                    const href = t.cycle_id
                      ? `/clients/${t.client_id}/cycles/${t.cycle_id}`
                      : `/clients/${t.client_id}`;
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          <Link href={href} className="hover:underline">
                            {t.title}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{t.client?.name}</TableCell>
                        <TableCell><CategoryBadge category={t.category} /></TableCell>
                        <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                        <TableCell className="text-muted-foreground">{t.assignee?.full_name ?? "—"}</TableCell>
                        <TableCell className={cn("text-muted-foreground", isOverdue && "font-medium text-destructive")}>
                          {formatShortDate(t.due_date)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cycles and meetings</CardTitle>
              <CardDescription>Active and in-review cycles, soonest meeting first.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {data.cycles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active cycle. Start one from a client page.
                </p>
              ) : (
                data.cycles.map((c) => {
                  const soon =
                    c.meeting_date && c.meeting_date >= data.today && c.meeting_date <= data.in7Days;
                  return (
                    <Link
                      key={c.id}
                      href={`/clients/${c.client_id}/cycles/${c.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/40"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {c.client?.name} · Cycle {c.number}
                        </span>
                        <span className={cn("text-xs text-muted-foreground", soon && "font-medium text-foreground")}>
                          Meeting {formatDate(c.meeting_date)}
                        </span>
                      </div>
                      <CycleStatusBadge status={c.status} />
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Off-page this period</CardTitle>
              <CardDescription>Backlinks this month and GBP posts this week, per client.</CardDescription>
            </CardHeader>
            <CardContent>
              {offPage.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active clients.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Backlinks</TableHead>
                      <TableHead>GBP this week</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offPage.map((row) => (
                      <TableRow key={row.client.id}>
                        <TableCell className="font-medium">
                          <Link href={`/clients/${row.client.id}`} className="hover:underline">
                            {row.client.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/clients/${row.client.id}/backlinks`}
                            className={cn("hover:underline", row.links === 0 && "text-destructive")}
                          >
                            {row.links === 0 ? "None logged" : `${row.live} live / ${row.links}`}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/clients/${row.client.id}/gbp`}
                            className={cn("hover:underline", row.postsThisWeek === 0 && "text-destructive")}
                          >
                            {row.postsThisWeek === 0 ? "Not scheduled" : `${row.postsThisWeek} scheduled`}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
