import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { CycleStatusBadge } from "@/components/shared/status-badge";
import { TaskList } from "@/components/tasks/task-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatRange } from "@/lib/dates";
import { asLinkItems } from "@/lib/form";
import { OPEN_TASK_STATUSES } from "@/lib/labels";
import { getClientOr404 } from "@/lib/queries/clients";
import { getBacklogTasks } from "@/lib/queries/tasks";
import { createClient } from "@/lib/supabase/server";

function ContextBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value || <span className="text-muted-foreground">Not set</span>}</p>
    </div>
  );
}

function LinkList({ label, items }: { label: string; items: unknown }) {
  const list = asLinkItems(items);
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not set</p>
      ) : (
        <ul className="flex flex-col gap-0.5 text-sm">
          {list.map((item, i) => (
            <li key={i}>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {item.name}
                </a>
              ) : (
                item.name
              )}
              {item.url ? <span className="ml-2 text-xs text-muted-foreground">{item.url}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClientOr404(clientId);
  const supabase = await createClient();

  const [{ data: cycles }, { data: taskCounts }, backlog] = await Promise.all([
    supabase.from("cycles").select("*").eq("client_id", clientId).order("number", { ascending: false }),
    supabase.from("tasks").select("cycle_id, status").eq("client_id", clientId).not("cycle_id", "is", null),
    getBacklogTasks(clientId),
  ]);

  const counts = new Map<string, { open: number; done: number }>();
  for (const t of taskCounts ?? []) {
    const c = counts.get(t.cycle_id!) ?? { open: 0, done: 0 };
    if (t.status === "done") c.done += 1;
    else if (OPEN_TASK_STATUSES.includes(t.status)) c.open += 1;
    counts.set(t.cycle_id!, c);
  }

  const activeCycle = (cycles ?? []).find((c) => c.status === "active");
  const otherCycles = (cycles ?? []).filter((c) => c.id !== activeCycle?.id);
  const base = `/clients/${clientId}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,2fr)]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <ContextBlock label="CMS" value={client.cms} />
              <ContextBlock label="Industry" value={client.industry} />
              <ContextBlock label="Started" value={client.started_at ? formatDate(client.started_at) : null} />
              <ContextBlock label="GBP" value={client.gbp_url} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content context</CardTitle>
            <CardDescription>Copy into Claude when creating a brief.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ContextBlock label="Audience" value={client.audience} />
            <ContextBlock label="Brand voice" value={client.brand_voice} />
            <LinkList label="Services" items={client.services} />
            <LinkList label="Key pages" items={client.key_pages} />
            <ContextBlock label="Client notes" value={client.client_notes} />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Active cycle</CardTitle>
              <CardDescription>Two-week work cycle and its tasks.</CardDescription>
            </div>
            <LinkButton href={`${base}/cycles/new`} size="sm">
              <Plus />
              New cycle
            </LinkButton>
          </CardHeader>
          <CardContent>
            {activeCycle ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div className="flex flex-col gap-1">
                  <Link href={`${base}/cycles/${activeCycle.id}`} className="font-medium hover:underline">
                    Cycle {activeCycle.number} · {formatRange(activeCycle.start_date, activeCycle.end_date)}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Meeting {formatDate(activeCycle.meeting_date)} ·{" "}
                    {counts.get(activeCycle.id)?.open ?? 0} open ·{" "}
                    {counts.get(activeCycle.id)?.done ?? 0} done
                  </p>
                </div>
                <LinkButton href={`${base}/cycles/${activeCycle.id}`} variant="outline" size="sm">
                  Open board
                </LinkButton>
              </div>
            ) : (
              <EmptyState
                title="No active cycle"
                description="Create a cycle, or start one that is still in planning."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cycle history</CardTitle>
          </CardHeader>
          <CardContent>
            {otherCycles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other cycles yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Meeting</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherCycles.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <Link href={`${base}/cycles/${c.id}`} className="hover:underline">
                          Cycle {c.number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatRange(c.start_date, c.end_date)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(c.meeting_date)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {counts.get(c.id)?.done ?? 0} done / {counts.get(c.id)?.open ?? 0} open
                      </TableCell>
                      <TableCell><CycleStatusBadge status={c.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {backlog.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Backlog</CardTitle>
              <CardDescription>Open tasks not assigned to any cycle.</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList
                tasks={backlog}
                editHref={(t) => `${base}/tasks/${t.id}/edit?return_to=${encodeURIComponent(base)}`}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
