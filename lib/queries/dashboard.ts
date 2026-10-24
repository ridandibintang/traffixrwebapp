import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek, todayIso } from "@/lib/dates";
import { OPEN_TASK_STATUSES } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { syncRecurringTasks } from "@/lib/templates";

// Everything the cross-client dashboard and the off-page overview need.
export async function getDashboardData() {
  const supabase = await createClient();
  await syncRecurringTasks(supabase);

  const today = todayIso();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const in7Days = addDays(today, 7);
  const in14Days = addDays(today, 14);

  const [clients, tasks, cycles, articles, backlinks, gbpPosts] = await Promise.all([
    supabase.from("clients").select("id, name, status").eq("status", "active").order("name"),
    supabase
      .from("tasks")
      .select("*, client:clients(name), assignee:profiles!tasks_assignee_id_fkey(full_name)")
      .in("status", OPEN_TASK_STATUSES)
      .lte("due_date", weekEnd)
      .order("due_date"),
    supabase
      .from("cycles")
      .select("*, client:clients(name)")
      .in("status", ["active", "review"])
      .order("meeting_date", { ascending: true, nullsFirst: false }),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    supabase
      .from("backlinks")
      .select("id, client_id, status, source_domain, target_url, month")
      .gte("month", monthStart)
      .lte("month", monthEnd),
    supabase
      .from("gbp_posts")
      .select("id, client_id, scheduled_date, title, status, post_type")
      .gte("scheduled_date", weekStart)
      .lte("scheduled_date", in14Days)
      .order("scheduled_date"),
  ]);

  return {
    today,
    weekStart,
    weekEnd,
    in7Days,
    monthStart,
    clients: clients.data ?? [],
    tasksDue: tasks.data ?? [],
    cycles: cycles.data ?? [],
    articlesWaitingReview: articles.count ?? 0,
    backlinksThisMonth: backlinks.data ?? [],
    gbpPosts: gbpPosts.data ?? [],
  };
}
