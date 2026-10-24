"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { initialFormState, type FormState } from "@/lib/form";
import { FINDING_SEVERITY, options, TASK_CATEGORY } from "@/lib/labels";
import type { FindingSeverity, TaskCategory } from "@/lib/types";

export type RuleDefaults = {
  issue_name: string;
  category: TaskCategory;
  default_severity: FindingSeverity;
  task_title_template: string | null;
  ignore_by_default: boolean;
};

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial: RuleDefaults;
  /** Lock the issue name (classifying from an audit page). */
  lockIssueName?: boolean;
  returnTo?: string;
  cancelHref?: string;
  compact?: boolean;
  submitLabel?: string;
};

export function IssueRuleForm({ action, initial, lockIssueName, returnTo, cancelHref, compact, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className={compact ? "flex flex-col gap-3" : "flex max-w-2xl flex-col gap-6"}>
      {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}
      {lockIssueName ? <input type="hidden" name="issue_name" value={initial.issue_name} /> : null}

      <div className={compact ? "grid gap-3 sm:grid-cols-3" : "grid gap-4 sm:grid-cols-2"}>
        {!lockIssueName ? (
          <Field label="Issue name" htmlFor="issue_name" hint='As Screaming Frog names it, e.g. "Page Titles: Duplicate".' className="sm:col-span-2">
            <Input id="issue_name" name="issue_name" required defaultValue={initial.issue_name} />
          </Field>
        ) : null}
        <Field label="Category" htmlFor="category">
          <NativeSelect id="category" name="category" defaultValue={initial.category}>
            {options(TASK_CATEGORY).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Default severity" htmlFor="default_severity">
          <NativeSelect id="default_severity" name="default_severity" defaultValue={initial.default_severity}>
            {options(FINDING_SEVERITY).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          label="Task title template"
          htmlFor="task_title_template"
          hint="Placeholders: {issue}, {count}, {client}."
          className={compact ? "" : "sm:col-span-2"}
        >
          <Input
            id="task_title_template"
            name="task_title_template"
            placeholder="{issue} ({count} URLs)"
            defaultValue={initial.task_title_template ?? ""}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="ignore_by_default" defaultChecked={initial.ignore_by_default} className="size-4" />
        Ignore this issue by default (never suggest it as a task)
      </label>

      <FormError error={state.error} />

      <div className="flex gap-2">
        <SubmitButton size={compact ? "sm" : "default"}>{submitLabel ?? "Save rule"}</SubmitButton>
        {cancelHref ? (
          <LinkButton href={cancelHref} variant="outline" size={compact ? "sm" : "default"}>Cancel</LinkButton>
        ) : null}
      </div>
    </form>
  );
}
