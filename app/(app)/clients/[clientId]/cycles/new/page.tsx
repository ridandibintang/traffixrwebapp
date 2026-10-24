import { CycleForm } from "@/components/forms/cycle-form";
import { createCycleAction } from "@/lib/actions/cycles";
import { addDays, todayIso } from "@/lib/dates";
import { OPEN_TASK_STATUSES } from "@/lib/labels";
import { getClientOr404 } from "@/lib/queries/clients";
import { createClient } from "@/lib/supabase/server";

export default async function NewCyclePage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { clientId } = await params;
  const { from } = await searchParams;
  const client = await getClientOr404(clientId);
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("cycles")
    .select("number, end_date")
    .eq("client_id", clientId)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Default to the day after the previous cycle, 14 days long, meeting on the last day.
  const start = last ? addDays(last.end_date, 1) : todayIso();
  const end = addDays(start, 13);

  let moveFrom: { cycleId: string; cycleNumber: number; openTasks: number } | undefined;
  if (from) {
    const [{ data: fromCycle }, { count }] = await Promise.all([
      supabase.from("cycles").select("id, number").eq("id", from).eq("client_id", clientId).maybeSingle(),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("cycle_id", from)
        .in("status", OPEN_TASK_STATUSES)
        .is("template_id", null),
    ]);
    if (fromCycle) {
      moveFrom = { cycleId: fromCycle.id, cycleNumber: fromCycle.number, openTasks: count ?? 0 };
    }
  }

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">New cycle</h2>
        {moveFrom ? (
          <p className="text-sm text-muted-foreground">
            Cycle {moveFrom.cycleNumber} is closed. Set up the next one for {client.name}.
          </p>
        ) : null}
      </div>
      <CycleForm
        action={createCycleAction.bind(null, clientId)}
        initial={{
          number: (last?.number ?? 0) + 1,
          start_date: start,
          end_date: end,
          meeting_date: end,
          status: last ? "planning" : "active",
          summary: null,
        }}
        isEdit={false}
        cancelHref={`/clients/${clientId}`}
        moveFrom={moveFrom}
      />
    </>
  );
}
