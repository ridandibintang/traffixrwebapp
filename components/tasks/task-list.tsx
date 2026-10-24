import Link from "next/link";
import { CategoryBadge, PriorityBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatShortDate, todayIso } from "@/lib/dates";
import { TASK_SOURCE } from "@/lib/labels";
import type { TaskWithAssignee } from "@/lib/queries/tasks";
import { cn } from "@/lib/utils";
import { TaskStatusSelect } from "./task-status-select";

export function TaskList({
  tasks,
  editHref,
}: {
  tasks: TaskWithAssignee[];
  editHref: (task: TaskWithAssignee) => string;
}) {
  const today = todayIso();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>URLs</TableHead>
          <TableHead>Source</TableHead>
          <TableHead className="w-36">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-muted-foreground">
              No tasks match this filter.
            </TableCell>
          </TableRow>
        ) : (
          tasks.map((task) => {
            const overdue =
              task.due_date && task.due_date < today && !["done", "wont_do"].includes(task.status);
            return (
              <TableRow key={task.id}>
                <TableCell className="font-medium">
                  <Link href={editHref(task)} className="hover:underline">
                    {task.title}
                  </Link>
                </TableCell>
                <TableCell><CategoryBadge category={task.category} /></TableCell>
                <TableCell><PriorityBadge priority={task.priority} /></TableCell>
                <TableCell className="text-muted-foreground">{task.assignee?.full_name ?? "—"}</TableCell>
                <TableCell className={cn("text-muted-foreground", overdue && "text-destructive")}>
                  {formatShortDate(task.due_date)}
                </TableCell>
                <TableCell className="text-muted-foreground">{task.affected_urls.length || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{TASK_SOURCE[task.source]}</TableCell>
                <TableCell><TaskStatusSelect taskId={task.id} status={task.status} /></TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
