// Turns task templates into real tasks. Idempotent thanks to the unique
// (template_id, period_key) index: calling these twice never duplicates.
import type { SupabaseClient } from "@supabase/supabase-js";
import { endOfMonth, endOfWeek, isoWeekKey, monthKey, todayIso } from "@/lib/dates";
import type { Database, TablesInsert } from "@/lib/types";

type Db = SupabaseClient<Database>;

async function insertIgnoringDuplicates(supabase: Db, rows: TablesInsert<"tasks">[]) {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from("tasks")
    .upsert(rows, { onConflict: "template_id,period_key", ignoreDuplicates: true });
  if (error) throw new Error(`Template task generation failed: ${error.message}`);
}

/** Creates the per-cycle template tasks for a newly created cycle. */
export async function generateCycleTasks(
  supabase: Db,
  cycle: { id: string; client_id: string; end_date: string },
) {
  const { data: templates } = await supabase
    .from("task_templates")
    .select("*")
    .eq("frequency", "per_cycle")
    .or(`client_id.eq.${cycle.client_id},client_id.is.null`);

  await insertIgnoringDuplicates(
    supabase,
    (templates ?? []).map((t) => ({
      client_id: cycle.client_id,
      cycle_id: cycle.id,
      title: t.title,
      category: t.category,
      assignee_id: t.default_assignee_id,
      due_date: cycle.end_date,
      source: "template",
      template_id: t.id,
      period_key: cycle.id,
    })),
  );
}

/**
 * Creates this week's weekly tasks and this month's monthly tasks in every
 * active cycle (or only the given client's). Called when the dashboard or a
 * cycle page loads, so recurring tasks appear without a scheduler.
 */
export async function syncRecurringTasks(supabase: Db, clientId?: string) {
  const today = todayIso();

  let cyclesQuery = supabase
    .from("cycles")
    .select("id, client_id")
    .eq("status", "active");
  if (clientId) cyclesQuery = cyclesQuery.eq("client_id", clientId);
  const { data: cycles } = await cyclesQuery;
  if (!cycles || cycles.length === 0) return;

  const { data: templates } = await supabase
    .from("task_templates")
    .select("*")
    .in("frequency", ["weekly", "monthly"]);
  if (!templates || templates.length === 0) return;

  const rows: TablesInsert<"tasks">[] = [];
  for (const cycle of cycles) {
    for (const t of templates) {
      if (t.client_id && t.client_id !== cycle.client_id) continue;
      const weekly = t.frequency === "weekly";
      rows.push({
        client_id: cycle.client_id,
        cycle_id: cycle.id,
        title: t.title,
        category: t.category,
        assignee_id: t.default_assignee_id,
        due_date: weekly ? endOfWeek(today) : endOfMonth(today),
        source: "template",
        template_id: t.id,
        period_key: weekly ? isoWeekKey(today) : monthKey(today),
      });
    }
  }

  await insertIgnoringDuplicates(supabase, rows);
}
