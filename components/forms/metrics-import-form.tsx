"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, FormError } from "@/components/shared/field";
import { LinkButton } from "@/components/shared/link-button";
import { SubmitButton } from "@/components/shared/submit-button";
import type { MetricsImportState } from "@/lib/actions/metrics";
import { detectGa4PeriodAction } from "@/lib/actions/metrics";
import { METRIC_SOURCE, options } from "@/lib/labels";
import type { MetricSource } from "@/lib/types";

type Props = {
  action: (prev: MetricsImportState, fd: FormData) => Promise<MetricsImportState>;
  defaultPeriod: { start: string; end: string };
  cancelHref: string;
};

const HINTS: Record<MetricSource, string> = {
  gsc: "Search Console > Performance > Export > Download CSV, then unzip. Upload Dates.csv for period totals, Queries.csv for top queries, Pages.csv for top pages (any combination).",
  ga4: "GA4 > Reports > Acquisition > Traffic acquisition > Share > Download file (CSV) for organic totals; Engagement > Landing page (filtered to Organic Search) for top pages.",
};

export function MetricsImportForm({ action, defaultPeriod, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, { error: null } as MetricsImportState);
  const [source, setSource] = useState<MetricSource>("gsc");
  const [period, setPeriod] = useState(defaultPeriod);
  const [fileNames, setFileNames] = useState<string[]>([]);

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
          <Input id="period_start" name="period_start" type="date" required value={period.start} onChange={(e) => setPeriod({ ...period, start: e.target.value })} />
        </Field>
        <Field label="Period end" htmlFor="period_end">
          <Input id="period_end" name="period_end" type="date" required value={period.end} onChange={(e) => setPeriod({ ...period, end: e.target.value })} />
        </Field>
      </div>

      <Field label="CSV files" htmlFor="files" hint={HINTS[source]}>
        <Input
          id="files"
          name="files"
          type="file"
          accept=".csv,text/csv"
          multiple
          required
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            setFileNames(files.map((f) => f.name));
            // GA4 exports carry their date range in the header; use it when present.
            if (source === "ga4" && files[0]) {
              const detected = await detectGa4PeriodAction((await files[0].text()).slice(0, 2000));
              if (detected?.start && detected?.end) setPeriod({ start: detected.start, end: detected.end });
            }
          }}
        />
      </Field>
      {fileNames.length > 0 ? (
        <p className="text-sm text-muted-foreground">{fileNames.length} file{fileNames.length === 1 ? "" : "s"}: {fileNames.join(", ")}</p>
      ) : null}

      <FormError error={state.error} />
      {state.imported ? (
        <ul className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          {state.imported.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <SubmitButton pendingText="Importing...">Import</SubmitButton>
        <LinkButton href={cancelHref} variant="outline">Back to metrics</LinkButton>
      </div>
    </form>
  );
}
