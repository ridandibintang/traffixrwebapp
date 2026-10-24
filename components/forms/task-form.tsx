"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { formatRange } from "@/lib/dates";
import { initialFormState, type FormState } from "@/lib/form";
import { options, PRIORITY, TASK_CATEGORY, TASK_STATUS } from "@/lib/labels";
import type { Task } from "@/lib/types";

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: Task;
  defaultCycleId?: string | null;
  cycles: { id: string; number: number; start_date: string; end_date: string; status: string }[];
  team: { id: string; full_name: string }[];
  returnTo: string;
};

export function TaskForm({ action, initial, defaultCycleId, cycles, team, returnTo }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="return_to" value={returnTo} />

      <Field label="Title" htmlFor="title">
        <Input id="title" name="title" required defaultValue={initial?.title ?? ""} />
      </Field>

      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" rows={4} defaultValue={initial?.description ?? ""} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor="category">
          <NativeSelect id="category" name="category" defaultValue={initial?.category ?? "other"}>
            {options(TASK_CATEGORY).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Priority" htmlFor="priority">
          <NativeSelect id="priority" name="priority" defaultValue={initial?.priority ?? "medium"}>
            {options(PRIORITY).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Status" htmlFor="status">
          <NativeSelect id="status" name="status" defaultValue={initial?.status ?? "todo"}>
            {options(TASK_STATUS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Assignee" htmlFor="assignee_id">
          <NativeSelect id="assignee_id" name="assignee_id" defaultValue={initial?.assignee_id ?? ""}>
            <option value="">Unassigned</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Cycle" htmlFor="cycle_id">
          <NativeSelect
            id="cycle_id"
            name="cycle_id"
            defaultValue={initial?.cycle_id ?? defaultCycleId ?? ""}
          >
            <option value="">No cycle (backlog)</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                Cycle {c.number} · {formatRange(c.start_date, c.end_date)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Due date" htmlFor="due_date">
          <Input id="due_date" name="due_date" type="date" defaultValue={initial?.due_date ?? ""} />
        </Field>
      </div>

      <Field label="Affected URLs" htmlFor="affected_urls" hint="One URL per line.">
        <Textarea
          id="affected_urls"
          name="affected_urls"
          rows={4}
          className="font-mono text-xs"
          defaultValue={(initial?.affected_urls ?? []).join("\n")}
        />
      </Field>

      <FormError error={state.error} />

      <div className="flex gap-2">
        <SubmitButton>{initial ? "Save changes" : "Create task"}</SubmitButton>
        <LinkButton href={returnTo} variant="outline">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
