"use client";

import { useTransition } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { setTaskStatusAction } from "@/lib/actions/tasks";
import { options, TASK_STATUS } from "@/lib/labels";
import type { TaskStatus } from "@/lib/types";

export function TaskStatusSelect({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <NativeSelect
      aria-label="Change status"
      value={status}
      disabled={pending}
      className="h-7 text-xs"
      onChange={(e) => {
        const next = e.target.value as TaskStatus;
        startTransition(() => setTaskStatusAction(taskId, next));
      }}
    >
      {options(TASK_STATUS).map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </NativeSelect>
  );
}
