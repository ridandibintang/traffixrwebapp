"use client";

import { useActionState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/shared/field";
import { SubmitButton } from "@/components/shared/submit-button";
import { initialFormState, type FormState } from "@/lib/form";

const CHECKS = [
  { name: "intent_ok", label: "Matches the search intent and the brief" },
  { name: "readability_ok", label: "Reads well: structure, headings, paragraph length" },
  { name: "facts_ok", label: "Facts, numbers, and links are correct" },
];

export function ReviewForm({
  action,
  round,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  round: number;
}) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Review round {round}</p>
      <div className="flex flex-col gap-2">
        {CHECKS.map((c) => (
          <label key={c.name} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name={c.name} className="size-4" />
            {c.label}
          </label>
        ))}
      </div>
      <Field label="Notes for the writer" htmlFor="notes" hint="Required when requesting a revision.">
        <Textarea id="notes" name="notes" rows={4} />
      </Field>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="decision" value="approve" className="size-4" />
          Approve
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="decision" value="revise" className="size-4" defaultChecked />
          Request revision
        </label>
      </div>
      <FormError error={state.error} />
      <SubmitButton className="self-start" pendingText="Saving review...">Submit review</SubmitButton>
    </form>
  );
}
