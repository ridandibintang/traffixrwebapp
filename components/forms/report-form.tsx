"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/shared/field";
import { SubmitButton } from "@/components/shared/submit-button";
import { initialFormState, type FormState } from "@/lib/form";
import { options, REPORT_STATUS } from "@/lib/labels";
import type { Report } from "@/lib/types";

export function ReportForm({
  action,
  report,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  report: Report;
}) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Period start" htmlFor="period_start">
          <Input id="period_start" name="period_start" type="date" required defaultValue={report.period_start} />
        </Field>
        <Field label="Period end" htmlFor="period_end">
          <Input id="period_end" name="period_end" type="date" required defaultValue={report.period_end} />
        </Field>
        <Field label="Status" htmlFor="status" hint="Final once it has been presented to the client.">
          <NativeSelect id="status" name="status" defaultValue={report.status}>
            {options(REPORT_STATUS).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <Field label="1. Work completed" htmlFor="done_summary">
        <Textarea id="done_summary" name="done_summary" rows={4} defaultValue={report.done_summary ?? ""} />
      </Field>
      <Field label="2. Off-page" htmlFor="offpage_summary">
        <Textarea id="offpage_summary" name="offpage_summary" rows={3} defaultValue={report.offpage_summary ?? ""} />
      </Field>
      <Field label="3. Organic performance" htmlFor="performance_summary">
        <Textarea id="performance_summary" name="performance_summary" rows={4} defaultValue={report.performance_summary ?? ""} />
      </Field>
      <Field label="4. Plan for the next cycle" htmlFor="next_plan">
        <Textarea id="next_plan" name="next_plan" rows={4} defaultValue={report.next_plan ?? ""} />
      </Field>
      <Field label="Notes" htmlFor="notes" hint="Anything else for the meeting: blockers, requests from the client, decisions needed.">
        <Textarea id="notes" name="notes" rows={3} defaultValue={report.notes ?? ""} />
      </Field>

      <FormError error={state.error} />
      <SubmitButton className="self-start">Save report</SubmitButton>
    </form>
  );
}
