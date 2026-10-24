"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { initialFormState, type FormState } from "@/lib/form";
import { KEYWORD_SOURCE, options, SEARCH_INTENT } from "@/lib/labels";
import type { Keyword } from "@/lib/types";

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: Keyword;
  defaultClusterId?: string | null;
  clusters: { id: string; name: string }[];
  cancelHref: string;
};

export function KeywordForm({ action, initial, defaultClusterId, clusters, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <Field label="Keyword" htmlFor="keyword">
        <Input id="keyword" name="keyword" required defaultValue={initial?.keyword ?? ""} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cluster" htmlFor="cluster_id">
          <NativeSelect id="cluster_id" name="cluster_id" defaultValue={initial?.cluster_id ?? defaultClusterId ?? ""}>
            <option value="">No cluster</option>
            {clusters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Search intent" htmlFor="intent">
          <NativeSelect id="intent" name="intent" defaultValue={initial?.intent ?? ""}>
            <option value="">Not set</option>
            {options(SEARCH_INTENT).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Search volume" htmlFor="search_volume">
          <Input id="search_volume" name="search_volume" type="number" min={0} defaultValue={initial?.search_volume ?? ""} />
        </Field>
        <Field label="Difficulty (0–100)" htmlFor="difficulty">
          <Input id="difficulty" name="difficulty" type="number" min={0} max={100} step="0.1" defaultValue={initial?.difficulty ?? ""} />
        </Field>
        <Field label="CPC" htmlFor="cpc">
          <Input id="cpc" name="cpc" type="number" min={0} step="0.01" defaultValue={initial?.cpc ?? ""} />
        </Field>
        <Field label="Source" htmlFor="source">
          <NativeSelect id="source" name="source" defaultValue={initial?.source ?? "manual"}>
            {options(KEYWORD_SOURCE).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <FormError error={state.error} />

      <div className="flex gap-2">
        <SubmitButton>{initial ? "Save changes" : "Add keyword"}</SubmitButton>
        <LinkButton href={cancelHref} variant="outline">Cancel</LinkButton>
      </div>
    </form>
  );
}
