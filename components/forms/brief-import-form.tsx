"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { initialFormState, type FormState } from "@/lib/form";

export function BriefImportForm({
  action,
  cancelHref,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <Field label="JSON file" htmlFor="file" hint="The [Client]_[Keyword]_Content_Brief.json file the Golden Standard skill produces.">
        <Input id="file" name="file" type="file" accept=".json,application/json" />
      </Field>
      <Field label="Or paste the JSON" htmlFor="json_text">
        <Textarea id="json_text" name="json_text" rows={10} className="font-mono text-xs" placeholder='{ "schema_version": 1, ... }' />
      </Field>

      <FormError error={state.error} />

      <div className="flex gap-2">
        <SubmitButton pendingText="Importing...">Import brief</SubmitButton>
        <LinkButton href={cancelHref} variant="outline">Cancel</LinkButton>
      </div>
    </form>
  );
}
