import { createClient } from "@/lib/supabase/server";
import type { Task, TaskCategory } from "@/lib/types";

export type TaskWithAssignee = Task & { assignee: { full_name: string } | null };

const TASK_SELECT = "*, assignee:profiles!tasks_assignee_id_fkey(full_name)";

export async function getCycleTasks(cycleId: string, category?: TaskCategory | null) {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("cycle_id", cycleId)
    .order("priority", { ascending: false })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at");
  if (category) query = query.eq("category", category);
  const { data } = await query;
  return (data ?? []) as TaskWithAssignee[];
}

export async function getBacklogTasks(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("client_id", clientId)
    .is("cycle_id", null)
    .not("status", "in", "(done,wont_do)")
    .order("created_at");
  return (data ?? []) as TaskWithAssignee[];
}
