"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { initialFormState, type FormState } from "@/lib/form";
import { options, TASK_CATEGORY, TEMPLATE_FREQUENCY } from "@/lib/labels";
import type { TaskTemplate } from "@/lib/types";

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: TaskTemplate;
  clients: { id: string; name: string }[];
  team: { id: string; full_name: string }[];
};

export function TemplateForm({ action, initial, clients, team }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <Field label="Title" htmlFor="title" hint='Example: "Crawl site in Screaming Frog" or "Post to GBP this week".'>
        <Input id="title" name="title" required defaultValue={initial?.title ?? ""} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client" htmlFor="client_id" hint="Leave on All clients to apply everywhere.">
          <NativeSelect id="client_id" name="client_id" defaultValue={initial?.client_id ?? ""}>
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          label="Frequency"
          htmlFor="frequency"
          hint="Every cycle: created with each new cycle. Weekly/monthly: added to the active cycle when a new week or month starts."
        >
          <NativeSelect id="frequency" name="frequency" defaultValue={initial?.frequency ?? "per_cycle"}>
            {options(TEMPLATE_FREQUENCY).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Category" htmlFor="category">
          <NativeSelect id="category" name="category" defaultValue={initial?.category ?? "other"}>
            {options(TASK_CATEGORY).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Default assignee" htmlFor="default_assignee_id">
          <NativeSelect
            id="default_assignee_id"
            name="default_assignee_id"
            defaultValue={initial?.default_assignee_id ?? ""}
          >
            <option value="">Unassigned</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <FormError error={state.error} />

      <div className="flex gap-2">
        <SubmitButton>{initial ? "Save changes" : "Create template"}</SubmitButton>
        <LinkButton href="/templates" variant="outline">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
