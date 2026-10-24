"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { formatRange } from "@/lib/dates";
import { initialFormState, type FormState } from "@/lib/form";
import { ARTICLE_STATUS, options } from "@/lib/labels";
import type { Article } from "@/lib/types";

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: Article;
  defaults?: { brief_id?: string | null; title?: string };
  briefs: { id: string; target_keyword: string }[];
  writers: { id: string; full_name: string }[];
  cycles: { id: string; number: number; start_date: string; end_date: string }[];
  cancelHref: string;
};

export function ArticleForm({ action, initial, defaults, briefs, writers, cycles, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <Field label="Title" htmlFor="title" hint="Working title; the writer may refine it in the draft.">
        <Input id="title" name="title" required defaultValue={initial?.title ?? defaults?.title ?? ""} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brief" htmlFor="brief_id">
          <NativeSelect id="brief_id" name="brief_id" defaultValue={initial?.brief_id ?? defaults?.brief_id ?? ""}>
            <option value="">No brief</option>
            {briefs.map((b) => (
              <option key={b.id} value={b.id}>{b.target_keyword}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Writer" htmlFor="writer_id" hint="Assigning a writer puts the article in their portal.">
          <NativeSelect id="writer_id" name="writer_id" defaultValue={initial?.writer_id ?? ""}>
            <option value="">Unassigned</option>
            {writers.map((w) => (
              <option key={w.id} value={w.id}>{w.full_name}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Due date" htmlFor="due_date">
          <Input id="due_date" name="due_date" type="date" defaultValue={initial?.due_date ?? ""} />
        </Field>
        <Field label="Cycle" htmlFor="cycle_id" hint="Optional: counts the article toward that cycle's report.">
          <NativeSelect id="cycle_id" name="cycle_id" defaultValue={initial?.cycle_id ?? ""}>
            <option value="">No cycle</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                Cycle {c.number} · {formatRange(c.start_date, c.end_date)}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      {initial ? (
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-1">
          <p className="text-sm font-medium">Admin overrides</p>
          <Field label="Status" htmlFor="status" hint="Normally moves through review; change here only to correct mistakes.">
            <NativeSelect id="status" name="status" defaultValue={initial.status}>
              {options(ARTICLE_STATUS).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Draft URL (Google Docs)" htmlFor="draft_url">
            <Input id="draft_url" name="draft_url" type="url" placeholder="https://docs.google.com/..." defaultValue={initial.draft_url ?? ""} />
          </Field>
          <Field label="Published URL" htmlFor="published_url">
            <Input id="published_url" name="published_url" type="url" placeholder="https://" defaultValue={initial.published_url ?? ""} />
          </Field>
        </div>
      ) : null}

      <FormError error={state.error} />

      <div className="flex gap-2">
        <SubmitButton>{initial ? "Save changes" : "Create article"}</SubmitButton>
        <LinkButton href={cancelHref} variant="outline">Cancel</LinkButton>
      </div>
    </form>
  );
}
