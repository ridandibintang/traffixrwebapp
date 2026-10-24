"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { formatRange } from "@/lib/dates";
import { initialFormState, type FormState } from "@/lib/form";
import { AUDIT_TYPE, options } from "@/lib/labels";

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  cycles: { id: string; number: number; start_date: string; end_date: string; status: string }[];
  defaultCycleId: string | null;
  defaultDate: string;
  cancelHref: string;
};

export function AuditUploadForm({ action, cycles, defaultCycleId, defaultDate, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);
  const [fileNames, setFileNames] = useState<string[]>([]);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Audit type" htmlFor="type">
          <NativeSelect id="type" name="type" defaultValue="technical">
            {options(AUDIT_TYPE).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Cycle" htmlFor="cycle_id" hint="Tasks created from this crawl go into this cycle.">
          <NativeSelect id="cycle_id" name="cycle_id" defaultValue={defaultCycleId ?? ""}>
            <option value="">No cycle</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                Cycle {c.number} · {formatRange(c.start_date, c.end_date)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Crawl date" htmlFor="crawl_date">
          <Input id="crawl_date" name="crawl_date" type="date" required defaultValue={defaultDate} />
        </Field>
      </div>

      <Field
        label="Crawl export files"
        htmlFor="files"
        hint="Screaming Frog CSVs (Bulk Export > Issues > All, one per issue, optionally plus Reports > Issues Overview) or an audit workbook (.xlsx) with one sheet per issue and an Issue Tracker sheet."
      >
        <Input
          id="files"
          name="files"
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          multiple
          required
          onChange={(e) => setFileNames(Array.from(e.target.files ?? []).map((f) => f.name))}
        />
      </Field>
      {fileNames.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          {fileNames.length} file{fileNames.length === 1 ? "" : "s"} selected: {fileNames.slice(0, 6).join(", ")}
          {fileNames.length > 6 ? ` and ${fileNames.length - 6} more` : ""}
        </p>
      ) : null}

      <FormError error={state.error} />

      <div className="flex gap-2">
        <SubmitButton pendingText="Importing crawl...">Import crawl</SubmitButton>
        <LinkButton href={cancelHref} variant="outline">Cancel</LinkButton>
      </div>
    </form>
  );
}
