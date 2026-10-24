"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { initialFormState, type FormState } from "@/lib/form";
import { options, PAGE_TYPE, PRIORITY, SEARCH_INTENT } from "@/lib/labels";
import type { KeywordCluster } from "@/lib/types";

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: KeywordCluster;
  cancelHref: string;
};

export function ClusterForm({ action, initial, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <Field label="Cluster name" htmlFor="name" hint="One cluster usually becomes one page or article.">
        <Input id="name" name="name" required defaultValue={initial?.name ?? ""} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Search intent" htmlFor="intent">
          <NativeSelect id="intent" name="intent" defaultValue={initial?.intent ?? ""}>
            <option value="">Not set</option>
            {options(SEARCH_INTENT).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Page type" htmlFor="page_type">
          <NativeSelect id="page_type" name="page_type" defaultValue={initial?.page_type ?? ""}>
            <option value="">Not set</option>
            {options(PAGE_TYPE).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Target URL" htmlFor="target_url" hint="Existing or planned page for this cluster.">
          <Input id="target_url" name="target_url" type="url" placeholder="https://" defaultValue={initial?.target_url ?? ""} />
        </Field>
        <Field label="Priority" htmlFor="priority">
          <NativeSelect id="priority" name="priority" defaultValue={initial?.priority ?? "medium"}>
            {options(PRIORITY).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <FormError error={state.error} />

      <div className="flex gap-2">
        <SubmitButton>{initial ? "Save changes" : "Create cluster"}</SubmitButton>
        <LinkButton href={cancelHref} variant="outline">Cancel</LinkButton>
      </div>
    </form>
  );
}
