"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { initialFormState, type FormState } from "@/lib/form";
import { METRIC_SOURCE, options } from "@/lib/labels";
import type { MetricSource } from "@/lib/types";

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  defaultPeriod: { start: string; end: string };
  cancelHref: string;
};

export function ManualMetricsForm({ action, defaultPeriod, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);
  const [source, setSource] = useState<MetricSource>("gsc");

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Source" htmlFor="source">
          <NativeSelect id="source" name="source" value={source} onChange={(e) => setSource(e.target.value as MetricSource)}>
            {options(METRIC_SOURCE).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Period start" htmlFor="period_start">
          <Input id="period_start" name="period_start" type="date" required defaultValue={defaultPeriod.start} />
        </Field>
        <Field label="Period end" htmlFor="period_end">
          <Input id="period_end" name="period_end" type="date" required defaultValue={defaultPeriod.end} />
        </Field>
      </div>

      {source === "gsc" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Clicks" htmlFor="clicks"><Input id="clicks" name="clicks" type="number" min={0} required /></Field>
          <Field label="Impressions" htmlFor="impressions"><Input id="impressions" name="impressions" type="number" min={0} required /></Field>
          <Field label="Average position" htmlFor="position"><Input id="position" name="position" type="number" min={0} step="0.1" /></Field>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Organic sessions" htmlFor="sessions"><Input id="sessions" name="sessions" type="number" min={0} required /></Field>
          <Field label="Engaged sessions" htmlFor="engaged_sessions"><Input id="engaged_sessions" name="engaged_sessions" type="number" min={0} /></Field>
          <Field label="Key events (conversions)" htmlFor="key_events"><Input id="key_events" name="key_events" type="number" min={0} /></Field>
        </div>
      )}

      <FormError error={state.error} />

      <div className="flex gap-2">
        <SubmitButton>Save totals</SubmitButton>
        <LinkButton href={cancelHref} variant="outline">Cancel</LinkButton>
      </div>
    </form>
  );
}
