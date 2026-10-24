import { MetricsImportForm } from "@/components/forms/metrics-import-form";
import { importMetricsAction } from "@/lib/actions/metrics";
import { addDays, todayIso } from "@/lib/dates";
import { getClientOr404 } from "@/lib/queries/clients";
import { createClient } from "@/lib/supabase/server";

/** Default period: the active cycle, else the last 14 days. */
async function defaultPeriod(clientId: string) {
  const supabase = await createClient();
  const { data: cycle } = await supabase
    .from("cycles")
    .select("start_date, end_date")
    .eq("client_id", clientId)
    .eq("status", "active")
    .maybeSingle();
  if (cycle) return { start: cycle.start_date, end: cycle.end_date };
  const today = todayIso();
  return { start: addDays(today, -13), end: today };
}

export default async function ImportMetricsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await getClientOr404(clientId);
  const period = await defaultPeriod(clientId);

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">Import metrics from CSV</h2>
        <p className="text-sm text-muted-foreground">
          Pick the source and the period the export covers. Re-importing the same period replaces the earlier numbers.
        </p>
      </div>
      <MetricsImportForm
        action={importMetricsAction.bind(null, clientId)}
        defaultPeriod={period}
        cancelHref={`/clients/${clientId}/metrics`}
      />
    </>
  );
}
