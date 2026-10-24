"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { initialFormState, type FormState } from "@/lib/form";
import { CYCLE_STATUS, options } from "@/lib/labels";
import type { Cycle, CycleStatus } from "@/lib/types";

type Defaults = {
  number: number;
  start_date: string;
  end_date: string;
  meeting_date: string | null;
  status: CycleStatus;
  summary: string | null;
};

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial: Cycle | Defaults;
  isEdit: boolean;
  cancelHref: string;
  /** When creating the next cycle after closing one: offer to move its open tasks. */
  moveFrom?: { cycleId: string; cycleNumber: number; openTasks: number };
};

export function CycleForm({ action, initial, isEdit, cancelHref, moveFrom }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cycle number" htmlFor="number">
          <Input id="number" name="number" type="number" min={1} required defaultValue={initial.number} />
        </Field>
        <Field label="Status" htmlFor="status">
          <NativeSelect id="status" name="status" defaultValue={initial.status}>
            {options(CYCLE_STATUS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Start date" htmlFor="start_date">
          <Input id="start_date" name="start_date" type="date" required defaultValue={initial.start_date} />
        </Field>
        <Field label="End date" htmlFor="end_date">
          <Input id="end_date" name="end_date" type="date" required defaultValue={initial.end_date} />
        </Field>
        <Field label="Meeting date" htmlFor="meeting_date" hint="Client meeting that closes this cycle.">
          <Input id="meeting_date" name="meeting_date" type="date" defaultValue={initial.meeting_date ?? ""} />
        </Field>
      </div>

      <Field label="Summary" htmlFor="summary" hint="Goal or focus of this cycle. Shown on the report later.">
        <Textarea id="summary" name="summary" rows={3} defaultValue={initial.summary ?? ""} />
      </Field>

      {moveFrom ? (
        <div className="rounded-lg border bg-muted/40 p-4">
          <input type="hidden" name="move_from" value={moveFrom.cycleId} />
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="move_tasks"
              defaultChecked={moveFrom.openTasks > 0}
              disabled={moveFrom.openTasks === 0}
              className="mt-0.5 size-4"
            />
            <span>
              Move {moveFrom.openTasks} unfinished {moveFrom.openTasks === 1 ? "task" : "tasks"} from
              Cycle {moveFrom.cycleNumber} into this cycle
              {moveFrom.openTasks === 0 ? " (nothing to move)" : ""}.
              <span className="block text-xs text-muted-foreground">
                Template tasks are not moved; this cycle gets fresh ones from the templates.
              </span>
            </span>
          </label>
        </div>
      ) : null}

      <FormError error={state.error} />

      <div className="flex gap-2">
        <SubmitButton>{isEdit ? "Save changes" : "Create cycle"}</SubmitButton>
        <LinkButton href={cancelHref} variant="outline">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
