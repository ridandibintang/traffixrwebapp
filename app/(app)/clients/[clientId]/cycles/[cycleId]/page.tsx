import { notFound } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { CycleActions } from "@/components/cycles/cycle-actions";
import { LinkButton } from "@/components/shared/link-button";
import { CycleStatusBadge } from "@/components/shared/status-badge";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskList } from "@/components/tasks/task-list";
import { formatDate, formatRange } from "@/lib/dates";
import { TASK_CATEGORY } from "@/lib/labels";
import { getCycleTasks } from "@/lib/queries/tasks";
import { createClient } from "@/lib/supabase/server";
import { syncRecurringTasks } from "@/lib/templates";
import type { TaskCategory } from "@/lib/types";

export default async function CyclePage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; cycleId: string }>;
  searchParams: Promise<{ view?: string; category?: string }>;
}) {
  const { clientId, cycleId } = await params;
  const sp = await searchParams;
  const view = sp.view === "list" ? "list" : "board";
  const category =
    sp.category && sp.category in TASK_CATEGORY ? (sp.category as TaskCategory) : null;

  const supabase = await createClient();
  const { data: cycle } = await supabase
    .from("cycles")
    .select("*")
    .eq("id", cycleId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (!cycle) notFound();

  // Weekly/monthly template tasks appear the first time the active cycle is opened in a new period.
  if (cycle.status === "active") await syncRecurringTasks(supabase, clientId);

  const tasks = await getCycleTasks(cycleId, category);

  const basePath = `/clients/${clientId}/cycles/${cycleId}`;
  const qs = new URLSearchParams();
  if (view !== "board") qs.set("view", view);
  if (category) qs.set("category", category);
  const returnTo = qs.toString() ? `${basePath}?${qs}` : basePath;
  const editHref = (t: { id: string }) =>
    `/clients/${clientId}/tasks/${t.id}/edit?return_to=${encodeURIComponent(returnTo)}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">
              Cycle {cycle.number} · {formatRange(cycle.start_date, cycle.end_date)}
            </h2>
            <CycleStatusBadge status={cycle.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Meeting {formatDate(cycle.meeting_date)}
            {cycle.summary ? ` · ${cycle.summary}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CycleActions cycleId={cycle.id} status={cycle.status} />
          <LinkButton href={`${basePath}/edit`} variant="outline" size="sm">
            <Pencil />
            Edit
          </LinkButton>
          <LinkButton
            href={`/clients/${clientId}/tasks/new?cycle=${cycle.id}&return_to=${encodeURIComponent(returnTo)}`}
            size="sm"
          >
            <Plus />
            New task
          </LinkButton>
        </div>
      </div>

      <TaskFilters basePath={basePath} view={view} category={category} />

      {view === "board" ? (
        <TaskBoard tasks={tasks} editHref={editHref} />
      ) : (
        <TaskList tasks={tasks} editHref={editHref} />
      )}
    </div>
  );
}
