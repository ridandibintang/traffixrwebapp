"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { initialFormState, type FormState } from "@/lib/form";
import { BACKLINK_STATUS, options } from "@/lib/labels";
import type { Backlink } from "@/lib/types";

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: Backlink;
  defaultMonth: string; // YYYY-MM
  cancelHref: string;
};

export function BacklinkForm({ action, initial, defaultMonth, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Month" htmlFor="month" hint="Which monthly quota this backlink counts toward.">
          <Input
            id="month"
            name="month"
            type="month"
            required
            defaultValue={initial ? initial.month.slice(0, 7) : defaultMonth}
          />
        </Field>
        <Field label="Status" htmlFor="status">
          <NativeSelect id="status" name="status" defaultValue={initial?.status ?? "planned"}>
            {options(BACKLINK_STATUS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Source domain" htmlFor="source_domain">
          <Input id="source_domain" name="source_domain" required placeholder="example.com" defaultValue={initial?.source_domain ?? ""} />
        </Field>
        <Field label="Source URL" htmlFor="source_url" hint="The article that carries the link, once published.">
          <Input id="source_url" name="source_url" type="url" placeholder="https://" defaultValue={initial?.source_url ?? ""} />
        </Field>
        <Field label="Target URL" htmlFor="target_url" hint="Client page the link points to.">
          <Input id="target_url" name="target_url" type="url" required placeholder="https://" defaultValue={initial?.target_url ?? ""} />
        </Field>
        <Field label="Anchor text" htmlFor="anchor_text">
          <Input id="anchor_text" name="anchor_text" defaultValue={initial?.anchor_text ?? ""} />
        </Field>
        <Field label="Cost" htmlFor="cost">
          <Input id="cost" name="cost" type="number" min={0} step="0.01" defaultValue={initial?.cost ?? ""} />
        </Field>
        <div />
        <Field label="Ordered on" htmlFor="ordered_at">
          <Input id="ordered_at" name="ordered_at" type="date" defaultValue={initial?.ordered_at ?? ""} />
        </Field>
        <Field label="Live on" htmlFor="live_at">
          <Input id="live_at" name="live_at" type="date" defaultValue={initial?.live_at ?? ""} />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} defaultValue={initial?.notes ?? ""} />
      </Field>

      <FormError error={state.error} />

      <div className="flex gap-2">
        <SubmitButton>{initial ? "Save changes" : "Add backlink"}</SubmitButton>
        <LinkButton href={cancelHref} variant="outline">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
