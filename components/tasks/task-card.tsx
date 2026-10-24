import Link from "next/link";
import { CalendarDays, Link2, UserRound } from "lucide-react";
import { CategoryBadge, PriorityBadge } from "@/components/shared/status-badge";
import { formatShortDate, todayIso } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { TaskWithAssignee } from "@/lib/queries/tasks";
import { TaskStatusSelect } from "./task-status-select";

export function TaskCard({ task, editHref }: { task: TaskWithAssignee; editHref: string }) {
  const overdue =
    task.due_date && task.due_date < todayIso() && !["done", "wont_do"].includes(task.status);

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm shadow-xs">
      <Link href={editHref} className="font-medium leading-snug hover:underline">
        {task.title}
      </Link>
      <div className="flex flex-wrap gap-1">
        <CategoryBadge category={task.category} />
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {task.assignee ? (
          <span className="inline-flex items-center gap-1">
            <UserRound className="size-3" />
            {task.assignee.full_name}
          </span>
        ) : null}
        {task.due_date ? (
          <span className={cn("inline-flex items-center gap-1", overdue && "text-destructive")}>
            <CalendarDays className="size-3" />
            {formatShortDate(task.due_date)}
          </span>
        ) : null}
        {task.affected_urls.length > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Link2 className="size-3" />
            {task.affected_urls.length} URL{task.affected_urls.length === 1 ? "" : "s"}
          </span>
        ) : null}
        {task.source !== "manual" ? <span>via {task.source}</span> : null}
      </div>
      <TaskStatusSelect taskId={task.id} status={task.status} />
    </div>
  );
}
