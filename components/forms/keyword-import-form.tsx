"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import type { ImportState } from "@/lib/actions/keywords";
import { KEYWORD_SOURCE, options } from "@/lib/labels";

type Props = {
  action: (prev: ImportState, fd: FormData) => Promise<ImportState>;
  clusters: { id: string; name: string }[];
  backHref: string;
};

export function KeywordImportForm({ action, clusters, backHref }: Props) {
  const [state, formAction] = useActionState(action, { error: null } as ImportState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <Field
        label="CSV file"
        htmlFor="file"
        hint="Needs a keyword column. Optional columns: volume, difficulty (KD), CPC, intent, cluster. Header names are matched, not positions."
      >
        <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Default cluster" htmlFor="cluster_id" hint="Used when the file has no cluster column.">
          <NativeSelect id="cluster_id" name="cluster_id" defaultValue="">
            <option value="">No cluster</option>
            {clusters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Data source" htmlFor="source">
          <NativeSelect id="source" name="source" defaultValue="manual">
            {options(KEYWORD_SOURCE).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <FormError error={state.error} />
      {state.imported != null ? (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          Imported {state.imported} keyword{state.imported === 1 ? "" : "s"}
          {state.skipped ? `, skipped ${state.skipped} empty or duplicate row${state.skipped === 1 ? "" : "s"}` : ""}.
          Existing keywords were updated in place.
        </p>
      ) : null}

      <div className="flex gap-2">
        <SubmitButton pendingText="Importing...">Import keywords</SubmitButton>
        <LinkButton href={backHref} variant="outline">Back to keywords</LinkButton>
      </div>
    </form>
  );
}
