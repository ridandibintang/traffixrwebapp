import { ManualMetricsForm } from "@/components/forms/manual-metrics-form";
import { saveManualTotalsAction } from "@/lib/actions/metrics";
import { addDays, todayIso } from "@/lib/dates";
import { getClientOr404 } from "@/lib/queries/clients";
import { createClient } from "@/lib/supabase/server";

export default async function ManualMetricsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await getClientOr404(clientId);
  const supabase = await createClient();
  const { data: cycle } = await supabase
    .from("cycles")
    .select("start_date, end_date")
    .eq("client_id", clientId)
    .eq("status", "active")
    .maybeSingle();
  const today = todayIso();
  const period = cycle ? { start: cycle.start_date, end: cycle.end_date } : { start: addDays(today, -13), end: today };

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">Enter period totals</h2>
        <p className="text-sm text-muted-foreground">
          Type the headline numbers straight from the Search Console or GA4 dashboard when a CSV is overkill.
        </p>
      </div>
      <ManualMetricsForm
        action={saveManualTotalsAction.bind(null, clientId)}
        defaultPeriod={period}
        cancelHref={`/clients/${clientId}/metrics`}
      />
    </>
  );
}
