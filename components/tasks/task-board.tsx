import { TASK_STATUS, TASK_STATUS_ORDER } from "@/lib/labels";
import type { TaskWithAssignee } from "@/lib/queries/tasks";
import { TaskCard } from "./task-card";

export function TaskBoard({
  tasks,
  editHref,
}: {
  tasks: TaskWithAssignee[];
  editHref: (task: TaskWithAssignee) => string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
      {TASK_STATUS_ORDER.map((status) => {
        const column = tasks.filter((t) => t.status === status);
        return (
          <section key={status} className="flex flex-col gap-2 rounded-lg bg-muted/50 p-2">
            <header className="flex items-center justify-between px-1 text-xs font-semibold text-muted-foreground uppercase">
              <span>{TASK_STATUS[status]}</span>
              <span>{column.length}</span>
            </header>
            {column.length === 0 ? (
              <p className="px-1 py-3 text-center text-xs text-muted-foreground">No tasks</p>
            ) : (
              column.map((task) => (
                <TaskCard key={task.id} task={task} editHref={editHref(task)} />
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}
